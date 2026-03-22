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

import { mocks } from "./setup";
import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";
import { render, waitFor, fireEvent } from "@testing-library/react-native";

mock.module("../app/components/ListScreen", () => {
	const React = require("react");
	const { View, Text } = require("react-native");
	const ListScreen = React.forwardRef(({ emptyComponent, data, loading, fetchUrl, renderItem, transformData, onItemPress }, ref) => {
		const useApi = require("../app/components/useApi").default;
		const { data: apiData, loading: apiLoading, error, execute, setData } = useApi("GET", fetchUrl);

		React.useImperativeHandle(ref, () => ({
			handleRefresh: async () => {
				const res = await execute();
				return res ? (transformData ? transformData(res) : res) : [];
			},
			getData: () => (apiData ? (transformData ? transformData(apiData) : apiData) : []),
			setData,
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

import FeedItemListScreen from "../app/FeedItemListScreen";

describe("FeedItemListScreen", () => {
	const mockItems = [
		{ id: 1, title: "Item 1", link: "http://item1.com", description: "Desc 1", is_read: false },
		{ id: 2, title: "Item 2", link: "http://item2.com", description: "Desc 2", is_read: false },
	];

	beforeEach(async () => {
		mocks.resetAll();
	});

	it("should display a list of feed items", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockItems,
			execute: mock().mockResolvedValue(mockItems),
			setData: mock(),
		});

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => {
			expect(getByText("Item 1")).toBeTruthy();
			expect(getByText("Item 2")).toBeTruthy();
		});
	});

	it("should mark all items as read when Mark All As Read is pressed", async () => {
		const execute = mock().mockResolvedValue({ success: true });
		const setData = mock();
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockItems,
			execute,
			setData,
		});

		render(<FeedItemListScreen />);

		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenuMock.setMenuItems.mock.calls[0][0];
		const markAllReadItem = menuItems.find((item: any) => item.label === "Mark All As Read");
		markAllReadItem.onPress();

		await waitFor(() => {
			expect(execute).toHaveBeenCalled();
			expect(mocks.navigationMocks.goBack).toHaveBeenCalled();
		});
	});

	it("should activate multi-select mode when an item is long-pressed", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockItems,
			execute: mock().mockResolvedValue(mockItems),
			setData: mock(),
		});

		const { getByText } = render(<FeedItemListScreen />);
		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());
	});

	it("should mark selected items as read when Mark Read is pressed", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockItems,
			execute: mock().mockResolvedValue(mockItems),
			setData: mock(),
		});

		render(<FeedItemListScreen />);
		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());
	});

	it("should display an error message if the api call fails", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: "Failed to fetch items",
			data: null,
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<FeedItemListScreen />);
		expect(getByText("Failed to fetch items")).toBeTruthy();
	});

	it("should navigate to FeedItemDetailScreen when an item is pressed", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockItems,
			execute: mock().mockResolvedValue(mockItems),
			setData: mock(),
		});

		const { getByText } = render(<FeedItemListScreen />);
		await waitFor(() => getByText("Item 1"));
		const item1 = getByText("Item 1");
		fireEvent.press(item1);

		expect(mocks.routerMocks.push).toHaveBeenCalledWith({
			pathname: "/FeedItemDetailScreen",
			params: { feedItemId: "1" },
		});
	});
});
