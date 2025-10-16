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
import { render, waitFor } from "@testing-library/react-native";
import FeedItemDetailScreen from "../app/FeedItemDetailScreen";
import Screen from "../app/components/Screen";
import useApi from "../app/components/useApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../app/components/useApi");

jest.mock("@expo/vector-icons", () => {
	const { Text } = require("react-native");
	return {
		Ionicons: (props) => <Text testID={props.name}>{props.name}</Text>,
	};
});

jest.mock("expo-router", () => ({
	useRouter: () => ({}),
	useNavigation: () => ({ setOptions: jest.fn() }),
	useLocalSearchParams: () => ({ feedItemId: "1" }),
}));

jest.mock("@react-navigation/native", () => {
	const React = require("react");
	return {
		...jest.requireActual("@react-navigation/native"),
		useFocusEffect: (callback) => {
			React.useEffect(callback);
		},
	};
});

jest.mock("../app/components/GlobalDropdownMenu", () => ({
	__esModule: true,
	...jest.requireActual("../app/components/GlobalDropdownMenu"),
	useMenu: () => ({
		setMenuItems: jest.fn(),
		onToggleDropdown: jest.fn(),
	}),
}));

jest.mock("../app/components/Screen", () => {
	const { View } = require("react-native");
	return (props) => <View>{props.children}</View>;
});

jest.mock("react-native-webview", () => ({ WebView: () => <></> }));

describe("FeedItemDetailScreen", () => {
	beforeEach(() => {
		AsyncStorage.setItem("serverUrl", "http://localhost:8080");
	});
	it("should display feed item details", async () => {
		(useApi as jest.Mock).mockImplementation((method, url) => {
			if (url.includes("mark_as_read")) {
				return {
					data: null,
					loading: false,
					error: null,
					execute: jest.fn(),
				};
			}
			return {
				data: { id: 1, title: "Item 1", link: "link1", description: "desc1" },
				loading: false,
				error: null,
				execute: jest.fn(),
			};
		});

		const { getByTestId } = render(<FeedItemDetailScreen />);

		await waitFor(() => {
			const webViewContainer = getByTestId("webViewContainer");
			expect(webViewContainer).toBeTruthy();
		});
	});

	it("should apply webViewContainer style", async () => {
		(useApi as jest.Mock).mockImplementation((method, url) => {
			if (url.includes("mark_as_read")) {
				return {
					data: null,
					loading: false,
					error: null,
					execute: jest.fn(),
				};
			}
			return {
				data: { id: 1, title: "Item 1", link: "link1", description: "desc1" },
				loading: false,
				error: null,
				execute: jest.fn(),
			};
		});

		const { getByTestId } = render(<FeedItemDetailScreen />);

		await waitFor(() => {
			const webViewContainer = getByTestId("webViewContainer");
			expect(webViewContainer.props.style).toHaveProperty("backgroundColor");
		});
	});
});
