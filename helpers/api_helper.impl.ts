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

import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths, Directory } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";

export interface ApiDeps {
	storage: typeof AsyncStorage;
	fetch: typeof fetch;
	sharing: typeof Sharing;
	haptics: typeof Haptics;
	platform: typeof Platform;
	file: typeof File;
	paths: typeof Paths;
	directory: typeof Directory;
}

export class Api {
	private deps: ApiDeps = {
		storage: AsyncStorage,
		fetch: fetch.bind(globalThis),
		sharing: Sharing,
		haptics: Haptics,
		platform: Platform,
		file: File,
		paths: Paths,
		directory: Directory,
	};

	setDeps(deps: Partial<ApiDeps>) {
		this.deps = { ...this.deps, ...deps };
	}

	private handleResponse = async (response: Response) => {
		if (response.status === 401) {
			throw new Error("Session expired");
		}
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Request failed with status ${response.status}: ${errorText}`,
			);
		}

		const contentType = response.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
			return await response.json();
		}
		return await response.text();
	};

	private getBaseUrl = async (): Promise<string> => {
		const storedUrl = await this.deps.storage.getItem("serverUrl");
		return storedUrl || "";
	};

	private requestWithRetry = async (
		url: string,
		options: RequestInit,
		retries = 3,
	) => {
		let lastError;
		for (let i = 0; i < retries; i++) {
			try {
				const response = await this.deps.fetch(url, options);
				return this.handleResponse(response);
			} catch (error) {
				lastError = error;
				if (i < retries - 1) {
					await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
				}
			}
		}
		throw lastError;
	};

	post = async (url: string, body: any) => {
		const baseUrl = await this.getBaseUrl();
		const response = await this.deps.fetch(`${baseUrl}${url}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				Accept: "application/json",
			},
			body: Object.keys(body)
				.map(
					(key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`,
				)
				.join("&"),
		});
		return this.handleResponse(response);
	};

	postWithAuth = async <T>(
		url: string,
		body: any,
		contentType: string = "application/x-www-form-urlencoded",
	): Promise<T> => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");

		if (!authToken) {
			throw new Error("No authentication token found.");
		}

		const headers: HeadersInit = {
			Authorization: `Bearer ${authToken}`,
			Accept: "application/json",
		};

		let requestBody: string | FormData;

		if (contentType === "application/json") {
			headers["Content-Type"] = "application/json";
			requestBody = JSON.stringify(body);
		} else {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			requestBody = Object.keys(body)
				.map(
					(key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`,
				)
				.join("&");
		}

		const response = await this.deps.fetch(`${baseUrl}${url}`, {
			method: "POST",
			headers: headers,
			body: requestBody,
		});
		return this.handleResponse(response) as Promise<T>;
	};

	get = async <T>(url: string): Promise<T> => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");
		const headers: HeadersInit = {};
		if (authToken) {
			headers["Authorization"] = `Bearer ${authToken}`;
			headers["Content-Type"] = "application/json";
			headers["Accept"] = "application/json";
		}
		return this.requestWithRetry(`${baseUrl}${url}`, {
			method: "GET",
			headers: headers,
		}) as Promise<T>;
	};

	getWithAuth = async <T>(url: string): Promise<T> => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");
		if (!authToken) {
			throw new Error("No authentication token found.");
		}
		return this.requestWithRetry(`${baseUrl}${url}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
		}) as Promise<T>;
	};

	getBlobWithAuth = async (url: string): Promise<Blob> => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");
		if (!authToken) {
			throw new Error("No authentication token found.");
		}
		const response = await this.deps.fetch(`${baseUrl}${url}`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (response.status === 401) {
			throw new Error("Session expired");
		}
		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(
				`Request failed with status ${response.status}: ${errorText}`,
			);
		}
		return response.blob();
	};

	exportOpml = async (): Promise<void> => {
		const text = await this.getWithAuth<string>("/feeds/export");
		const filename = `subscriptions_${new Date().getTime()}.opml`;

		if (this.deps.platform.OS === "android") {
			const directory = await this.deps.directory.pickDirectoryAsync();
			if (!directory) return;

			const file = directory.createFile(filename, "text/x-opml");
			await file.write(text);
		} else {
			const file = new (this.deps.file)(this.deps.paths.cache, filename);
			await file.write(text);
			await this.deps.sharing.shareAsync(file.uri, {
				mimeType: "text/x-opml",
				dialogTitle: "Export Subscriptions",
				UTI: "public.xml",
			});
		}
		await this.deps.haptics.notificationAsync(this.deps.haptics.NotificationFeedbackType.Success);
	};

	importOpml = async <T>(fileUri: string): Promise<T> => {
		// Ensure we have a clean local file URI by copying to cache using new API
		const sourceFile = new (this.deps.file)(fileUri);
		const content = await sourceFile.text();
		
		const filename = `import_${new Date().getTime()}.opml`;
		const cacheFile = new (this.deps.file)(this.deps.paths.cache, filename);
		await cacheFile.write(content);

		const formData = new FormData();
		// @ts-ignore - React Native FormData.append accepts this object format for files
		formData.append("file", {
			uri: cacheFile.uri,
			name: "subscriptions.opml",
			type: "text/x-opml",
		});

		const result = await this.postFormDataWithAuth<T>("/feeds/import", formData);
		await this.deps.haptics.notificationAsync(this.deps.haptics.NotificationFeedbackType.Success);
		
		// Clean up cache file
		try { await cacheFile.delete(); } catch {}
		
		return result;
	};

	postFormDataWithAuth = async <T>(url: string, formData: FormData): Promise<T> => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");

		if (!authToken) {
			throw new Error("No authentication token found.");
		}

		// Use XMLHttpRequest for multipart on Android to avoid SDK 54 fetch regressions
		if (this.deps.platform.OS === "android") {
			return new Promise((resolve, reject) => {
				const xhr = new XMLHttpRequest();
				xhr.open("POST", `${baseUrl}${url}`);
				xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
				xhr.setRequestHeader("Accept", "application/json");
				
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							resolve(JSON.parse(xhr.responseText) as T);
						} catch {
							resolve(xhr.responseText as any as T);
						}
					} else {
						reject(new Error(`Request failed with status ${xhr.status}: ${xhr.responseText}`));
					}
				};
				xhr.onerror = () => reject(new Error("Network request failed"));
				xhr.send(formData);
			});
		}

		const response = await this.deps.fetch(`${baseUrl}${url}`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Accept": "application/json",
			},
			body: formData,
		});

		return this.handleResponse(response) as Promise<T>;
	};

	putWithAuth = async (

		url: string,
		body: any,
		contentType: string = "application/x-www-form-urlencoded",
	) => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");

		if (!authToken) {
			throw new Error("No authentication token found.");
		}

		const headers: HeadersInit = {
			Authorization: `Bearer ${authToken}`,
			Accept: "application/json",
		};

		let requestBody: string | FormData;

		if (contentType === "application/json") {
			headers["Content-Type"] = "application/json";
			requestBody = JSON.stringify(body);
		} else {
			headers["Content-Type"] = "application/x-www-form-urlencoded";
			requestBody = Object.keys(body)
				.map(
					(key) => `${encodeURIComponent(key)}=${encodeURIComponent(body[key])}`,
				)
				.join("&");
		}

		const response = await this.deps.fetch(`${baseUrl}${url}`, {
			method: "PUT",
			headers: headers,
			body: requestBody,
		});
		return this.handleResponse(response);
	};

	refreshToken = async () => {
		const baseUrl = await this.getBaseUrl();
		const authToken = await this.deps.storage.getItem("authToken");

		if (!authToken) {
			throw new Error("No authentication token found.");
		}

		const response = await this.deps.fetch(`${baseUrl}/api/refresh_token`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${authToken}`,
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({}),
		});

		const data = await this.handleResponse(response);
		return data.token;
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
export const postFormDataWithAuth = api.postFormDataWithAuth;
export const putWithAuth = api.putWithAuth;
export const refreshToken = api.refreshToken;
