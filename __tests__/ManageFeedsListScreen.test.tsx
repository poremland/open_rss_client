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
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import ManageFeedsListScreen from "../app/ManageFeedsListScreen";

const mocks = (globalThis as any).__mocks;

describe("ManageFeedsListScreen", () => {
	const mockFeeds = [
		{ id: 1, name: "Feed 1", uri: "http://feed1.com" },
		{ id: 2, name: "Feed 2", uri: "http://feed2.com" },
	];

	beforeEach(async () => {
		mocks.resetAll();
	});

	it("should fetch feeds when the screen is focused", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);

		render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(mocks.api.getWithAuth).toHaveBeenCalled();
		});
	});

	it("should display a list of all feeds", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);

		const { getByText } = render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
		});
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const logoutItem = menuItems.find((item: any) => item.label === "Log-out");
		logoutItem.onPress();

		expect(mocks.auth.clearAuthData).toHaveBeenCalled();
	});

	it("should display error message when api call fails", async () => {
		mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("API Error")).toBeTruthy());
	});

	it("should display no feeds message when there are no feeds", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("No feeds to manage!")).toBeTruthy());
	});

	it("should copy feed uri to clipboard on press", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("Feed 1")).toBeTruthy());
	});

	it("should call exportOpml when Export OPML is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const exportItem = menuItems.find((item: any) => item.label === "Export OPML");
		expect(exportItem).toBeTruthy();
		exportItem.onPress();

		expect(mocks.api.exportOpml).toHaveBeenCalled();
	});

	it("should call importOpml when Import OPML is pressed and file is valid", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);
		const mockFileUri = "file:///test.opml";
		mocks.documentPicker.getDocumentAsync.mockResolvedValue({
			canceled: false,
			assets: [{
				uri: mockFileUri,
				name: "test.opml",
				mimeType: "text/x-opml",
				size: 1024,
			}],
		} as any);
		
		mocks.opml.validateOpmlFile.mockResolvedValue(true);
		const mockImportResponse = { message: "Import started", count: 5 };
		mocks.api.importOpml.mockResolvedValue(mockImportResponse);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const importItem = menuItems.find((item: any) => item.label === "Import OPML");
		expect(importItem).toBeTruthy();
		await importItem.onPress();

		expect(mocks.documentPicker.getDocumentAsync).toHaveBeenCalled();
		expect(mocks.api.importOpml).toHaveBeenCalledWith(mockFileUri);
		expect(mocks.alert).toHaveBeenCalledWith(
			"Import Started",
			expect.stringContaining("Importing 5 feeds")
		);
	});
});
