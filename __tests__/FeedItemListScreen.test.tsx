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
import {
	render,
	waitFor,
	fireEvent,
	act,
	screen,
} from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import FeedItemListScreen from "../app/FeedItemListScreen";
import useApi from "../app/components/useApi";
import * as authHelper from "../helpers/auth";
import { useRouter, useNavigation } from "expo-router";
import GlobalDropdownMenu, {
	useMenu,
} from "../app/components/GlobalDropdownMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const mockSetMenuItems = jest.fn();
const mockOnToggleDropdown = jest.fn();

jest.mock("../app/components/GlobalDropdownMenu", () => ({
	__esModule: true,
	...jest.requireActual("../app/components/GlobalDropdownMenu"),
	useMenu: () => ({
		setMenuItems: mockSetMenuItems,
		onToggleDropdown: mockOnToggleDropdown,
	}),
}));

jest.mock("@react-navigation/native", () => {
	const React = require("react");
	const { act } = require("@testing-library/react-native");
	return {
		...jest.requireActual("@react-navigation/native"),
		useFocusEffect: jest.fn((callback) => {
			React.useEffect(() => {
				act(() => callback());
			}, [callback]);
		}),
	};
});

jest.mock("@expo/vector-icons", () => {
	const { Text } = require("react-native");
	return {
		Ionicons: (props) => <Text testID={props.name}>{props.name}</Text>,
	};
});

jest.mock("../app/components/useApi");
jest.mock("../helpers/auth");

const mockRouter = {
	push: jest.fn(),
	replace: jest.fn(),
	back: jest.fn(),
};
const mockNavigation = {
	setOptions: jest.fn(),
	goBack: jest.fn(),
};

jest.mock("expo-router", () => ({
	useRouter: () => mockRouter,
	useNavigation: () => mockNavigation,
}));

describe("FeedItemListScreen", () => {
	const mockFeed = { id: 1, name: "Test Feed" };
	const mockFeedItems = [
		{ id: 1, title: "Item 1", link: "link1", description: "desc1" },
		{ id: 2, title: "Item 2", link: "link2", description: "desc2" },
	];

	beforeEach(() => {
		mockRouter.push.mockClear();
		mockRouter.replace.mockClear();
		mockRouter.back.mockClear();
		mockNavigation.setOptions.mockClear();
		mockNavigation.goBack.mockClear();
		(useApi as jest.Mock).mockClear();
		(authHelper.getUser as jest.Mock).mockResolvedValue("testuser");
		(authHelper.clearAuthData as jest.Mock).mockClear();
		AsyncStorage.clear();
		AsyncStorage.setItem("feed", JSON.stringify(mockFeed));
		jest.useFakeTimers();
	});

	it("should display a list of feed items", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute: jest.fn().mockResolvedValue(mockFeedItems),
		});

		render(
			<NavigationContainer>
				<FeedItemListScreen />
			</NavigationContainer>,
		);

		await waitFor(
			() => {
				expect(screen.getByText("Item 1")).toBeTruthy();
				expect(screen.getByText("Item 2")).toBeTruthy();
			},
			{ timeout: 10000 },
		);
	});

	const testHeaderInteraction = async (
		menuItemText,
		expectedMock,
		expectedArgs,
		apiResult = {},
	) => {
		const execute = jest.fn().mockResolvedValue(apiResult);
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute,
		});

		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(mockSetMenuItems).toHaveBeenCalled();
		});

		const menuItems = mockSetMenuItems.mock.calls[0][0];
		const menuItem = menuItems.find((item) => item.label === menuItemText);

		menuItem.onPress();

		await waitFor(() => {
			expect(expectedMock).toHaveBeenCalledWith(...expectedArgs);
		});
	};

	it("should mark all items as read when Mark All As Read is pressed", async () => {
		await testHeaderInteraction(
			"Mark All As Read",
			mockNavigation.goBack,
			[],
		);
	});

	it("should delete the feed when Delete Feed is pressed", async () => {
		await testHeaderInteraction("Delete Feed", mockNavigation.goBack, []);
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		await testHeaderInteraction("Log-out", authHelper.clearAuthData, [
			mockRouter,
		]);
	});

	it("should activate multi-select mode when an item is long-pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute: jest.fn().mockResolvedValue({}),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Item 1"));
		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => {
			expect(getByText("Select All")).toBeTruthy();
			expect(getByText("Mark Read")).toBeTruthy();
			expect(getByText("Done")).toBeTruthy();
		});
	});

	it("should mark selected items as read when Mark Read is pressed", async () => {
		const execute = jest.fn().mockResolvedValue({});
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute,
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Item 1"));
		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => getByText("Mark Read"));
		fireEvent.press(getByText("Mark Read"));

		await waitFor(() => {
			expect(execute).toHaveBeenCalledWith({
				items: JSON.stringify([1]),
			});
		});
	});

	it("should display an error message if the api call fails", async () => {
		let resolveExecute;
		const executePromise = new Promise((resolve) => {
			resolveExecute = resolve;
		});

		(useApi as jest.Mock).mockReturnValue({
			data: null,
			loading: false,
			error: "API Error",
			execute: jest.fn().mockImplementation(() => executePromise),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await act(async () => {
			jest.runAllTimers();
		});

		await waitFor(() => {
			expect(screen.getByText(/API Error/)).toBeTruthy();
		});
	});

	it("should select all items when Select All is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute: jest.fn().mockResolvedValue({}),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Item 1"));
		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => getByText("Select All"));
		fireEvent.press(getByText("Select All"));

		await waitFor(() => {
			expect(getByText("Mark Read")).toBeTruthy();
		});
	});

	it("should exit multi-select mode when Done is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute: jest.fn().mockResolvedValue({}),
		});

		const { getByText, queryByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Item 1"));
		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => getByText("Done"));
		fireEvent.press(getByText("Done"));

		await waitFor(() => {
			expect(queryByText("Select All")).toBeNull();
		});
	});

	it("should remove an item from the list when it is marked as read", async () => {
		const setData = jest.fn();
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItems,
			loading: false,
			error: null,
			execute: jest.fn().mockResolvedValue({}),
			setData,
		});
		await AsyncStorage.setItem("removedItemId", "1");

		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(setData).toHaveBeenCalledWith(expect.any(Function));
			const updater = setData.mock.calls[0][0];
			const updatedItems = updater(mockFeedItems);
			expect(updatedItems).toEqual([mockFeedItems[1]]);
		});
	});

	it("should decode HTML entities in the title", async () => {
		const encodedTitle = "Test&#39;s &amp; Title";
		const decodedTitle = "Test's & Title";
		const mockFeedItemsWithEncodedTitle = [
			{ id: 1, title: encodedTitle, link: "link1", description: "desc1" },
		];

		let resolveExecute;
		const executePromise = new Promise((resolve) => {
			resolveExecute = resolve;
		});

		(useApi as jest.Mock).mockReturnValue({
			data: mockFeedItemsWithEncodedTitle,
			loading: false,
			error: null,
			execute: jest.fn().mockImplementation(() => executePromise),
			setData: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await act(async () => {
			jest.runAllTimers();
		});

		await waitFor(() => {
			expect(screen.getByText(decodedTitle)).toBeTruthy();
		});
	});
});