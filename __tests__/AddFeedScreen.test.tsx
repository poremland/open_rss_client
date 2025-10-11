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
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import AddFeedScreen from "../app/AddFeedScreen";
import useApi from "../app/components/useApi";
import * as authHelper from "../helpers/auth";
import { useNavigation } from "expo-router";

jest.mock("../app/components/useApi");
jest.mock("../helpers/auth");
jest.mock("expo-router", () => ({
	useNavigation: jest.fn(),
}));

describe("AddFeedScreen", () => {
	const mockExecute = jest.fn();
	const mockGoBack = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		(useApi as jest.Mock).mockReturnValue({
			loading: false,
			error: null,
			execute: mockExecute,
		});
		(authHelper.getUser as jest.Mock).mockResolvedValue("test-user");
		(useNavigation as jest.Mock).mockReturnValue({ goBack: mockGoBack });
	});

	it("renders correctly", () => {
		const { getByText, getByPlaceholderText } = render(<AddFeedScreen />);
		expect(getByText("Add New Feed")).toBeTruthy();
		expect(getByPlaceholderText("FeedName")).toBeTruthy();
		expect(getByPlaceholderText("FeedUri")).toBeTruthy();
		expect(getByText("Add Feed")).toBeTruthy();
	});

	it("calls addFeed with correct parameters on button press", async () => {
		const { getByText, getByPlaceholderText } = render(<AddFeedScreen />);
		const feedNameInput = getByPlaceholderText("FeedName");
		const feedUriInput = getByPlaceholderText("FeedUri");
		const addButton = getByText("Add Feed");

		fireEvent.changeText(feedNameInput, "Test Feed");
		fireEvent.changeText(feedUriInput, "http://test.com/feed.xml");
		fireEvent.press(addButton);

		await waitFor(() => {
			expect(authHelper.getUser).toHaveBeenCalled();
			expect(mockExecute).toHaveBeenCalledWith({
				"feed[uri]": "http://test.com/feed.xml",
				"feed[name]": "Test Feed",
				"feed[user]": "test-user",
			});
		});
	});

	it("navigates back on successful feed addition", async () => {
		mockExecute.mockResolvedValue({ id: 1 });
		const { getByText, getByPlaceholderText } = render(<AddFeedScreen />);
		const feedNameInput = getByPlaceholderText("FeedName");
		const feedUriInput = getByPlaceholderText("FeedUri");
		const addButton = getByText("Add Feed");

		fireEvent.changeText(feedNameInput, "Test Feed");
		fireEvent.changeText(feedUriInput, "http://test.com/feed.xml");
		fireEvent.press(addButton);

		await waitFor(() => {
			expect(mockGoBack).toHaveBeenCalled();
		});
	});

	it("displays an error message on failed feed addition", async () => {
		(useApi as jest.Mock).mockReturnValue({
			loading: false,
			error: "Failed to add feed",
			execute: mockExecute,
		});

		const { getByText } = render(<AddFeedScreen />);
		expect(getByText("Failed to add feed")).toBeTruthy();
	});

	it("displays a loading indicator when adding a feed", () => {
		(useApi as jest.Mock).mockReturnValue({
			loading: true,
			error: null,
			execute: mockExecute,
		});

		const { getByText } = render(<AddFeedScreen />);
		expect(getByText("Loading...")).toBeTruthy();
	});
});
