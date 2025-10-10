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
import ManageFeedsListScreen from "../app/ManageFeedsListScreen";
import useApi from "../app/components/useApi";
import * as authHelper from "../helpers/auth";
import { useRouter, useNavigation } from "expo-router";
import GlobalDropdownMenu, {
	useMenu,
} from "../app/components/GlobalDropdownMenu";
import { listStyles } from "../styles/commonStyles";
import { styles } from "../styles/ManageFeedsListScreen.styles";
import ListScreen from "../app/components/ListScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";

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

jest.mock("../app/components/useApi", () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock("../helpers/auth", () => ({
	...jest.requireActual("../helpers/auth"),
	getUser: jest.fn(),
	clearAuthData: jest.fn(),
}));

describe("ManageFeedsListScreen", () => {
	const mockFeeds = [
		{ id: 1, name: "Feed 1", uri: "uri1" },
		{ id: 2, name: "Feed 2", uri: "uri2" },
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
		AsyncStorage.setItem("authToken", "test-token");
		AsyncStorage.setItem("serverUrl", "http://localhost:8080");
	});

	it("should display a list of all feeds", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
		});
	});

	const testHeaderInteraction = async (
		menuItemText,
		expectedMock,
		expectedArgs,
		apiResult = {},
	) => {
		const execute = jest.fn().mockResolvedValue(apiResult);
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute,
		});

		let onToggleDropdown;
		const TestComponent = () => {
			const menu = useMenu();
			onToggleDropdown = menu.onToggleDropdown;
			return <ManageFeedsListScreen />;
		};

		const { getByText } = render(
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

	it("should call clearAuthData when Log-out is pressed", async () => {
		await testHeaderInteraction("Log-out", authHelper.clearAuthData, [
			mockRouter,
		]);
	});

	it("should activate multi-select mode when a feed is long-pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Feed 1"));
		fireEvent(getByText("Feed 1"), "longPress");

		await waitFor(() => {
			expect(getByText("Select All")).toBeTruthy();
			expect(getByText("Delete")).toBeTruthy();
			expect(getByText("Done")).toBeTruthy();
		});
	});

	it("should delete selected feeds when Delete is pressed", async () => {
		const execute = jest.fn().mockResolvedValue({});
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute,
		});

		const { getByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Feed 1"));
		fireEvent(getByText("Feed 1"), "longPress");

		await waitFor(() => getByText("Delete"));
		fireEvent.press(getByText("Delete"));

		await waitFor(() => {
			expect(execute).toHaveBeenCalled();
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
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("Loading...")).toBeTruthy();
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
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

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
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => {
			expect(getByText("No feeds to manage!")).toBeTruthy();
		});
	});


	it("should select all feeds when Select All is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText, getByTestId } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Feed 1"));
		fireEvent(getByText("Feed 1"), "longPress");

		await waitFor(() => getByText("Select All"));
		fireEvent.press(getByText("Select All"));

		await waitFor(() => {
			const item1 = getByTestId("feed-item-1");
			const item2 = getByTestId("feed-item-2");
			const style1 = StyleSheet.flatten(item1.props.style);
			const style2 = StyleSheet.flatten(item2.props.style);
			expect(style1.backgroundColor).toEqual(listStyles.selectedItem.backgroundColor);
			expect(style2.backgroundColor).toEqual(listStyles.selectedItem.backgroundColor);
		});
	});

	it("should exit multi-select mode when Done is pressed", async () => {
		(useApi as jest.Mock).mockReturnValue({
			data: mockFeeds,
			loading: false,
			error: null,
			execute: jest.fn(),
		});

		const { getByText, queryByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<ManageFeedsListScreen />
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => getByText("Feed 1"));
		fireEvent(getByText("Feed 1"), "longPress");

		await waitFor(() => getByText("Done"));
		fireEvent.press(getByText("Done"));

		await waitFor(() => {
			expect(queryByText("Select All")).toBeNull();
		});
	});
});