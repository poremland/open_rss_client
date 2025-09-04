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
import { render, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer, useFocusEffect } from "@react-navigation/native";
import FeedListScreen from "../app/FeedListScreen";
import useApi from "../app/components/useApi";
import * as authHelper from "../helpers/auth";
import { useRouter, useNavigation } from "expo-router";
import GlobalDropdownMenu from "../app/components/GlobalDropdownMenu";
import { useMenu } from "../app/components/GlobalDropdownMenu";

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

jest.mock("@react-navigation/native", () => ({
	...jest.requireActual("@react-navigation/native"),
	useFocusEffect: jest.fn(),
}));

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
};
const mockNavigation = {
	setOptions: jest.fn((options) => {
		if (options.headerRight) {
			const HeaderRightComponent = options.headerRight();
			mockNavigation.headerRightProps = HeaderRightComponent.props;
		}
	}),
};

jest.mock("expo-router", () => ({
	useRouter: () => mockRouter,
	useNavigation: () => mockNavigation,
}));

describe("FeedListScreen", () => {
	beforeEach(() => {
		mockRouter.push.mockClear();
		mockRouter.replace.mockClear();
		mockNavigation.setOptions.mockClear();
		(useApi as jest.Mock).mockClear();
		(authHelper.getUser as jest.Mock).mockResolvedValue("testuser");
		(authHelper.clearAuthData as jest.Mock).mockClear();
	});

	it("should display a list of feeds", async () => {
		const mockFeeds = [
			{ feed: { id: 1, name: "Feed 1", count: 10 } },
			{ feed: { id: 2, name: "Feed 2", count: 5 } },
		];
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(getByText("Feed 1 (10)")).toBeTruthy();
			expect(getByText("Feed 2 (5)")).toBeTruthy();
		});
	});

	it("should navigate to AddFeedScreen when Add Feed is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(mockSetMenuItems).toHaveBeenCalled();
		});

		const menuItems = mockSetMenuItems.mock.calls[0][0];
		const addFeedMenuItem = menuItems.find(
			(item) => item.label === "Add Feed",
		);

		addFeedMenuItem.onPress();

		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith("/AddFeedScreen");
		});
	});

	it("should navigate to ManageFeedsListScreen when Manage Feeds is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(mockSetMenuItems).toHaveBeenCalled();
		});

		const menuItems = mockSetMenuItems.mock.calls[0][0];
		const manageFeedsMenuItem = menuItems.find(
			(item) => item.label === "Manage Feeds",
		);

		manageFeedsMenuItem.onPress();

		await waitFor(() => {
			expect(mockRouter.push).toHaveBeenCalledWith(
				"/ManageFeedsListScreen",
			);
		});
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(mockSetMenuItems).toHaveBeenCalled();
		});

		const menuItems = mockSetMenuItems.mock.calls[0][0];
		const logoutMenuItem = menuItems.find(
			(item) => item.label === "Log-out",
		);

		logoutMenuItem.onPress();

		await waitFor(() => {
			expect(authHelper.clearAuthData).toHaveBeenCalledWith(mockRouter);
		});
	});

	it("should display loading message when feeds are loading", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: true,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(getByText("Loading feeds...")).toBeTruthy();
		});
	});

	it("should display error message when api call fails", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: false,
			error: "API Error",
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(getByText(/API Error/)).toBeTruthy();
		});
	});

	it("should display no feeds message when there are no feeds", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: [],
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		act(() => {
			const focusEffectCallback = (useFocusEffect as jest.Mock).mock
				.calls[0][0];
			focusEffectCallback();
		});

		await waitFor(() => {
			expect(
				getByText("Congratulations! No more feeds with unread items."),
			).toBeTruthy();
		});
	});
});