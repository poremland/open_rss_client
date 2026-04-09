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
import { expect, describe, it, mock, beforeEach } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react-native";

const mockGetNetworkStateAsync = mock();
const mockAddNetworkStateListenerAsync = mock();
const mockRemove = mock();

mock.module('expo-network', () => ({
	getNetworkStateAsync: mockGetNetworkStateAsync,
	addNetworkStateListenerAsync: mockAddNetworkStateListenerAsync,
}));

// Use require to ensure it's loaded AFTER mock.module
const useConnectionStatus = require("../components/useConnectionStatus").default;

describe("useConnectionStatus", () => {
	beforeEach(() => {
		mockGetNetworkStateAsync.mockClear();
		mockAddNetworkStateListenerAsync.mockClear();
		mockRemove.mockClear();
		mockAddNetworkStateListenerAsync.mockResolvedValue({ remove: mockRemove });
	});

	it("should return isConnected as true when online", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		const { result } = renderHook(() => useConnectionStatus());

		await waitFor(() => expect(result.current.isConnected).toBe(true));
	});

	it("should return isConnected as false when offline", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: false,
			isInternetReachable: false,
		});

		const { result } = renderHook(() => useConnectionStatus());

		await waitFor(() => expect(result.current.isConnected).toBe(false));
	});

	it("should update isConnected when network state changes", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		let listenerCallback: (state: any) => void;
		mockAddNetworkStateListenerAsync.mockImplementation((callback: any) => {
			listenerCallback = callback;
			return Promise.resolve({ remove: mockRemove });
		});

		const { result } = renderHook(() => useConnectionStatus());

		await waitFor(() => expect(result.current.isConnected).toBe(true));

		// Simulate network change to offline
		await waitFor(() => expect(listenerCallback).toBeDefined());
		if (listenerCallback!) {
			listenerCallback!({
				isConnected: false,
				isInternetReachable: false,
			});
		}

		await waitFor(() => expect(result.current.isConnected).toBe(false));
	});

	it("should remove listener on unmount", async () => {
		mockGetNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		const { unmount } = renderHook(() => useConnectionStatus());
		
		unmount();

		await waitFor(() => expect(mockRemove).toHaveBeenCalled());
	});
});
