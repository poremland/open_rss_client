import "../setup";
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

import * as setup from "../setup";
import { expect, describe, it, beforeEach, spyOn, mock } from "bun:test";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { auth } from "../../helpers/auth_helper";
import { api as apiInstance } from "../../helpers/api_helper";

describe("auth helpers", () => {
	beforeEach(async () => {
		setup.resetAll();
		auth.setDeps({
			storage: AsyncStorage,
			alert: Alert,
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

		await auth.clearAuthData(setup.routerMocks as any);

		expect(AsyncStorage.removeItem).toHaveBeenCalledWith("authToken");
		expect(AsyncStorage.removeItem).toHaveBeenCalledWith("user");
		expect(setup.routerMocks.dismissAll).toHaveBeenCalled();
		expect(setup.routerMocks.replace).toHaveBeenCalledWith("/");
	});

	it("should navigate to feed list if logged in", async () => {
		await auth.storeAuthToken("test-token");
		await auth.checkLoggedIn(setup.routerMocks as any);
		expect(setup.routerMocks.replace).toHaveBeenCalledWith("FeedListScreen");
	});

	it("should not navigate if not logged in", async () => {
		await auth.checkLoggedIn(setup.routerMocks as any);
		expect(setup.routerMocks.replace).not.toHaveBeenCalled();
	});

	it("should refresh token on load", async () => {
		const refreshTokenSpy = spyOn(apiInstance, "refreshToken").mockResolvedValue("new-token");
		await auth.refreshTokenOnLoad();
		expect(await auth.getAuthToken()).toBe("new-token");
		refreshTokenSpy.mockRestore();
	});

	it("should handle session expired", async () => {
		await auth.handleSessionExpired(setup.routerMocks as any);
		expect(Alert.alert).toHaveBeenCalledWith(
			"Session Expired",
			"Your session has expired. Please log in again.",
		);
		expect(setup.routerMocks.dismissAll).toHaveBeenCalled();
		expect(setup.routerMocks.replace).toHaveBeenCalledWith("/");
	});
});
