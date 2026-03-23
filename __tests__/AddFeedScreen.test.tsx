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
import { mock, expect, describe, it, beforeEach, spyOn } from "bun:test";
import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import AddFeedScreen from "../app/AddFeedScreen";
import { resetAll, navigationMocks, useApiMock } from "./setup";
import * as authHelper from "../helpers/auth_helper";

describe("AddFeedScreen", () => {
	beforeEach(() => {
		resetAll();
	});

	it("renders correctly", () => {
		useApiMock.mockReturnValue({
			data: null,
			error: null,
			loading: false,
			execute: mock(),
		});
		const { getByPlaceholderText, getByText } = render(<AddFeedScreen />);
		expect(getByPlaceholderText("FeedName")).toBeTruthy();
		expect(getByPlaceholderText("FeedUri")).toBeTruthy();
		expect(getByText("Add Feed")).toBeTruthy();
	});

	it("calls addFeed with correct parameters on button press", async () => {
		const execute = mock().mockResolvedValue({ id: 1 });
		useApiMock.mockReturnValue({
			data: null,
			error: null,
			loading: false,
			execute,
		});
		const getUserSpy = spyOn(authHelper, "getUser").mockResolvedValue("test-user");

		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("FeedName");
		const uriInput = getByPlaceholderText("FeedUri");
		const addButton = getByTestId("addFeedButton");

		await act(async () => {
			nameInput.props.onChangeText("Test Feed");
			uriInput.props.onChangeText("http://test.com/feed.xml");
		});

		await act(async () => {
			addButton.props.onPress();
		});

		await waitFor(() => {
			expect(execute).toHaveBeenCalledWith({
				"feed[name]": "Test Feed",
				"feed[uri]": "http://test.com/feed.xml",
				"feed[user]": "test-user",
			});
		});
		getUserSpy.mockRestore();
	});

	it("navigates back on successful feed addition", async () => {
		const execute = mock().mockResolvedValue({ id: 1 });
		useApiMock.mockReturnValue({
			data: null,
			error: null,
			loading: false,
			execute,
		});
		const getUserSpy = spyOn(authHelper, "getUser").mockResolvedValue("test-user");

		const { getByPlaceholderText, getByTestId } = render(<AddFeedScreen />);
		const nameInput = getByPlaceholderText("FeedName");
		const uriInput = getByPlaceholderText("FeedUri");
		const addButton = getByTestId("addFeedButton");

		await act(async () => {
			nameInput.props.onChangeText("Test Feed");
			uriInput.props.onChangeText("http://test.com/feed.xml");
		});

		await act(async () => {
			addButton.props.onPress();
		});

		await waitFor(() => {
			expect(navigationMocks.goBack).toHaveBeenCalled();
		});
		getUserSpy.mockRestore();
	});

	it("displays an error message on failed feed addition", async () => {
		useApiMock.mockReturnValue({
			data: null,
			error: "Failed to add feed",
			loading: false,
			execute: mock(),
		});

		const { getByText } = render(<AddFeedScreen />);
		expect(getByText("Failed to add feed")).toBeTruthy();
	});

	it("displays a loading indicator when adding a feed", async () => {
		useApiMock.mockReturnValue({
			data: null,
			error: null,
			loading: true,
			execute: mock(),
		});

		const { getByText } = render(<AddFeedScreen />);
		expect(getByText("Loading...")).toBeTruthy();
	});
});
