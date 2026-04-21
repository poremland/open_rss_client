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
import React, { act } from "react";
import { renderHook, waitFor } from "@testing-library/react-native";
import { expect, describe, it, beforeEach, spyOn, mock } from "bun:test";
import { mocks } from "./setup";
import useApi from "../components/useApi";
import { auth } from "../helpers/auth_helper";
import { ConnectionProvider } from "../components/useConnectionStatus";

describe("Security: Token Expiry", () => {
	beforeEach(() => {
		mocks.resetAll();
		// Ensure we are online for these tests
		mocks.network.getNetworkStateAsync.mockResolvedValue({ isConnected: true });
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ConnectionProvider>{children}</ConnectionProvider>
	);

	it("should call handleSessionExpired when a 401 error occurs", async () => {
		const handleSessionExpiredSpy = spyOn(auth, "handleSessionExpired").mockResolvedValue(undefined);
		mocks.api.getWithAuth.mockRejectedValue(new Error("Session expired"));

		const { result } = renderHook(() => useApi("get", "/test-401"), { wrapper });

		await act(async () => {
			await result.current.execute();
		});

		expect(handleSessionExpiredSpy).toHaveBeenCalled();
		handleSessionExpiredSpy.mockRestore();
	});
});
