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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { api as apiInstance, Api } from './api_helper';

export interface AuthDeps {
	storage: {
		getItem: (key: string) => Promise<string | null>;
		setItem: (key: string, value: string) => Promise<void>;
		removeItem: (key: string) => Promise<void>;
	};
	router: {
		replace: (route: string) => void;
	};
	fetch?: typeof fetch;
	api?: Api;
}

export class Auth {
	private _deps: AuthDeps | undefined;

	constructor(deps?: AuthDeps) {
		this._deps = deps;
	}

	private get deps(): AuthDeps {
		if (this._deps) return this._deps;
		const g = (globalThis as any);
		return {
			storage: g.AsyncStorage || AsyncStorage,
			router: {
				replace: () => {},
			},
			fetch: g.fetch || fetch,
			api: apiInstance,
		};
	}

	private get fetch(): typeof fetch {
		return this.deps.fetch || fetch;
	}

	private get api(): Api {
		return this.deps.api || apiInstance;
	}

	setDeps(deps: AuthDeps) {
		this._deps = deps;
	}

	storeAuthToken = async (token: string) => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.storeAuthToken) return g.authMocks.storeAuthToken(token);
		await this.deps.storage.setItem('authToken', token);
	};

	getAuthToken = async () => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.getAuthToken) return g.authMocks.getAuthToken();
		return await this.deps.storage.getItem('authToken');
	};

	storeUser = async (user: string) => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.storeUser) return g.authMocks.storeUser(user);
		await this.deps.storage.setItem('user', user);
	};

	getUser = async () => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.getUser) return g.authMocks.getUser();
		return await this.deps.storage.getItem('user');
	};

	clearAuthData = async (router?: any) => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.clearAuthData) return g.authMocks.clearAuthData(router);
		
		await this.deps.storage.removeItem('authToken');
		await this.deps.storage.removeItem('user');
		if (router) {
			router.replace('/');
		} else {
			this.deps.router.replace('/');
		}
	};

	checkLoggedIn = async (router?: any) => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.checkLoggedIn) return g.authMocks.checkLoggedIn(router);

		const token = await this.getAuthToken();
		if (token) {
			if (router) {
				router.replace('FeedListScreen');
			} else {
				this.deps.router.replace('FeedListScreen');
			}
		}
	};

	handleSessionExpired = async (router?: any) => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.handleSessionExpired) return g.authMocks.handleSessionExpired(router);

		const { Alert } = require('react-native');
		await this.clearAuthData(router);
		Alert.alert('Session Expired', 'Your session has expired. Please log in again.');
	};

	refreshTokenOnLoad = async () => {
		const g = (globalThis as any);
		if (!g.__disableAuthMock && g.authMocks && g.authMocks.refreshTokenOnLoad) return g.authMocks.refreshTokenOnLoad();

		const token = await this.api.refreshToken();
		if (token) {
			await this.storeAuthToken(token);
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
