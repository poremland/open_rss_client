/*
 * RSS Reader: A mobile application for consuming RSS feeds.
 * Copyright (C) 2025 Paul Oremland
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { Auth } from "../../helpers/auth_helper.impl";
import { Api } from "../../helpers/api_helper.impl";
import { mocks } from "../setup";

const alertMock = mocks.alert;
const asyncStorageMock = mocks.asyncStorageMock;
const routerMocks = mocks.routerMocks;
const storageMap = mocks.storageMap;
const createFetchResponse = mocks.createFetchResponse;

describe("auth helpers", () => {
	let auth: Auth;
	let localFetchMock: any;

	beforeEach(async () => {
		(globalThis as any).__disableAuthMock = true;
		(globalThis as any).__disableApiMock = true;
		
		storageMap.clear();
		asyncStorageMock.setItem.mockClear();
		asyncStorageMock.getItem.mockClear();
		asyncStorageMock.removeItem.mockClear();
		routerMocks.replace.mockClear();
		if (alertMock.mockClear) alertMock.mockClear();
		
		localFetchMock = mock(() => Promise.resolve(createFetchResponse(true, 200, {})));

		// Explicitly inject mocks and isolated Api
		const localApi = new Api({ storage: asyncStorageMock, fetch: localFetchMock });
		auth = new Auth({ storage: asyncStorageMock, router: routerMocks, api: localApi });
	});

	afterEach(() => {
		(globalThis as any).__disableAuthMock = false;
		(globalThis as any).__disableApiMock = false;
	});

	it("should store and retrieve auth token", async () => {
		await auth.storeAuthToken("test-token");
		const token = await auth.getAuthToken();
		expect(token).toBe("test-token");
		expect(asyncStorageMock.setItem).toHaveBeenCalledWith("authToken", "test-token");
	});

	it("should store and retrieve user", async () => {
		await auth.storeUser("test-user");
		const user = await auth.getUser();
		expect(user).toBe("test-user");
		expect(asyncStorageMock.setItem).toHaveBeenCalledWith("user", "test-user");
	});

	it("should clear auth data and navigate", async () => {
		await auth.storeAuthToken("test-token");
		await auth.storeUser("test-user");

		await auth.clearAuthData();

		expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("authToken");
		expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("user");
		expect(routerMocks.replace).toHaveBeenCalledWith("/");
	});

	it("should navigate to feed list if logged in", async () => {
		await auth.storeAuthToken("test-token");
		await auth.checkLoggedIn();
		expect(routerMocks.replace).toHaveBeenCalledWith("FeedListScreen");
	});

	it("should not navigate if not logged in", async () => {
		await auth.checkLoggedIn();
		expect(routerMocks.replace).not.toHaveBeenCalled();
	});

	it("should refresh token on load", async () => {
		await asyncStorageMock.setItem("authToken", "old-token");
		await asyncStorageMock.setItem("serverUrl", "http://localhost");
		
		localFetchMock.mockResolvedValue(createFetchResponse(true, 200, { token: "new-token" }));
		
		await auth.refreshTokenOnLoad();
		
		const token = await auth.getAuthToken();
		expect(token).toBe("new-token");
	});

	it("should handle session expired", async () => {
		await auth.handleSessionExpired();
		expect(alertMock).toHaveBeenCalledWith(
			"Session Expired",
			"Your session has expired. Please log in again.",
		);
		expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("authToken");
		expect(routerMocks.replace).toHaveBeenCalledWith("/");
	});
});
