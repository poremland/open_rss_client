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
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { expect, describe, it, beforeEach, afterEach, spyOn } from "bun:test";
import "./setup";
import { mocks } from "./setup";
import AboutScreen from "../app/AboutScreen";
import { ConnectionProvider } from "../components/useConnectionStatus";
import * as cacheHelper from "../helpers/cache_helper";

describe("AboutScreen", () => {
	let getCacheStatsSpy: any;
	let clearAllCacheSpy: any;

	beforeEach(() => {
		mocks.resetAll();
		
		// Mock cacheHelper functions directly
		getCacheStatsSpy = spyOn(cacheHelper, "getCacheStats").mockResolvedValue({
			cachedFeeds: 5,
			cachedItems: 120,
			totalSize: 1024 * 500, // 512 KB
			lastSyncTime: "2026-04-20T10:00:00Z"
		});
		clearAllCacheSpy = spyOn(cacheHelper, "clearAllCache").mockResolvedValue(undefined);

		mocks.asyncStorage.getItem.mockImplementation(async (key: string) => {
			if (key === "serverUrl") return "https://rss.example.com";
			if (key === "user") return "testuser";
			return null;
		});
	});

	afterEach(() => {
		getCacheStatsSpy.mockRestore();
		clearAllCacheSpy.mockRestore();
	});

	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ConnectionProvider>{children}</ConnectionProvider>
	);

	it("renders all required information", async () => {
		const { getByText } = render(<AboutScreen />, { wrapper });

		await waitFor(() => expect(cacheHelper.getCacheStats).toHaveBeenCalled());

		expect(getByText("Open RSS Client")).toBeTruthy();
		expect(getByText("Version: 1.6.1")).toBeTruthy();
		expect(getByText("https://rss.example.com")).toBeTruthy();
		expect(getByText("testuser")).toBeTruthy();
		expect(getByText("5")).toBeTruthy(); // cached feeds
		expect(getByText("120")).toBeTruthy(); // cached items
		expect(getByText("500 KB")).toBeTruthy(); // total size
	});

	it("calls clearAllCache when button is pressed", async () => {
		const { getByText } = render(<AboutScreen />, { wrapper });

		await waitFor(() => expect(getByText("Clear Cache")).toBeTruthy());

		const clearButton = getByText("Clear Cache");
		fireEvent.press(clearButton);

		// Verify Alert was called
		expect(mocks.alert).toHaveBeenCalledWith(
			"Clear Cache",
			expect.any(String),
			expect.any(Array)
		);

		// Extract buttons and find "Clear"
		const buttons = mocks.alert.mock.calls[0][2];
		const clearButtonConfig = buttons.find((b: any) => b.text === "Clear");
		
		// Trigger the clear action
		await act(async () => {
			await clearButtonConfig.onPress();
		});

		expect(cacheHelper.clearAllCache).toHaveBeenCalled();
	});
});
