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
import { getWithAuth, postWithAuth } from "../../helpers/api";
import { handleSessionExpired } from "../../helpers/auth";
import { useRouter } from "expo-router";

type ApiMethod = "get" | "post";

interface UseApiOptions<T> {
	initialData?: T;
}

const useApi = <T>(
	method: ApiMethod,
	url: string,
	options: UseApiOptions<T> = {},
	contentType: string = "application/x-www-form-urlencoded",
) => {
	const [data, setData] = useState<T | null>(options.initialData || null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const router = useRouter();

	const execute = useCallback(
		async (body?: any) => {
			setLoading(true);
			setError("");
			try {
				let response: T;
				if (method === "get") {
					response = await getWithAuth<T>(url);
				} else {
					response = await postWithAuth<T>(url, body, contentType);
				}
				setData(response);
				return response;
			} catch (e: any) {
				if (e.message === "Session expired") {
					handleSessionExpired(router);
				} else {
					setError(e.message);
				}
			} finally {
				setLoading(false);
			}
		},
		[method, url, contentType, router],
	);

	return { data, loading, error, execute, setData };
};

export default useApi;
