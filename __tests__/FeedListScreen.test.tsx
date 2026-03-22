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
import { mock, expect, describe, it, beforeEach, spyOn } from "bun:test";
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

import FeedListScreen from "../app/FeedListScreen";
import * as auth from "../helpers/auth_helper";

describe("FeedListScreen", () => {
	const mockFeeds = [
		{ feed: { id: 1, name: "Feed 1", count: 10 } },
		{ feed: { id: 2, name: "Feed 2", count: 5 } },
	];

	beforeEach(async () => {
		mocks.resetAll();
	});

	it("should display a list of feeds", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock().mockResolvedValue(mockFeeds),
			setData: mock(),
		});

		const { getByText } = render(<FeedListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("10")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
			expect(getByText("5")).toBeTruthy();
		});
	});

	it("should navigate to AddFeedScreen when Add Feed is pressed", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());

		const menuItems = mocks.useMenuMock.setMenuItems.mock.calls[0][0];
		const addFeedMenuItem = menuItems.find((item: any) => item.label === "Add Feed");
		addFeedMenuItem.onPress();

		expect(mocks.routerMocks.push).toHaveBeenCalledWith("/AddFeedScreen");
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		const clearAuthDataSpy = spyOn(auth, "clearAuthData").mockImplementation(async () => {});
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());

		const menuItems = mocks.useMenuMock.setMenuItems.mock.calls[0][0];
		const logoutMenuItem = menuItems.find((item: any) => item.label === "Log-out");
		logoutMenuItem.onPress();

		expect(clearAuthDataSpy).toHaveBeenCalled();
		clearAuthDataSpy.mockRestore();
	});

	it("should display loading message when feeds are loading", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: true,
			error: null,
			data: null,
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<FeedListScreen />);
		expect(getByText("Loading...")).toBeTruthy();
	});

	it("should display error message when api call fails", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: "API Error",
			data: null,
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<FeedListScreen />);
		expect(getByText("API Error")).toBeTruthy();
	});

	it("should display no feeds message when there are no feeds", async () => {
		mocks.useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<FeedListScreen />);
		expect(getByText("Congratulations! No more feeds with unread items.")).toBeTruthy();
	});
});
