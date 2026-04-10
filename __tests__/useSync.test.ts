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

const syncServiceMock = {
	synchronize: mock(async () => {}),
};

const useConnectionStatusMock = {
	isConnected: true,
};

mock.module("../helpers/sync_service", () => ({
	syncService: syncServiceMock,
}));

mock.module("../components/useConnectionStatus", () => ({
	__esModule: true,
	default: () => ({ isConnected: useConnectionStatusMock.isConnected }),
}));

import "./setup";
import { mocks } from "./setup";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import useSync from "../components/useSync";

describe("useSync", () => {
	beforeEach(() => {
		mocks.resetAll();
		syncServiceMock.synchronize.mockClear();
	});

	it("should call syncService.synchronize when connection is restored", async () => {
		// Start online
		useConnectionStatusMock.isConnected = true;
		const { rerender } = renderHook(() => useSync());

		// Should call initially
		await waitFor(() => {
			expect(syncServiceMock.synchronize).toHaveBeenCalled();
		});
		syncServiceMock.synchronize.mockClear();

		// Go offline
		useConnectionStatusMock.isConnected = false;
		rerender({});
		expect(syncServiceMock.synchronize).not.toHaveBeenCalled();

		// Go online
		useConnectionStatusMock.isConnected = true;
		rerender({});

		await waitFor(() => {
			expect(syncServiceMock.synchronize).toHaveBeenCalled();
		});
	});
});
