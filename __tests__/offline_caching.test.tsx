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
import React, { act } from "react";
import "./setup";
import { mocks, networkMocks } from "./setup";
import * as cacheHelper from "../helpers/cache_helper";
import * as syncHelper from "../helpers/sync_helper";
import useApi from "../components/useApi";
import useConnectionStatus, { ConnectionProvider } from "../components/useConnectionStatus";

describe("Offline Caching and Sync", () => {
	beforeEach(() => {
		mocks.resetAll();
		// Also clear sync queue
		if ((process as any).localSyncQueue) {
			(process as any).localSyncQueue.length = 0;
		}
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ConnectionProvider>{children}</ConnectionProvider>
	);

	const isConnectedInHook = (result: { current: ApiResponse<any> }) => {
		return result.current.isConnected;
	};

	describe("cache_helper", () => {
		it("should store and retrieve cached items", async () => {
			const url = `/test-cache-helper-${Math.random()}`;
			const data = [{ id: 1, title: "Test Item" }];
			
			await cacheHelper.setCache(url, data);
			const cachedData = await cacheHelper.getCache(url);
			expect(cachedData).toEqual(data);
		});

		it("should clear cache", async () => {
			const url = `/test-clear-${Math.random()}`;
			await cacheHelper.setCache(url, { some: "data" });
			await cacheHelper.clearCache(url);
			const cachedData = await cacheHelper.getCache(url);
			expect(cachedData).toBeNull();
		});
	});

	describe("sync_helper", () => {
		it("should add actions to the queue", async () => {
			const action = {
				type: "MARK_READ",
				path: `/test-sync-${Math.random()}`,
				body: { items: "[1,2]" },
			};

			await syncHelper.queueAction(action);
			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining(action));
		});

		it("should clear the queue", async () => {
			await syncHelper.queueAction({ type: "TEST", path: "/test", body: {} });
			await syncHelper.clearQueue();
			const queue = await syncHelper.getQueue();
			expect(queue).toHaveLength(0);
		});
	});

	describe("useApi with Cache", () => {
		it("should cache GET requests automatically", async () => {
			const path = `/test-auto-cache-${Math.random()}`;
			const mockData = { id: 1, name: "Test" };
			mocks.api.getWithAuth.mockResolvedValue(mockData);

			const { result } = renderHook(() => useApi("get", path), { wrapper });

			await act(async () => {
				await result.current.execute();
			});

			expect(result.current.data).toEqual(mockData);
			
			// Verify it was cached by checking cacheHelper directly
			const cachedVal = await cacheHelper.getCache(path);
			expect(cachedVal).toEqual(mockData);
		});

		it("should serve cached data when offline", async () => {
			const path = `/test-offline-cache-${Math.random()}`;
			const mockCachedData = { id: 1, name: "Cached" };
			await cacheHelper.setCache(path, mockCachedData);
			
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
			mocks.useConnectionStatusMock.isConnected = false;

			const { result: connResult } = renderHook(() => useConnectionStatus());
			await waitFor(() => expect(connResult.current.isConnected).toBe(false));

			const { result } = renderHook(() => useApi("get", path), { wrapper });

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

		it("should serve cached data and clear error when API fails", async () => {
			const path = `/test-fail-cache-${Math.random()}`;
			const mockCachedData = { id: 1, name: "Cached" };
			await cacheHelper.setCache(path, mockCachedData);
			
			mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

			const { result } = renderHook(() => useApi("get", path), { wrapper });

			await act(async () => {
				const data = await result.current.execute();
				expect(data).toEqual(mockCachedData);
			});

			expect(result.current.data).toEqual(mockCachedData);
			expect(result.current.error).toBeNull();
		});

		it("should NOT show error when offline and using initialData", async () => {
			const path = "/offline-initial-data";
			const mockInitialData = { id: 1, name: "Initial" };
			
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
			mocks.useConnectionStatusMock.isConnected = false;

			const { result } = renderHook(() => useApi("get", path, { initialData: mockInitialData }), { wrapper });

			// Wait for connection status to update to false
			await waitFor(() => expect(isConnectedInHook(result)).toBe(false));

			await act(async () => {
				await result.current.execute();
			});

			expect(result.current.data).toEqual(mockInitialData);
			expect(result.current.error).toBeNull();
		});

		it("should trigger updateConnectionStatus on network request failure", async () => {
			const path = "/test-network-failure";
			mocks.api.getWithAuth.mockRejectedValue(new Error("Network request failed"));

			const { result } = renderHook(() => useApi("get", path), { wrapper });

			// Clear mount-time call
			networkMocks.getNetworkStateAsync.mockClear();

			await act(async () => {
				await result.current.execute();
			});

			expect(networkMocks.getNetworkStateAsync).toHaveBeenCalled();
		});
	});

	describe("Sync Queue Integration", () => {
		it("should queue POST requests when offline", async () => {
			const path = `/feeds/mark_items_as_read/${Math.random()}`;
			const body = { items: "[1,2]" };
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
			mocks.useConnectionStatusMock.isConnected = false;

			const { result: connResult } = renderHook(() => useConnectionStatus());
			await waitFor(() => expect(connResult.current.isConnected).toBe(false));

			const { result } = renderHook(() => useApi("post", path), { wrapper });

			// Wait for useApi to update its internal state
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			await act(async () => {
				const response = await result.current.execute(body);
				expect(response).toEqual({ queued: true });
			});

			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining({
				type: "POST",
				path,
				body,
			}));
			expect(mocks.api.postWithAuth).not.toHaveBeenCalled();
		});

		it("should queue GET requests when offline and shouldQueue is true", async () => {
			const path = `/feed_items/mark_as_read/${Math.random()}.json`;
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
			mocks.useConnectionStatusMock.isConnected = false;

			const { result: connResult } = renderHook(() => useConnectionStatus());
			await waitFor(() => expect(connResult.current.isConnected).toBe(false));

			const { result } = renderHook(() => useApi("get", path, { shouldQueue: true }), { wrapper });

			// Wait for useApi to update its internal state
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			await act(async () => {
				const response = await result.current.execute();
				expect(response).toEqual({ queued: true });
			});

			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining({
				type: "GET",
				path,
			}));
			expect(mocks.api.getWithAuth).not.toHaveBeenCalled();
		});
	});
});
