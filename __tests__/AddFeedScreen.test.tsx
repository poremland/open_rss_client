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
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { act } from "react";
import AddFeedScreen from "../app/AddFeedScreen";

describe("AddFeedScreen", () => {
        beforeEach(() => {
                mocks.resetAll();
                mocks.auth.getUser.mockResolvedValue("test-user");
        });

        it("renders correctly", async () => {
                const { getByPlaceholderText, getByText } = render(<AddFeedScreen />);
                expect(getByText("Feed Name")).toBeTruthy();
                expect(getByPlaceholderText("e.g. My Favorite Blog")).toBeTruthy();
                expect(getByText("Feed URL")).toBeTruthy();
                expect(getByPlaceholderText("https://example.com/rss.xml")).toBeTruthy();
                expect(getByText("Add Feed")).toBeTruthy();
        });

        it("disables the add button and shows offline message when disconnected", async () => {
                mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
                mocks.useConnectionStatusMock.isConnected = false;
                const { getByTestId, getByText } = render(<AddFeedScreen />);
                const addButton = getByTestId("addFeedButton");

                await waitFor(() => expect(addButton.props.disabled).toBe(true));
                expect(getByText("You are offline. Adding feeds is disabled.")).toBeTruthy();
        });

        it("calls addFeed with correct parameters on button press", async () => {		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("e.g. My Favorite Blog");
		const uriInput = getByPlaceholderText("https://example.com/rss.xml");
		const addButton = getByTestId("addFeedButton");

		fireEvent.changeText(nameInput, "Test Feed");
		fireEvent.changeText(uriInput, "http://test.com/feed.xml");

		mocks.api.postWithAuth.mockResolvedValue({ id: 1 });

		await act(async () => {
			fireEvent.press(addButton);
		});

		await waitFor(() => {
			expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
				"/feeds/create",
				{
					feed: {
						name: "Test Feed",
						uri: "http://test.com/feed.xml",
						user: "test-user",
					}
				},
				"application/json"
			);
		});
	});

	it("navigates back on successful feed addition", async () => {
		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("e.g. My Favorite Blog");
		const uriInput = getByPlaceholderText("https://example.com/rss.xml");
		const addButton = getByTestId("addFeedButton");

		fireEvent.changeText(nameInput, "Test Feed");
		fireEvent.changeText(uriInput, "http://test.com/feed.xml");

		mocks.api.postWithAuth.mockResolvedValue({ id: 1 });

		await act(async () => {
			fireEvent.press(addButton);
		});

		await waitFor(() => {
			expect(mocks.navigation.goBack).toHaveBeenCalled();
		});
	});

	it("displays an error message on failed feed addition", async () => {
		const { getByTestId, getByText } = render(<AddFeedScreen />);
		const addButton = getByTestId("addFeedButton");

		mocks.api.postWithAuth.mockRejectedValue(new Error("Failed to add feed"));

		await act(async () => {
			fireEvent.press(addButton);
		});

		await waitFor(() => {
			expect(getByText("Failed to add feed")).toBeTruthy();
		});
	});

	it("displays a loading indicator when adding a feed", async () => {
		const { getByTestId, getByText } = render(<AddFeedScreen />);
		const addButton = getByTestId("addFeedButton");

		let resolvePromise: any;
		const promise = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		mocks.api.postWithAuth.mockReturnValue(promise);

		await act(async () => {
			fireEvent.press(addButton);
		});

		expect(getByText("Loading...")).toBeTruthy();

		await act(async () => {
			resolvePromise({ id: 1 });
		});
	});
});
