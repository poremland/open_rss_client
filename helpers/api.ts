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

const handleResponse = async (response: Response) => {
	if (response.status === 401) {
		throw new Error("Session expired");
	}
	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Request failed with status ${response.status}: ${errorText}`,
		);
	}
	try {
		return await response.json();
	} catch {
		// If no JSON, return the raw text (e.g., for 204 No Content)
		return await response.text();
	}
};

const getBaseUrl = async (): Promise<string> => {
	const storedUrl = await AsyncStorage.getItem("serverUrl");
	return storedUrl || ""; // Return empty string if not found, or a default URL if you have one
};

const requestWithRetry = async (
	url: string,
	options: RequestInit,
	retries = 3,
) => {
	let lastError;
	for (let i = 0; i < retries; i++) {
		try {
			const response = await fetch(url, options);
			return handleResponse(response); // Throws on non-ok responses
		} catch (error) {
			lastError = error;
			if (i < retries - 1) {
				await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
			}
		}
	}
	throw lastError;
};

export const post = async (url: string, body: any) => {
	const baseUrl = await getBaseUrl();
	const response = await fetch(`${baseUrl}${url}`, {
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
	return handleResponse(response);
};

export const postWithAuth = async (
	url: string,
	body: any,
	contentType: string = "application/x-www-form-urlencoded",
) => {
	const baseUrl = await getBaseUrl();
	const authToken = await AsyncStorage.getItem("authToken");

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

	const response = await fetch(`${baseUrl}${url}`, {
		method: "POST",
		headers: headers,
		body: requestBody,
	});
	return handleResponse(response);
};

export const get = async (url: string) => {
	const baseUrl = await getBaseUrl();
	const authToken = await AsyncStorage.getItem("authToken");
	const headers: HeadersInit = {};
	if (authToken) {
		headers["Authorization"] = `Bearer ${authToken}`;
		headers["Content-Type"] = "application/json";
		headers["Accept"] = "application/json";
	}
	return requestWithRetry(`${baseUrl}${url}`, {
		method: "GET",
		headers: headers,
	});
};

export const getWithAuth = async (url: string) => {
	const baseUrl = await getBaseUrl();
	const authToken = await AsyncStorage.getItem("authToken");
	if (!authToken) {
		throw new Error("No authentication token found.");
	}
	return requestWithRetry(`${baseUrl}${url}`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${authToken}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
	});
};

export const putWithAuth = async (
	url: string,
	body: any,
	contentType: string = "application/x-www-form-urlencoded",
) => {
	const baseUrl = await getBaseUrl();
	const authToken = await AsyncStorage.getItem("authToken");

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

	const response = await fetch(`${baseUrl}${url}`, {
		method: "PUT",
		headers: headers,
		body: requestBody,
	});
	return handleResponse(response);
};

export const refreshToken = async () => {
	const baseUrl = await getBaseUrl();
	const authToken = await AsyncStorage.getItem("authToken");

	if (!authToken) {
		throw new Error("No authentication token found.");
	}

	const response = await fetch(`${baseUrl}/api/refresh_token`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${authToken}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify({}),
	});

	const data = await handleResponse(response);
	return data.token;
};
