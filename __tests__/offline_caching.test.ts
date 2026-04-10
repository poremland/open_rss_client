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
import { mock, expect, describe, it, beforeEach } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react-native";
import { act } from "react";
import "./setup";
import { mocks, networkMocks } from "./setup";

import * as cacheHelper from "../helpers/cache_helper";
import useApi from "../components/useApi";
import useConnectionStatus from "../components/useConnectionStatus";

describe("Offline Caching", () => {
	beforeEach(() => {
		mocks.resetAll();
	});

	describe("cache_helper", () => {
		it("should store and retrieve cached items", async () => {
			const url = "/test-cache-helper";
			const data = [{ id: 1, title: "Test Item" }];
			
			await cacheHelper.setCache(url, data);
			const cachedData = await cacheHelper.getCache(url);
			expect(cachedData).toEqual(data);
		});

		it("should clear cache", async () => {
			const url = "/test-clear";
			await cacheHelper.setCache(url, { some: "data" });
			await cacheHelper.clearCache(url);
			const cachedData = await cacheHelper.getCache(url);
			expect(cachedData).toBeNull();
		});
	});

	describe("useApi with Cache", () => {
		it("should cache GET requests automatically", async () => {
			const path = "/test-auto-cache";
			const mockData = { id: 1, name: "Test" };
			mocks.api.getWithAuth.mockResolvedValue(mockData);

			const { result } = renderHook(() => useApi("get", path));

			await act(async () => {
				await result.current.execute();
			});

			expect(result.current.data).toEqual(mockData);
			
			// Verify it was cached by checking cacheHelper directly
			const cachedVal = await cacheHelper.getCache(path);
			expect(cachedVal).toEqual(mockData);
		});

		it("should serve cached data when offline", async () => {
			const path = "/test-offline-cache";
			const mockCachedData = { id: 1, name: "Cached" };
			await cacheHelper.setCache(path, mockCachedData);
			
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });

			const { result: connResult } = renderHook(() => useConnectionStatus());
			await waitFor(() => expect(connResult.current.isConnected).toBe(false));

			const { result } = renderHook(() => useApi("get", path));

			// Wait for useApi to update its internal state
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			await act(async () => {
				const data = await result.current.execute();
				expect(data).toEqual(mockCachedData);
			});

			expect(result.current.data).toEqual(mockCachedData);
			expect(mocks.api.getWithAuth).not.toHaveBeenCalled();
		});

		it("should serve cached data when API fails", async () => {
			const path = "/test-fail-cache";
			const mockCachedData = { id: 1, name: "Cached" };
			await cacheHelper.setCache(path, mockCachedData);
			
			mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

			const { result } = renderHook(() => useApi("get", path));

			await act(async () => {
				const data = await result.current.execute();
				expect(data).toEqual(mockCachedData);
			});

			expect(result.current.data).toEqual(mockCachedData);
			expect(result.current.error).toBeNull(); // Error should be cleared if cache is served
		});
	});
});
