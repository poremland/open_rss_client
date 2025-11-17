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
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');

  // This will store a map of gestureHandler objects keyed by item ID
  let animatedGestureHandlers = new Map();

  Reanimated.useAnimatedGestureHandler = jest.fn((callbacks) => {
    const handler = {
      onActive: jest.fn((event) => callbacks.onActive?.(event)),
      onEnd: jest.fn((event) => {
        if (callbacks.onEnd) {
          callbacks.onEnd(event);
        }
      }),
      onFail: jest.fn((event) => {
        if (callbacks.onFail) {
          callbacks.onFail(event);
        }
      }),
      onCancel: jest.fn((event) => {
        if (callbacks.onCancel) {
          callbacks.onCancel(event);
        }
      }),
    };
    return handler;
  });

  Reanimated.useSharedValue = jest.fn((initialValue) => ({ value: initialValue }));
  Reanimated.useAnimatedStyle = jest.fn((style) => style());
  Reanimated.withSpring = jest.fn((value) => value);
  Reanimated.runOnJS = jest.fn((fn) => fn); // Mock runOnJS to execute immediately

  // Expose a way to get/set/clear specific animated gesture handlers for testing
  Reanimated._getAnimatedGestureHandler = (itemId) => animatedGestureHandlers.get(itemId);
  Reanimated._setAnimatedGestureHandler = (itemId, handler) => animatedGestureHandlers.set(itemId, handler);
  Reanimated._clearAnimatedGestureHandlers = () => animatedGestureHandlers.clear();

  return Reanimated;
});

// Mock react-native-gesture-handler
jest.mock("react-native-gesture-handler", () => {
	const View = require("react-native").View;
	const Reanimated = require('react-native-reanimated'); // Import the mocked reanimated
	const actualGestureHandler = jest.requireActual("react-native-gesture-handler"); // Get actual module

	const MockPanGestureHandler = ({ children, onGestureEvent, onHandlerStateChange, item, ...props }) => { // Add 'item' prop
		const handler = onGestureEvent || onHandlerStateChange; // Assuming both are the same handler object
		if (item && handler) {
			Reanimated._setAnimatedGestureHandler(item.id, handler);
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
		_triggerPanGestureHandlerStateChange: (itemId, event) => { // Add 'itemId' argument
			const handler = Reanimated._getAnimatedGestureHandler(itemId);
			if (!handler) {
				console.warn(`No animated gesture handler found for item ID: ${itemId}`);
				return;
			}

			const { state, translationX } = event.nativeEvent;

			// Simulate calling the appropriate method on the gesture handler object
			if (state === actualGestureHandler.State.END) {
				handler.onEnd({ translationX });
			} else if (state === actualGestureHandler.State.CANCELLED) {
				handler.onCancel({ translationX });
			} else if (state === actualGestureHandler.State.FAILED) {
				handler.onFail({ translationX });
			} else if (state === actualGestureHandler.State.ACTIVE) {
				handler.onActive({ translationX });
			}
		},
	};
});
