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

import React from "react";
import { expect, describe, it, mock, beforeEach } from "bun:test";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import useConnectionStatus, { ConnectionProvider } from "../components/useConnectionStatus";
import { mocks, networkMocks } from "./setup";

describe("useConnectionStatus", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ConnectionProvider>{children}</ConnectionProvider>
	);

	beforeEach(() => {
		mocks.resetAll();
	});

	it("should return isConnected as true when online", async () => {
		networkMocks.getNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		const { result } = renderHook(() => useConnectionStatus(), { wrapper });

		await waitFor(() => expect(result.current.isConnected).toBe(true));
	});

	it("should return isConnected as false when offline", async () => {
		networkMocks.getNetworkStateAsync.mockResolvedValue({
			isConnected: false,
			isInternetReachable: false,
		});

		const { result } = renderHook(() => useConnectionStatus(), { wrapper });

		await waitFor(() => expect(result.current.isConnected).toBe(false));
	});

	it("should update isConnected when network state changes", async () => {
		let listenerCallback: ((state: any) => void) | undefined;
		networkMocks.addNetworkStateListener.mockImplementation((callback: any) => {
			listenerCallback = callback;
			return { remove: mock(() => {}) };
		});

		const { result } = renderHook(() => useConnectionStatus(), { wrapper });

		await waitFor(() => expect(result.current.isConnected).toBe(true));

		// Simulate network change to offline
		await waitFor(() => expect(listenerCallback).toBeDefined());
		if (listenerCallback!) {
			await act(async () => {
				listenerCallback!({
					isConnected: false,
					isInternetReachable: false,
				});
			});
		}

		await waitFor(() => expect(result.current.isConnected).toBe(false));
	});

	it("should update isConnected when updateConnectionStatus is called", async () => {
		networkMocks.getNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		const { result } = renderHook(() => useConnectionStatus(), { wrapper });
		await waitFor(() => expect(result.current.isConnected).toBe(true));

		// Change mock to offline
		networkMocks.getNetworkStateAsync.mockResolvedValue({
			isConnected: false,
			isInternetReachable: false,
		});

		await act(async () => {
			await result.current.updateConnectionStatus();
		});

		await waitFor(() => expect(result.current.isConnected).toBe(false));
	});

	it("should remove listener on unmount", async () => {
		const mockRemove = mock(() => {});
		networkMocks.addNetworkStateListener.mockReturnValue({ remove: mockRemove });
		networkMocks.getNetworkStateAsync.mockResolvedValue({
			isConnected: true,
			isInternetReachable: true,
		});

		const { unmount } = renderHook(() => useConnectionStatus(), { wrapper });
		
		unmount();

		await waitFor(() => expect(mockRemove).toHaveBeenCalled());
	});
});
