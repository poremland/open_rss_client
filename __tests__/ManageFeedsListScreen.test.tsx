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
import { render, waitFor, act, fireEvent } from "@testing-library/react-native";
import ManageFeedsListScreen from "../app/ManageFeedsListScreen";

const mocks = (globalThis as any).__mocks;

describe("ManageFeedsListScreen", () => {
        const mockFeeds = [
                { id: 1, name: "Feed 1", uri: "http://feed1.com" },
                { id: 2, name: "Feed 2", uri: "http://feed2.com" },
        ];

        beforeEach(() => {
                mocks.resetAll();
                mocks.api.getWithAuth.mockResolvedValue(mockFeeds);
        });

        it("disables OPML actions and deletion when disconnected", async () => {
                mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
                const { getByText, queryByTestId } = render(<ManageFeedsListScreen />);

                // Wait for the hook to update and setMenuItems to be called with the new handler
                await waitFor(() => {
                        expect(mocks.useMenu.setMenuItems).toHaveBeenCalled();
                        expect(mocks.useMenu.setMenuItems.mock.calls.length).toBeGreaterThan(1);
                });

                const menuItems = mocks.useMenu.setMenuItems.mock.calls[mocks.useMenu.setMenuItems.mock.calls.length - 1][0];
                const importAction = menuItems.find((item: any) => item.label === "Import OPML");
                const exportAction = menuItems.find((item: any) => item.label === "Export OPML");

                await act(async () => {
                        await importAction.onPress();
                });
                expect(mocks.alert).toHaveBeenCalledWith("Offline", "Importing feeds is disabled while offline.");

                await act(async () => {
                        await exportAction.onPress();
                });
                expect(mocks.alert).toHaveBeenCalledWith("Offline", "Exporting feeds is disabled while offline.");
        });

        it("should fetch feeds when the screen is focused", async () => {		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);

		render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/all.json");
		});
	});

	it("should display a list of all feeds", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);

		const { getByText } = render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("http://feed1.com")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
			expect(getByText("http://feed2.com")).toBeTruthy();
		});
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const logoutAction = menuItems.find((item: any) => item.label === "Log-out");
		logoutAction.onPress();

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

		const { getByText, getAllByTestId } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("Feed 1")).toBeTruthy());

		// Trigger via the tap gesture handler mock which calls onHandlerStateChange
		const handlers = getAllByTestId("tap-gesture-handler");
		fireEvent.press(handlers[0]);

		expect(mocks.clipboard.setStringAsync).toHaveBeenCalledWith("http://feed1.com");
	});

	it("should call exportOpml when Export OPML is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const exportAction = menuItems.find((item: any) => item.label === "Export OPML");
		
		await act(async () => {
			await exportAction.onPress();
		});

		expect(mocks.api.exportOpml).toHaveBeenCalled();
	});

	it("should handle export failure", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);
		mocks.api.exportOpml.mockRejectedValue(new Error("Export Error"));

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const exportAction = menuItems.find((item: any) => item.label === "Export OPML");
		
		await act(async () => {
			await exportAction.onPress();
		});

		expect(mocks.alert).toHaveBeenCalledWith("Export Failed", "Export Error");
	});

	it("should call importOpml when Import OPML is pressed and file is valid", async () => {
		const mockFileUri = "file:///test.opml";
		mocks.documentPicker.getDocumentAsync.mockResolvedValue({
			canceled: false,
			assets: [{ uri: mockFileUri }]
		});
		mocks.api.readTextFile.mockResolvedValue("<opml>test</opml>");
		const mockImportResponse = { message: "Import started", count: 5 };
		mocks.api.importOpml.mockResolvedValue(mockImportResponse);

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const importAction = menuItems.find((item: any) => item.label === "Import OPML");
		
		await act(async () => {
			await importAction.onPress();
		});

		expect(mocks.documentPicker.getDocumentAsync).toHaveBeenCalled();
		expect(mocks.api.importOpml).toHaveBeenCalledWith(mockFileUri);
		expect(mocks.alert).toHaveBeenCalledWith(
			"Import Started",
			expect.stringContaining("Importing 5 feeds")
		);
	});
});
