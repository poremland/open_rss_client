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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import {
	storeAuthToken,
	storeUser,
	getAuthToken,
	getUser,
	clearAuthData,
	checkLoggedIn,
	refreshTokenOnLoad,
	handleSessionExpired,
} from "../../helpers/auth";
import * as api from "../../helpers/api";

const mockRouter = {
	dismissAll: jest.fn(),
	replace: jest.fn(),
};

jest.mock("react-native", () => ({ Alert: { alert: jest.fn() } }));
jest.mock("../../helpers/api", () => ({
	...jest.requireActual("../../helpers/api"),
	refreshToken: jest.fn(),
}));

describe("auth helpers", () => {
	beforeEach(() => {
		AsyncStorage.clear();
		mockRouter.dismissAll.mockClear();
		mockRouter.replace.mockClear();
		(api.refreshToken as jest.Mock).mockClear();
		(Alert.alert as jest.Mock).mockClear();
	});

	it("should store and retrieve auth token", async () => {
		await storeAuthToken("test-token");
		const token = await getAuthToken();
		expect(token).toBe("test-token");
	});

	it("should store and retrieve user", async () => {
		await storeUser("test-user");
		const user = await getUser();
		expect(user).toBe("test-user");
	});

	it("should clear auth data and navigate", async () => {
		await storeAuthToken("test-token");
		await storeUser("test-user");

		await clearAuthData(mockRouter as any);

		expect(await getAuthToken()).toBeNull();
		expect(await getUser()).toBeNull();
		expect(mockRouter.dismissAll).toHaveBeenCalled();
		expect(mockRouter.replace).toHaveBeenCalledWith("/");
	});

	it("should navigate to feed list if logged in", async () => {
		await storeAuthToken("test-token");
		await checkLoggedIn(mockRouter as any);
		expect(mockRouter.replace).toHaveBeenCalledWith("FeedListScreen");
	});

	it("should not navigate if not logged in", async () => {
		await checkLoggedIn(mockRouter as any);
		expect(mockRouter.replace).not.toHaveBeenCalled();
	});

	it("should refresh token on load", async () => {
		(api.refreshToken as jest.Mock).mockResolvedValue("new-token");
		await refreshTokenOnLoad();
		expect(await getAuthToken()).toBe("new-token");
	});

	it("should handle session expired", async () => {
		await handleSessionExpired(mockRouter as any);
		expect(Alert.alert).toHaveBeenCalledWith(
			"Session Expired",
			"Your session has expired. Please log in again.",
		);
		expect(mockRouter.dismissAll).toHaveBeenCalled();
		expect(mockRouter.replace).toHaveBeenCalledWith("/");
	});
});
