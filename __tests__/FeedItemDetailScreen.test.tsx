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
import { render, waitFor, fireEvent, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import FeedItemDetailScreen from "../app/FeedItemDetailScreen";
import useApi from "../app/components/useApi";
import * as authHelper from "../helpers/auth";
import { useRouter, useNavigation } from "expo-router";
import GlobalDropdownMenu, {
	useMenu,
} from "../app/components/GlobalDropdownMenu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Share, Alert, Platform } from "react-native";
import * as Clipboard from "expo-clipboard";

jest.mock("@expo/vector-icons", () => {
	const { Text } = require("react-native");
	return {
		Ionicons: (props) => <Text testID={props.name}>{props.name}</Text>,
	};
});

jest.mock("../app/components/useApi");
jest.mock("../helpers/auth");
jest.mock("react-native-webview", () => ({ WebView: () => <></> }));
jest.mock("react-native/Libraries/Linking/Linking", () => ({
	openURL: jest.fn(),
	addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
}));
jest.mock("react-native/Libraries/Share/Share", () => ({
	share: jest.fn(),
}));
jest.mock("expo-clipboard", () => ({
	setStringAsync: jest.fn(),
}));
jest.spyOn(Alert, "alert");

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

describe("FeedItemDetailScreen", () => {
	const mockFeed = { id: 1, name: "Test Feed" };
	const mockFeedItem = {
		feedItem: {
			id: 1,
			title: "Item 1",
			link: "link1",
			description: "desc1",
		},
	};

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
	});

	it("should display feed item details", async () => {
		AsyncStorage.setItem("feed", JSON.stringify(mockFeed));
		AsyncStorage.setItem("selectedItem", JSON.stringify(mockFeedItem));
		(useApi as jest.Mock).mockReturnValue({
			data: {},
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemDetailScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("Item 1")).toBeTruthy();
		});
	});

	const testHeaderInteraction = async (
		menuItemText,
		expectedMock,
		expectedArgs,
		apiResult = {},
	) => {
		AsyncStorage.setItem("feed", JSON.stringify(mockFeed));
		AsyncStorage.setItem("selectedItem", JSON.stringify(mockFeedItem));
		const execute = jest.fn().mockResolvedValue(apiResult);
		(useApi as jest.Mock).mockReturnValue({
			data: {},
			loading: false,
			error: null,
			execute,
		});

		let onToggleDropdown;
		const TestComponent = () => {
			const menu = useMenu();
			onToggleDropdown = menu.onToggleDropdown;
			return <FeedItemDetailScreen />;
		};

		const { getByText, debug } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<TestComponent />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => expect(onToggleDropdown).toBeDefined());

		act(() => {
			onToggleDropdown();
		});

		await waitFor(() => getByText(menuItemText));
		fireEvent.press(getByText(menuItemText));

		await waitFor(() => {
			expect(expectedMock).toHaveBeenCalledWith(...expectedArgs);
		});
	};

	it("should mark item as read when Mark As Read is pressed", async () => {
		await testHeaderInteraction(
			" | Mark As Read",
			mockNavigation.goBack,
			[],
		);
	}, 10000);

	it("should open the full site when Open Full Site is pressed", async () => {
			await testHeaderInteraction(" | Open Full Site", Linking.openURL, [
			mockFeedItem.feedItem.link,
		]);
	}, 10000);

	it("should share the item when Share is pressed", async () => {
		await testHeaderInteraction(" | Share", Share.share, [
			{
				message: `${mockFeedItem.feedItem.title}: ${mockFeedItem.feedItem.link}`,
			},
		]);
	}, 10000);

	it("should copy the link to the clipboard when sharing fails", async () => {
		(Share.share as jest.Mock).mockRejectedValue(new Error("Share failed"));
		await testHeaderInteraction(" | Share", Clipboard.setStringAsync, [
			mockFeedItem.feedItem.link,
		]);
		expect(Alert.alert).toHaveBeenCalledWith(
			"Link Copied",
			"The link has been copied to your clipboard.",
		);
	});

	it("should copy to clipboard on share error on non-web", async () => {
		Platform.OS = "android";
		(Share.share as jest.Mock).mockRejectedValue(new Error("Share failed"));
		await testHeaderInteraction(" | Share", Clipboard.setStringAsync, [
			mockFeedItem.feedItem.link,
		]);
		expect(Alert.alert).toHaveBeenCalledWith(
			"Link Copied",
			"The link has been copied to your clipboard.",
		);
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		await testHeaderInteraction(" | Log-out", authHelper.clearAuthData, [
			mockRouter,
		]);
	}, 10000);

	it("should go back if no feed item data is available", async () => {
		render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemDetailScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(mockNavigation.goBack).toHaveBeenCalled();
		});
	});

	it("should render with no feed in storage", async () => {
		AsyncStorage.setItem("selectedItem", JSON.stringify(mockFeedItem));
		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemDetailScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("Item 1")).toBeTruthy();
			expect(mockNavigation.setOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					headerTitle: "Feed Item",
				}),
			);
		});
	});

	it("should display an error message when the api fails", async () => {
		AsyncStorage.setItem("feed", JSON.stringify(mockFeed));
		AsyncStorage.setItem("selectedItem", JSON.stringify(mockFeedItem));
		const execute = jest.fn().mockRejectedValue("Error");
		(useApi as jest.Mock).mockReturnValue({
			data: {},
			loading: false,
			error: "Error",
			execute,
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<FeedItemDetailScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("Error")).toBeTruthy();
		});
	});
});