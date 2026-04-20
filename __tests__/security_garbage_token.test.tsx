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
import { expect, describe, it, beforeEach, afterEach, spyOn, mock } from "bun:test";
import "./setup";
import { mocks, storageMap } from "./setup";
import { auth } from "../helpers/auth_helper";
import { api } from "../helpers/api_helper";

describe("Security: Garbage Token Handling", () => {
	beforeEach(() => {
		(globalThis as any).__disableApiMock = true;
		(globalThis as any).__disableAuthMock = true;
		mocks.resetAll();
		storageMap.clear();
	});

	afterEach(() => {
		(globalThis as any).__disableApiMock = false;
		(globalThis as any).__disableAuthMock = false;
	});

	it("should NOT navigate to FeedListScreen if token is invalid (401)", async () => {
		await storageMap.set("authToken", "garbage-token");
		await storageMap.set("serverUrl", "https://rss.example.com");

		// Spy on clearAuthData to verify it is called
		const clearAuthDataSpy = spyOn(auth, "clearAuthData");
		const getWithAuthSpy = spyOn(api, "getWithAuth").mockRejectedValue(new Error("Session expired"));
		
		const routerReplaceSpy = mocks.router.replace;
		
		await auth.checkLoggedIn(mocks.router);

		// Should have called clearAuthData
		expect(clearAuthDataSpy).toHaveBeenCalled();
		
		// Should NOT have replaced with FeedListScreen
		expect(routerReplaceSpy).not.toHaveBeenCalledWith("/FeedListScreen");
		
		clearAuthDataSpy.mockRestore();
		getWithAuthSpy.mockRestore();
	});
});
