import "./setup";
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

import * as setup from "./setup";
import { expect, describe, it, mock, beforeEach, spyOn } from "bun:test";
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";

mock.module("../app/components/ListScreen", () => {
	const React = require("react");
	const { View, Text } = require("react-native");
	const ListScreen = React.forwardRef(({ emptyComponent, data, loading, fetchUrl, renderItem, transformData, onItemPress }, ref) => {
		const useApi = require("../app/components/useApi").default;
		const { data: apiData, loading: apiLoading, error, execute } = useApi("GET", fetchUrl);

		React.useImperativeHandle(ref, () => ({
			handleRefresh: async () => {
				await execute();
			},
		}));

		if (apiLoading) return React.createElement(Text, {}, "Loading...");
		if (error) return React.createElement(Text, {}, error);

		const displayData = apiData ? (transformData ? transformData(apiData) : apiData) : [];

		if (displayData.length === 0) return emptyComponent;

		return React.createElement(
			View,
			{},
			displayData.map((item: any, index: number) => 
				React.createElement(View, { key: index }, renderItem({ 
					item, 
					onPress: () => onItemPress(item),
					onLongPress: () => {},
					isItemSelected: false
				}))
			)
		);
	});
	return { default: ListScreen };
});

import ManageFeedsListScreen from "../app/ManageFeedsListScreen";
import * as auth from "../helpers/auth_helper";

describe("ManageFeedsListScreen", () => {
	const mockFeeds = [
		{ id: 1, name: "Feed 1", uri: "http://feed1.com" },
		{ id: 2, name: "Feed 2", uri: "http://feed2.com" },
	];

	beforeEach(async () => {
		setup.resetAll();
	});

	it("should fetch feeds when the screen is focused", async () => {
		const execute = mock().mockResolvedValue(mockFeeds);
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute,
		});

		render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(execute).toHaveBeenCalled();
		});
	});

	it("should display a list of all feeds", async () => {
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
		});
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		const clearAuthDataSpy = spyOn(auth, "clearAuthData").mockImplementation(async () => {});
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock(),
		});

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(setup.useMenuMock.setMenuItems).toHaveBeenCalled());
		const menuItems = setup.useMenuMock.setMenuItems.mock.calls[0][0];
		const logoutItem = menuItems.find((item: any) => item.label === "Log-out");
		logoutItem.onPress();

		expect(clearAuthDataSpy).toHaveBeenCalled();
		clearAuthDataSpy.mockRestore();
	});

	it("should display loading message when feeds are loading", async () => {
		setup.useApiMock.mockReturnValue({
			loading: true,
			error: null,
			data: null,
			execute: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		expect(getByText("Loading...")).toBeTruthy();
	});

	it("should display error message when api call fails", async () => {
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: "Failed to fetch feeds",
			data: null,
			execute: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		expect(getByText("Failed to fetch feeds")).toBeTruthy();
	});

	it("should display no feeds message when there are no feeds", async () => {
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		expect(getByText("No feeds to manage!")).toBeTruthy();
	});

	it("should copy feed uri to clipboard on press", async () => {
		setup.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);

		await waitFor(() => getByText("Feed 1"));
		const feed1 = getByText("Feed 1");
		fireEvent.press(feed1);

		expect(setup.clipboardMocks.setStringAsync).toHaveBeenCalledWith("http://feed1.com");
	});
});
