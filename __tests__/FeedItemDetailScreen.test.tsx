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

(globalThis as any).__DEV__ = true;
(globalThis as any).process.env.EXPO_OS = "ios";

import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";

// Mock implementation helper
const mockComponent = (name: string) => (props: any) => React.createElement(name, props, props.children);

const alertMock = mock();
const routerMocks = { push: mock(), replace: mock(), back: mock(), dismissAll: mock() };
const navigationMocks = { setOptions: mock(), goBack: mock() };

const RNMock = {
	View: mockComponent("View"),
	Text: mockComponent("Text"),
	TouchableOpacity: mockComponent("TouchableOpacity"),
	TouchableWithoutFeedback: mockComponent("TouchableWithoutFeedback"),
	TouchableHighlight: mockComponent("TouchableHighlight"),
	Pressable: mockComponent("Pressable"),
	Button: mock(({ title, onPress, testID }: any) => {
		return React.createElement(RNMock.Pressable, { onPress, testID, accessibilityRole: "button" }, 
			React.createElement(RNMock.Text, {}, title)
		);
	}),
	FlatList: mock(({ data, renderItem }: any) => (
		React.createElement(RNMock.View, {}, data?.map((item: any, index: number) => 
			React.createElement(RNMock.View, { key: index }, renderItem({ item, index }))
		))
	)),
	ScrollView: mockComponent("ScrollView"),
	Image: mockComponent("Image"),
	TextInput: mockComponent("TextInput"),
	ActivityIndicator: mockComponent("ActivityIndicator"),
	RefreshControl: mockComponent("RefreshControl"),
	KeyboardAvoidingView: mockComponent("KeyboardAvoidingView"),
	Modal: mockComponent("Modal"),
	StyleSheet: {
		create: (s: any) => s,
		flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : s,
	},
	Platform: { OS: "ios", select: (o: any) => o.ios || o.default },
	Alert: { alert: alertMock },
	Dimensions: { get: () => ({ width: 375, height: 812 }) },
	PixelRatio: { get: () => 1, roundToNearestPixel: (n: number) => n },
	Linking: { openURL: mock(), canOpenURL: mock(), getInitialURL: mock() },
	Share: { share: mock() },
	I18nManager: { isRTL: false, allowRTL: mock(), forceRTL: mock(), getConstants: () => ({ isRTL: false }) },
	Keyboard: { addListener: mock(() => ({ remove: mock() })), dismiss: mock() },
	StatusBar: { setBarStyle: mock(), setHidden: mock() },
	TurboModuleRegistry: { get: mock(), getEnforcing: mock() },
	NativeEventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	},
	processColor: (c: any) => c,
	NativeModules: {},
};

// Mock modules BEFORE importing them
mock.module("react-native", () => RNMock);
mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: mock(() => ({ feedItemId: "1" })),
}));
mock.module("../assets/images/icon.png", () => ({ default: 1 }));

mock.module("expo-modules-core", () => ({
	EventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	},
	requireNativeViewManager: mock(() => () => null),
	requireOptionalNativeModule: mock(() => ({})),
	requireNativeModule: mock(() => ({})),
	UnavailabilityError: class extends Error { code = 'ERR_UNAVAILABLE'; constructor(m: string, p: string) { super(`${m}.${p} is unavailable`); } },
	CodedError: class extends Error { constructor(public code: string, message: string) { super(message); } },
	Platform: { OS: "ios", select: (o: any) => o.ios || o.default },
}));

// Set up global expo mock for modules that expect it
(globalThis as any).expo = {
	EventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	}
};

// Custom implementation mocks
const useApiMock = mock();
mock.module("../app/components/useApi", () => ({
	default: useApiMock,
}));

mock.module("../app/components/Screen", () => {
	return (props: any) => React.createElement(RNMock.View, props, props.children);
});

const { render, waitFor } = require("@testing-library/react-native");
const FeedItemDetailScreen = require("../app/FeedItemDetailScreen").default;

describe("FeedItemDetailScreen", () => {
	const mockItem = {
		id: 1,
		title: "Test Item",
		link: "http://test.com/item",
		description: "Test Description",
		pubDate: "2023-01-01",
	};

	beforeEach(() => {
		useApiMock.mockClear();
		routerMocks.push.mockClear();
		routerMocks.replace.mockClear();
		routerMocks.back.mockClear();
		routerMocks.dismissAll.mockClear();
		navigationMocks.setOptions.mockClear();
		navigationMocks.goBack.mockClear();
		
		useApiMock.mockReturnValue({
			data: mockItem,
			loading: false,
			error: null,
			execute: mock().mockResolvedValue(mockItem),
		});
	});

	it("should display feed item details (via header title)", async () => {
		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(navigationMocks.setOptions).toHaveBeenCalledWith(
				expect.objectContaining({ headerTitle: "Test Item" })
			);
		});
	});

	it("should apply webViewContainer style", async () => {
		const { getByTestId } = render(<FeedItemDetailScreen />);
		await waitFor(() => {
			expect(getByTestId("webViewContainer")).toBeTruthy();
		});
	});
});
