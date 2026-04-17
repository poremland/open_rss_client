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
import "./setup";
import { mocks } from "./setup";
import { renderHook, waitFor } from "@testing-library/react-native";
import useSync from "../components/useSync";
import { syncService } from "../helpers/sync_service";

describe("useSync", () => {
	beforeEach(() => {
		mocks.resetAll();
	});

	it("should call syncService.synchronize when connection is restored", async () => {
		// Start online
		mocks.useConnectionStatusMock.isConnected = true;
		const { rerender } = renderHook(() => useSync());

		// Should call initially (triggered by useEffect in useSync)
		await waitFor(() => {
			expect(mocks.api.getWithAuth).toHaveBeenCalled();
		});

		// Go offline
		mocks.useConnectionStatusMock.isConnected = false;
		rerender({});
		
		// Reset call history to check for new calls
		mocks.api.getWithAuth.mockClear();

		// Go online
		mocks.useConnectionStatusMock.isConnected = true;
		rerender({});

		await waitFor(() => {
			expect(mocks.api.getWithAuth).toHaveBeenCalled();
		});
	});
});
