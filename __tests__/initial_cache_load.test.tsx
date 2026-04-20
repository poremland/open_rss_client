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
import { expect, describe, it, beforeEach } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react-native";
import React, { act } from "react";
import { mocks } from "./setup";
import * as cacheHelper from "../helpers/cache_helper";
import useApi from "../components/useApi";
import { ConnectionProvider } from "../components/useConnectionStatus";

describe("Initial Cache Load", () => {
	beforeEach(() => {
		mocks.resetAll();
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ConnectionProvider>{children}</ConnectionProvider>
	);

	it("should load data from cache on mount for GET requests", async () => {
		const path = "/test-initial-load";
		const mockCachedData = { id: 1, name: "Cached" };
		const mockServerData = { id: 1, name: "Server" };

		await cacheHelper.setCache(path, mockCachedData);
		mocks.api.getWithAuth.mockResolvedValue(mockServerData);

		const { result } = renderHook(() => useApi("get", path, { useCache: true }), { wrapper });

		// Verify data is loaded from cache on mount (before execute)
		await waitFor(() => expect(result.current.data).toEqual(mockCachedData));

		// Now execute to get server data
		await act(async () => {
			await result.current.execute();
		});

		expect(result.current.data).toEqual(mockServerData);
	});

	it("should NOT load data from cache on mount if useCache is false", async () => {
		const path = "/test-no-initial-load";
		const mockCachedData = { id: 1, name: "Cached" };
		await cacheHelper.setCache(path, mockCachedData);

		const { result } = renderHook(() => useApi("get", path, { useCache: false }), { wrapper });

		// Wait a bit to ensure useEffect had time to run
		await act(async () => {
			await new Promise(resolve => setTimeout(resolve, 50));
		});

		expect(result.current.data).toBeNull();
	});
});
