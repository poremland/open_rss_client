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

export interface ApiResponse<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	execute: (body?: any) => Promise<T | null>;
	setData: (data: T | null) => void;
}

interface UseApiOptions<T> {
	initialData?: T;
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

	const execute = useCallback(
		async (body?: any): Promise<T | null> => {
			setLoading(true);
			setError(null);
			try {
				let result: T;
				const lowerMethod = method.toLowerCase();
				if (lowerMethod === "get") {
					result = await api.getWithAuth<T>(path);
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
				if (errorMessage === "Session expired") {
					await auth.handleSessionExpired(router);
				}
				return null;
			} finally {
				setLoading(false);
			}
		},
		[method, path, contentType, router],
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
