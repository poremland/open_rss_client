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
import "../setup";
import { mock, expect, describe, it, beforeEach, spyOn } from "bun:test";
import { Auth } from "../../helpers/auth_helper.impl";
import { api as apiInstance } from "../../helpers/api_helper.impl";

const storageMap = new Map();
const asyncStorageMock = {
	setItem: mock(async (k: string, v: any) => { storageMap.set(k, String(v)); }),
	getItem: mock(async (k: string) => { 
		const val = storageMap.get(k);
		return val === undefined ? null : val;
	}),
	removeItem: mock(async (k: string) => { storageMap.delete(k); }),
	clear: mock(async () => { storageMap.clear(); }),
	getAllKeys: mock(async () => Array.from(storageMap.keys())),
	multiGet: mock(async (keys: string[]) => keys.map(k => [k, storageMap.get(k) || null])),
};

mock.module("@react-native-async-storage/async-storage", () => ({
	__esModule: true,
	default: asyncStorageMock,
	...asyncStorageMock,
}));

const alertMock = mock();
mock.module("react-native", () => ({
	Alert: { alert: alertMock }
}));

const routerMocks = {
	push: mock(),
	replace: mock(),
	back: mock(),
	dismissAll: mock(),
};

describe("auth helpers", () => {
	let auth: Auth;

	beforeEach(async () => {
		storageMap.clear();
		Object.values(asyncStorageMock).forEach(m => m.mockClear());
		alertMock.mockClear();
		Object.values(routerMocks).forEach(m => m.mockClear());
		
		auth = new Auth();
		auth.setDeps({
			storage: asyncStorageMock as any,
			alert: { alert: alertMock } as any,
		});
	});

	it("should store and retrieve auth token", async () => {
		await auth.storeAuthToken("test-token");
		const token = await auth.getAuthToken();
		expect(token).toBe("test-token");
	});

	it("should store and retrieve user", async () => {
		await auth.storeUser("test-user");
		const user = await auth.getUser();
		expect(user).toBe("test-user");
	});

	it("should clear auth data and navigate", async () => {
		await auth.storeAuthToken("test-token");
		await auth.storeUser("test-user");

		await auth.clearAuthData(routerMocks as any);

		expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("authToken");
		expect(asyncStorageMock.removeItem).toHaveBeenCalledWith("user");
		expect(routerMocks.dismissAll).toHaveBeenCalled();
		expect(routerMocks.replace).toHaveBeenCalledWith("/");
	});

	it("should navigate to feed list if logged in", async () => {
		await auth.storeAuthToken("test-token");
		await auth.checkLoggedIn(routerMocks as any);
		expect(routerMocks.replace).toHaveBeenCalledWith("FeedListScreen");
	});

	it("should not navigate if not logged in", async () => {
		await auth.checkLoggedIn(routerMocks as any);
		expect(routerMocks.replace).not.toHaveBeenCalled();
	});

	it("should refresh token on load", async () => {
		const refreshTokenSpy = spyOn(apiInstance, "refreshToken").mockResolvedValue("new-token");
		await auth.refreshTokenOnLoad();
		expect(await auth.getAuthToken()).toBe("new-token");
		refreshTokenSpy.mockRestore();
	});

	it("should handle session expired", async () => {
		await auth.handleSessionExpired(routerMocks as any);
		expect(alertMock).toHaveBeenCalledWith(
			"Session Expired",
			"Your session has expired. Please log in again.",
		);
		expect(routerMocks.dismissAll).toHaveBeenCalled();
		expect(routerMocks.replace).toHaveBeenCalledWith("/");
	});
});
