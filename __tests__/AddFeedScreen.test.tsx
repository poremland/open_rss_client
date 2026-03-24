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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import AddFeedScreen from "../app/AddFeedScreen";

describe("AddFeedScreen", () => {
	beforeEach(() => {
		mocks.resetAll();
		mocks.auth.getUser.mockResolvedValue("test-user");
	});

	it("renders correctly", async () => {
		const { getByPlaceholderText, getByText } = render(<AddFeedScreen />);
		expect(getByPlaceholderText("FeedName")).toBeTruthy();
		expect(getByPlaceholderText("FeedUri")).toBeTruthy();
		expect(getByText("Add Feed")).toBeTruthy();
	});

	it("calls addFeed with correct parameters on button press", async () => {
		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("FeedName");
		const uriInput = getByPlaceholderText("FeedUri");
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
					"feed[name]": "Test Feed",
					"feed[uri]": "http://test.com/feed.xml",
					"feed[user]": "test-user",
				},
				"application/x-www-form-urlencoded"
			);
		});
	});

	it("navigates back on successful feed addition", async () => {
		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("FeedName");
		const uriInput = getByPlaceholderText("FeedUri");
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
