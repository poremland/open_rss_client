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
import "./setup";
import { mocks } from "./setup";
import { mock, expect, describe, it, beforeEach } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react-native";
import { act } from "react";
import { networkMocks } from "./setup";

const mockGetCache = mock();
const mockSetCache = mock();
const mockClearCache = mock();

mock.module("../components/useCache", () => ({
	default: () => ({
		getCache: mockGetCache,
		setCache: mockSetCache,
		clearCache: mockClearCache,
	}),
}));

import useApi from "../components/useApi";

describe("useApi", () => {
	beforeEach(() => {
		mocks.resetAll();
		mockGetCache.mockClear().mockResolvedValue(null);
		mockSetCache.mockClear();
		mockClearCache.mockClear();
	});

	it("should handle GET request successfully and cache the result", async () => {
		const mockData = { id: 1, name: "Test" };
		mocks.api.getWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/test"));

		await act(async () => {
			await result.current.execute();
		});

		expect(result.current.data).toEqual(mockData);
		expect(mockSetCache).toHaveBeenCalledWith("/test", mockData);
	});

	it("should return cached data when offline", async () => {
		const mockCachedData = { id: 1, name: "Cached" };
		mockGetCache.mockResolvedValue(mockCachedData);
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });

		const { result } = renderHook(() => useApi("get", "/test"));

		// Wait for the hook to update state to offline
		// We can check this by waiting for something that indicates it's ready, 
		// but since we can't see isConnected directly from ApiResponse, 
		// we'll just wait for a bit or use renderHook for useConnectionStatus
		await waitFor(() => {
			// Actually, let's just wait for the execute to eventually return the cached data
			// if we call it repeatedly? No.
		});

		// Better way: wait for useConnectionStatus mock to have been called
		await waitFor(() => expect(mocks.networkMocks.getNetworkStateAsync).toHaveBeenCalled());

		await act(async () => {
			// We might still be online for a split second. 
			// Let's use a small delay to ensure useEffect has run.
			await new Promise(resolve => setTimeout(resolve, 100));
			const data = await result.current.execute();
			expect(data).toEqual(mockCachedData);
		});

		expect(result.current.data).toEqual(mockCachedData);
		expect(mocks.api.getWithAuth).not.toHaveBeenCalled();
	});

	it("should handle GET request successfully", async () => {
		const mockData = { message: "GET success" };
		mocks.api.getWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/test-get"));

		expect(result.current.loading).toBe(false);
		expect(result.current.data).toBeNull();
		expect(result.current.error).toBeNull();

		await act(async () => {
			await result.current.execute();
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle POST request with form data successfully", async () => {
		const mockData = { message: "POST success" };
		mocks.api.postWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("post", "/test-post"));

		await act(async () => {
			await result.current.execute({ key: "value" });
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle POST request with JSON data successfully", async () => {
		const mockData = { message: "JSON POST success" };
		mocks.api.postWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() =>
			useApi("post", "/test-json-post", {}, "application/json"),
		);

		await act(async () => {
			await result.current.execute({ key: "value" });
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle API error", async () => {
		const errorMessage = "Network Error";
		mocks.api.getWithAuth.mockRejectedValue(new Error(errorMessage));

		const { result } = renderHook(() => useApi("get", "/error-get"));

		await act(async () => {
			try { await result.current.execute(); } catch (e) {}
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe(errorMessage);
	});

	it("should set initial data", () => {
		const initialData = { initial: "data" };
		const { result } = renderHook(() =>
			useApi("get", "/initial", { initialData }),
		);

		expect(result.current.data).toEqual(initialData);
	});

	it("should return the response from execute", async () => {
		const mockData = { success: true };
		mocks.api.getWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/execute"));

		let response;
		await act(async () => {
			response = await result.current.execute();
		});

		expect(response).toEqual(mockData);
	});

	it("should call handleSessionExpired when session expires", async () => {
		mocks.api.getWithAuth.mockRejectedValue(new Error("Session expired"));

		const { result } = renderHook(() => useApi("get", "/expired"));

		await act(async () => {
			try { await result.current.execute(); } catch (e) {}
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(mocks.auth.handleSessionExpired).toHaveBeenCalled();
	});
});
