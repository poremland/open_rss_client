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

import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("expo-font");
jest.mock("./helpers/api", () => ({
	get: jest.fn(),
	getWithAuth: jest.fn(),
	post: jest.fn(),
	postWithAuth: jest.fn(),
	putWithAuth: jest.fn(),
	refreshToken: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => {
	const { View } = require("react-native");
	return {
		Ionicons: View,
		AntDesign: View,
		MaterialIcons: View,
	};
});

// Explicitly mock react-native-reanimated
jest.mock("react-native-reanimated", () => {
	const Reanimated = require("react-native-reanimated/mock");

	// This will store a map of gestureHandler objects keyed by item ID
	let animatedGestureHandlers = new Map();
	let sharedValues = [];

	Reanimated.useAnimatedGestureHandler = jest.fn((callbacks) => {
		const handler = {
			onStart: jest.fn((event, ctx) => callbacks.onStart?.(event, ctx)),
			onActive: jest.fn((event, ctx) => callbacks.onActive?.(event, ctx)),
			onEnd: jest.fn((event, ctx) => callbacks.onEnd?.(event, ctx)),
			onFail: jest.fn((event, ctx) => callbacks.onFail?.(event, ctx)),
			onCancel: jest.fn((event, ctx) => callbacks.onCancel?.(event, ctx)),
		};
		return handler;
	});

	Reanimated.useSharedValue = jest.fn((initialValue) => {
		const sharedValue = { value: initialValue };
		sharedValues.push(sharedValue);
		return sharedValue;
	});

	Reanimated.useAnimatedStyle = jest.fn((style) => style());
	Reanimated.withSpring = jest.fn((value) => value);
	Reanimated.runOnJS = jest.fn((fn) => fn); // Mock runOnJS to execute immediately

	// Expose a way to get/set/clear specific animated gesture handlers for testing
	Reanimated._getAnimatedGestureHandler = (itemId) =>
		animatedGestureHandlers.get(itemId);
	Reanimated._setAnimatedGestureHandler = (itemId, handler) =>
		animatedGestureHandlers.set(itemId, handler);
	Reanimated._clearAnimatedGestureHandlers = () =>
		animatedGestureHandlers.clear();
	Reanimated._getSharedValues = () => sharedValues;
	Reanimated._clearSharedValues = () => {
		sharedValues = [];
	};

	return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
	const View = require("react-native").View;
	const Reanimated = require("react-native-reanimated"); // Import the mocked reanimated
	const actualGestureHandler = jest.requireActual(
		"react-native-gesture-handler",
	); // Get actual module

	const MockPanGestureHandler = ({
		children,
		onGestureEvent,
		item,
		...props
	}) => {
		if (item && onGestureEvent) {
			Reanimated._setAnimatedGestureHandler(item.id, onGestureEvent);
		}
		return <View {...props}>{children}</View>;
	};

	return {
		// Mock GestureHandlerRootView as a simple View
		GestureHandlerRootView: ({ children }) => <View>{children}</View>,
		PanGestureHandler: MockPanGestureHandler,
		gestureHandlerRootHOC: (Component) => Component,
		State: actualGestureHandler.State, // Access State from the actual module
		// Expose a helper to trigger the handler
		_triggerPanGestureHandlerEvent: (itemId, eventName, ...args) => {
			const handler = Reanimated._getAnimatedGestureHandler(itemId);
			if (!handler) {
				console.warn(`No animated gesture handler found for item ID: ${itemId}`);
				return;
			}

			const eventHandler = handler[eventName];
			if (eventHandler) {
				eventHandler(...args);
			}
		},
	};
});
