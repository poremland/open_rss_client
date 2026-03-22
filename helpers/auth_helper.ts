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
import { api } from "./api_helper";

export interface AuthDeps {
	storage: typeof AsyncStorage;
	alert: typeof Alert;
}

class Auth {
	private deps: AuthDeps = {
		storage: AsyncStorage,
		alert: Alert,
	};

	setDeps(deps: Partial<AuthDeps>) {
		this.deps = { ...this.deps, ...deps };
	}

	storeAuthToken = async (token: string) => {
		await this.deps.storage.setItem("authToken", token);
	};

	getAuthToken = async () => {
		return await this.deps.storage.getItem("authToken");
	};

	storeUser = async (user: string) => {
		await this.deps.storage.setItem("user", user);
	};

	getUser = async () => {
		return await this.deps.storage.getItem("user");
	};

	clearAuthData = async (router: any) => {
		await this.deps.storage.removeItem("authToken");
		await this.deps.storage.removeItem("user");
		router.dismissAll();
		router.replace("/");
	};

	checkLoggedIn = async (router: any) => {
		const token = await this.getAuthToken();
		if (token) {
			router.replace("FeedListScreen");
		}
	};

	handleSessionExpired = async (router: any) => {
		this.deps.alert.alert(
			"Session Expired",
			"Your session has expired. Please log in again.",
		);
		router.dismissAll();
		router.replace("/");
	};

	refreshTokenOnLoad = async () => {
		try {
			const newToken = await api.refreshToken();
			if (newToken) {
				await this.storeAuthToken(newToken);
			}
		} catch (error) {
			console.error("Failed to refresh token:", error);
		}
	};
}

export const auth = new Auth();
export const storeAuthToken = auth.storeAuthToken;
export const getAuthToken = auth.getAuthToken;
export const storeUser = auth.storeUser;
export const getUser = auth.getUser;
export const clearAuthData = auth.clearAuthData;
export const checkLoggedIn = auth.checkLoggedIn;
export const handleSessionExpired = auth.handleSessionExpired;
export const refreshTokenOnLoad = auth.refreshTokenOnLoad;
