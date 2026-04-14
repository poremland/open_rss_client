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

import { useState, useCallback } from "react";
import { api } from "../helpers/api_helper";
import { auth } from "../helpers/auth_helper";
import { useRouter } from "expo-router";
import useCache from "./useCache";
import useConnectionStatus from "./useConnectionStatus";
import * as syncHelper from "../helpers/sync_helper";

export interface ApiResponse<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	execute: (body?: any) => Promise<T | null>;
	setData: (data: T | null) => void;
}

interface UseApiOptions<T> {
	initialData?: T;
	useCache?: boolean;
	shouldQueue?: boolean;
}

const useApi = <T,>(
	method: string,
	path: string,
	options: UseApiOptions<T> = {},
	contentType: string = "application/x-www-form-urlencoded",
): ApiResponse<T> => {
	const [data, setData] = useState<T | null>(options.initialData || null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const { getCache, setCache } = useCache();
	const { isConnected, updateConnectionStatus } = useConnectionStatus();


	const execute = useCallback(
		async (body?: any): Promise<T | null> => {
			if (!path) return null;
			const lowerMethod = method.toLowerCase();
			const shouldCache = options.useCache !== false && lowerMethod === "get";
			const shouldQueue = options.shouldQueue || lowerMethod === "post" || lowerMethod === "put";

			if (!isConnected) {
				if (shouldCache && !options.shouldQueue) {
					const cachedData = await getCache<T>(path);
					if (cachedData) {
						setData(cachedData);
						return cachedData;
					}
					setError("No cached data available offline");
					return null;
				} else if (shouldQueue) {
					await syncHelper.queueAction({
						type: method.toUpperCase(),
						path,
						body,
						contentType,
					});
					return { queued: true } as any;
				} else {
					setError("App is offline");
					return null;
				}
			}

			setLoading(true);
			setError(null);
			try {
				let result: T;
				if (lowerMethod === "get") {
					result = await api.getWithAuth<T>(path);
					if (shouldCache) {
						await setCache(path, result);
					}
				} else if (lowerMethod === "post") {
					result = await api.postWithAuth<T>(path, body, contentType);
				} else if (lowerMethod === "put") {
					result = await api.putWithAuth(path, body, contentType) as T;
				} else {
					throw new Error(`Unsupported method: ${method}`);
				}
				setData(result);
				return result;
			} catch (err: any) {
				const errorMessage = err.message || "An unknown error occurred";
				
				setError(errorMessage);

				// If we get a network error, force an update of the connection status
				if (errorMessage.includes("Network request failed") || errorMessage.includes("network")) {
					await updateConnectionStatus();
				}

				if (shouldCache) {
					const cachedData = await getCache<T>(path);
					if (cachedData) {
						setData(cachedData);
						// We don't clear the error here so the UI can still show it
						return cachedData;
					}
				}

				if (errorMessage === "Session expired") {
					await auth.handleSessionExpired(router);
				}
				return null;
			} finally {
				setLoading(false);
			}
		},
		[method, path, contentType, router, isConnected, getCache, setCache, options.useCache],
	);

	return {
		data,
		loading,
		error,
		execute,
		setData,
	};
};

export default useApi;
