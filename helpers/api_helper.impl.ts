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
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export interface ApiDeps {
	storage: {
		getItem: (key: string) => Promise<string | null>;
		setItem: (key: string, value: string) => Promise<void>;
	};
	fetch?: typeof fetch;
}

export class Api {
	private _deps: ApiDeps | undefined;

	constructor(deps?: ApiDeps) {
		this._deps = deps;
	}

	private get deps(): ApiDeps {
		if (this._deps) return this._deps;
		const g = (globalThis as any);
		return {
			storage: g.AsyncStorage || AsyncStorage,
			fetch: g.fetch || fetch,
		};
	}

	private get fetch(): typeof fetch {
		const f = this.deps.fetch || fetch;
		if (typeof window !== 'undefined' && f === window.fetch) {
			return f.bind(window);
		}
		return f;
	}

	setDeps(deps: ApiDeps) {
		this._deps = deps;
	}

	getBaseUrl = async () => {
		return await this.deps.storage.getItem('serverUrl');
	};

	post = async <T>(url: string, body: any, contentType: string = 'application/json'): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.post) return g.apiMocks.post(url, body, contentType);

		const baseUrl = await this.getBaseUrl();
		let formattedBody = body;

		if (contentType === 'application/x-www-form-urlencoded') {
			formattedBody = Object.keys(body)
				.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
				.join('&');
		} else if (contentType === 'application/json') {
			formattedBody = JSON.stringify(body);
		}

		const response = await this.fetch(`${baseUrl}${url}`, {
			method: 'POST',
			headers: {
				'Content-Type': contentType,
				'Accept': 'application/json',
			},
			body: formattedBody,
		});

		if (response.status === 401) {
			throw new Error('Session expired');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Request failed with status ${response.status}: ${errorText}`);
		}

		const responseContentType = response.headers.get('content-type');
		if (responseContentType && responseContentType.includes('application/json')) {
			return await response.json();
		}
		return (await response.text()) as unknown as T;
	};

	postWithAuth = async <T>(url: string, body: any, contentType: string = 'application/json'): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.postWithAuth) return g.apiMocks.postWithAuth(url, body, contentType);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');

		if (!authToken) {
			throw new Error('No authentication token found.');
		}

		let formattedBody = body;
		if (contentType === 'application/x-www-form-urlencoded') {
			formattedBody = Object.keys(body)
				.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
				.join('&');
		} else if (contentType === 'application/json') {
			formattedBody = JSON.stringify(body);
		}

		const response = await this.fetch(`${baseUrl}${url}`, {
			method: 'POST',
			headers: {
				'Content-Type': contentType,
				'Accept': 'application/json',
				'Authorization': `Bearer ${authToken}`,
			},
			body: formattedBody,
		});

		if (response.status === 401) {
			throw new Error('Session expired');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Request failed with status ${response.status}: ${errorText}`);
		}

		const responseContentType = response.headers.get('content-type');
		if (responseContentType && responseContentType.includes('application/json')) {
			return await response.json();
		}
		return (await response.text()) as unknown as T;
	};

	get = async <T>(url: string): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.get) return g.apiMocks.get(url);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');
		const headers: any = {};
		if (authToken) {
			headers['Authorization'] = `Bearer ${authToken}`;
			headers['Content-Type'] = 'application/json';
			headers['Accept'] = 'application/json';
		}

		let lastError: any;
		for (let i = 0; i < 3; i++) {
			try {
				const response = await this.fetch(`${baseUrl}${url}`, {
					method: 'GET',
					headers,
				});

				if (response.status === 401) {
					throw new Error('Session expired');
				}

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Request failed with status ${response.status}: ${errorText}`);
				}

				const responseContentType = response.headers.get('content-type');
				if (responseContentType && responseContentType.includes('application/json')) {
					return await response.json();
				}
				return (await response.text()) as unknown as T;
			} catch (e) {
				lastError = e;
				if (i < 2) await new Promise((resolve) => setTimeout(resolve, 200));
			}
		}
		throw lastError;
	};

	getWithAuth = async <T>(url: string): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.getWithAuth) return g.apiMocks.getWithAuth(url);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');

		if (!authToken) {
			throw new Error('No authentication token found.');
		}

		let lastError: any;
		for (let i = 0; i < 3; i++) {
			try {
				const response = await this.fetch(`${baseUrl}${url}`, {
					method: 'GET',
					headers: {
						'Authorization': `Bearer ${authToken}`,
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
				});

				if (response.status === 401) {
					throw new Error('Session expired');
				}

				if (!response.ok) {
					const errorText = await response.text();
					throw new Error(`Request failed with status ${response.status}: ${errorText}`);
				}

				const responseContentType = response.headers.get('content-type');
				if (responseContentType && responseContentType.includes('application/json')) {
					return await response.json();
				}
				return (await response.text()) as unknown as T;
			} catch (e) {
				lastError = e;
				if (i < 2) await new Promise((resolve) => setTimeout(resolve, 200));
			}
		}
		throw lastError;
	};

	getBlobWithAuth = async (url: string): Promise<Blob> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.getBlobWithAuth) return g.apiMocks.getBlobWithAuth(url);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');

		if (!authToken) {
			throw new Error('No authentication token found.');
		}

		const response = await this.fetch(`${baseUrl}${url}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${authToken}`,
			},
		});

		if (response.status === 401) {
			throw new Error('Session expired');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Request failed with status ${response.status}: ${errorText}`);
		}

		return await response.blob();
	};

	exportOpml = async (): Promise<void> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.exportOpml) return g.apiMocks.exportOpml();

		const opmlText = await this.getWithAuth<string>('/feeds/export');

		if (Platform.OS === 'web') {
			const blob = new Blob([opmlText], { type: 'text/xml' });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'subscriptions.opml';
			a.click();
			window.URL.revokeObjectURL(url);
		} else if (Platform.OS === 'ios') {
			const fileUri = `${FileSystem.cacheDirectory}subscriptions.opml`;
			await FileSystem.writeAsStringAsync(fileUri, opmlText);
			await Sharing.shareAsync(fileUri);
		} else if (Platform.OS === 'android') {
			const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
			if (permissions.granted) {
				const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
					permissions.directoryUri,
					'subscriptions.opml',
					'text/xml'
				);
				await FileSystem.writeAsStringAsync(fileUri, opmlText);
			}
		}
	};

	importOpml = async <T>(uri: string): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.importOpml) return g.apiMocks.importOpml(uri);

		const formData = new FormData();

		if (Platform.OS === 'web') {
			const response = await this.fetch(uri);
			const blob = await response.blob();
			formData.append('file', blob, 'subscriptions.opml');
		} else {
			formData.append('file', {
				uri,
				name: 'subscriptions.opml',
				type: 'text/xml',
			} as any);
		}

		return await this.postFormDataWithAuth<T>('/feeds/import', formData);
	};

	readTextFile = async (uri: string): Promise<string> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.readTextFile) return g.apiMocks.readTextFile(uri);
		return await FileSystem.readAsStringAsync(uri);
	};

	postFormDataWithAuth = async <T>(url: string, formData: FormData): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.postFormDataWithAuth) return g.apiMocks.postFormDataWithAuth(url, formData);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');

		if (!authToken) {
			throw new Error('No authentication token found.');
		}

		const response = await this.fetch(`${baseUrl}${url}`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${authToken}`,
				'Accept': 'application/json',
			},
			body: formData,
		});

		if (response.status === 401) {
			throw new Error('Session expired');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Request failed with status ${response.status}: ${errorText}`);
		}

		return await response.json();
	};

	putWithAuth = async <T>(url: string, body: any, contentType: string = 'application/json'): Promise<T> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.putWithAuth) return g.apiMocks.putWithAuth(url, body);

		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem('authToken');

		if (!authToken) {
			throw new Error('No authentication token found.');
		}

		let formattedBody = body;
		if (contentType === 'application/x-www-form-urlencoded') {
			formattedBody = Object.keys(body)
				.map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(body[key]))
				.join('&');
		} else if (contentType === 'application/json') {
			formattedBody = JSON.stringify(body);
		}

		const response = await this.fetch(`${baseUrl}${url}`, {
			method: 'PUT',
			headers: {
				'Content-Type': contentType,
				'Accept': 'application/json',
				'Authorization': `Bearer ${authToken}`,
			},
			body: formattedBody,
		});

		if (response.status === 401) {
			throw new Error('Session expired');
		}

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Request failed with status ${response.status}: ${errorText}`);
		}

		return await response.json();
	};

	refreshToken = async (): Promise<string | null> => {
		const g = (globalThis as any);
		if (!g.__disableApiMock && g.apiMocks && g.apiMocks.refreshToken) return g.apiMocks.refreshToken();

		try {
			const response = await this.postWithAuth<{ token: string }>('/api/refresh_token', {});
			if (response && response.token) {
				await this.deps.storage.setItem('authToken', response.token);
				return response.token;
			}
		} catch (e) {
			console.error('Error refreshing token:', e);
		}
		return null;
	};
}

export const api = new Api();
export const post = api.post;
export const postWithAuth = api.postWithAuth;
export const get = api.get;
export const getWithAuth = api.getWithAuth;
export const getBlobWithAuth = api.getBlobWithAuth;
export const exportOpml = api.exportOpml;
export const importOpml = api.importOpml;
export const readTextFile = api.readTextFile;
export const postFormDataWithAuth = api.postFormDataWithAuth;
export const putWithAuth = api.putWithAuth;
export const refreshToken = api.refreshToken;
