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
import "./setup";
import { mocks } from "./setup";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import useSync from "../components/useSync";
import { syncService } from "../helpers/sync_service";

mock.module("../helpers/sync_service", () => ({
	syncService: {
		synchronize: mock(async () => {}),
	},
}));

describe("useSync", () => {
	beforeEach(() => {
		mocks.resetAll();
		(syncService.synchronize as any).mockClear();
	});

	it("should call syncService.synchronize when connection is restored", async () => {
		// Start online
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
		const { rerender } = renderHook(() => useSync());

		// Should call initially
		await waitFor(() => {
			expect(syncService.synchronize).toHaveBeenCalled();
		});
		(syncService.synchronize as any).mockClear();

		// Go offline
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		
		// Trigger the listener callback if we can get it
		const listenerCall = mocks.networkMocks.addNetworkStateListenerAsync.mock.calls[0];
		if (listenerCall) {
			const callback = listenerCall[0];
			await act(async () => {
				callback({ isConnected: false });
			});
		}

		rerender({});
		expect(syncService.synchronize).not.toHaveBeenCalled();

		// Go online
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
		if (listenerCall) {
			const callback = listenerCall[0];
			await act(async () => {
				callback({ isConnected: true });
			});
		}

		rerender({});

		await waitFor(() => {
			expect(syncService.synchronize).toHaveBeenCalled();
		});
	});
});
