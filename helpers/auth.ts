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

import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export const storeAuthToken = async (token: string) => {
	await AsyncStorage.setItem("authToken", token);
};

export const storeUser = async (username: string) => {
	await AsyncStorage.setItem("user", username);
};

export const getAuthToken = async (): Promise<string | null> => {
	return await AsyncStorage.getItem("authToken");
};

export const getUser = async (): Promise<string | null> => {
	return await AsyncStorage.getItem("user");
};

export const clearAuthData = async (
	router: ReturnType<typeof useRouter>,
	navigateRoute: string = "/",
) => {
	await AsyncStorage.removeItem("authToken");
	await AsyncStorage.removeItem("user");
	router.dismissAll();
	router.replace(navigateRoute);
};

export const checkLoggedIn = async (
	router: ReturnType<typeof useRouter>,
	navigateRoute: string = "FeedListScreen",
) => {
	const authToken = await getAuthToken();
	if (authToken) {
		router.replace(navigateRoute);
	}
};

export const handleSessionExpired = async (router: ReturnType<typeof useRouter>) => {
	Alert.alert("Session Expired", "Your session has expired. Please log in again.");
	await clearAuthData(router);
};

import { refreshToken } from "./api";

export const refreshTokenOnLoad = async () => {
	try {
		const newToken = await refreshToken();
		if (newToken) {
			await storeAuthToken(newToken);
		}
	} catch (error) {
		console.error("Failed to refresh token:", error);
	}
};