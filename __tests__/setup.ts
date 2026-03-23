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

import { mock } from "bun:test";
import { plugin } from "bun";
import * as React from "react";
import * as path from "path";
import * as fs from "fs";

// Truly Global State for Mocks - Stable References
export const storageMap = new Map();

export const routerMocks = {
	push: mock(),
	replace: mock(),
	back: mock(),
	dismissAll: mock(),
	setParams: mock(),
};

export const navigationMocks = {
	setOptions: mock(),
	goBack: mock(),
};

export const alertMock = mock();
export const fetchMock = mock();
export const clipboardMocks = {
	setStringAsync: mock(),
	isPasteButtonAvailable: false,
};

export const asyncStorageMock = {
	setItem: mock(async (k: string, v: any) => { storageMap.set(k, String(v)); }),
	getItem: mock(async (k: string) => { 
		const val = storageMap.get(k);
		return val === undefined ? null : val;
	}),
	removeItem: mock(async (k: string) => { storageMap.delete(k); }),
	clear: mock(async () => { storageMap.clear(); }),
	getAllKeys: mock(async () => Array.from(storageMap.keys())),
	multiGet: mock(async (keys: string[]) => keys.map(k => [k, storageMap.get(k) || null])),
};

export const apiMocks = {
	get: mock(),
	post: mock(),
	getWithAuth: mock(),
	postWithAuth: mock(),
	putWithAuth: mock(),
	refreshToken: mock(),
	setDeps: mock(),
};

export const authMocks = {
	storeAuthToken: mock(),
	getAuthToken: mock(),
	storeUser: mock(),
	getUser: mock(),
	clearAuthData: mock(),
	checkLoggedIn: mock(),
	refreshTokenOnLoad: mock(),
	handleSessionExpired: mock(),
	setDeps: mock(),
};

// Global config for useApi mock
export const useApiConfig = {
	data: null as any,
	loading: false,
	error: null as string | null,
	execute: mock().mockResolvedValue(null),
};

export const useApiMock = mock(() => {
	return {
		data: useApiConfig.data,
		loading: useApiConfig.loading,
		error: useApiConfig.error,
		execute: useApiConfig.execute,
		setData: mock(),
	};
});

export const useMenuMock = {
	setMenuItems: mock(),
	onToggleDropdown: mock(),
};

export const localSearchParamsMock = {
	params: {} as any,
};

const resetMocks = (obj: any) => {
	Object.values(obj).forEach(m => {
		if (m && typeof m === 'object' && 'mock' in m && typeof (m as any).mockClear === 'function') {
			m.mockClear();
		} else if (typeof m === 'function' && 'mock' in m && typeof (m as any).mockClear === 'function') {
			(m as any).mockClear();
		}
	});
};

export const resetAll = () => {
	storageMap.clear();
	resetMocks(routerMocks);
	resetMocks(navigationMocks);
	resetMocks(asyncStorageMock);
	resetMocks(clipboardMocks);
	resetMocks(apiMocks);
	resetMocks(authMocks);
	resetMocks(useMenuMock);
	
	useApiConfig.data = null;
	useApiConfig.loading = false;
	useApiConfig.error = null;
	useApiConfig.execute.mockClear().mockResolvedValue(null);
	
	useApiMock.mockClear();
	useApiMock.mockReturnValue({
		data: useApiConfig.data,
		loading: useApiConfig.loading,
		error: useApiConfig.error,
		execute: useApiConfig.execute,
		setData: mock(),
	});
	
	localSearchParamsMock.params = {};
	
	alertMock.mockClear();
	fetchMock.mockClear();
};

// Global Environment Setup
(globalThis as any).__DEV__ = true;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
process.env.EXPO_OS = "ios";

(globalThis as any).fetch = fetchMock;
(globalThis as any).AsyncStorage = asyncStorageMock;

// Initialize global state for tests
export const mocks = {
	storageMap,
	storage: storageMap,
	router: routerMocks,
	routerMocks,
	navigation: navigationMocks,
	navigationMocks,
	alert: alertMock,
	alertMock,
	fetch: fetchMock,
	fetchMock,
	clipboard: clipboardMocks,
	clipboardMocks,
	asyncStorage: asyncStorageMock,
	asyncStorageMock,
	api: apiMocks,
	apiMocks,
	auth: authMocks,
	authMocks,
	useApi: useApiMock,
	useApiMock,
	useMenu: useMenuMock,
	useMenuMock,
	localSearchParams: localSearchParamsMock,
	resetAll
};

(globalThis as any).__mocks = mocks;

// Bun Plugin for assets
plugin({
	name: "asset-interceptor",
	setup(build) {
		build.onLoad({ filter: /\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$/ }, () => ({
			contents: "export default 'mock-asset';",
			loader: "js",
		}));
	},
});

// Mock react-native
mock.module("react-native", () => {
	const React = require("react");
	const mockComponent = (name: string) => {
		const Comp = (props: any) => {
			const children = [];
			if (props.children) children.push(props.children);
			if (name === "Button" && props.title) {
				children.push(React.createElement("Text", { key: "title" }, props.title));
			}
			return React.createElement(name, props, ...children);
		};
		Comp.displayName = name;
		return Comp;
	};

	const View = mockComponent("View");
	const Text = mockComponent("Text");
	const TextInput = mockComponent("TextInput");
	const ScrollView = mockComponent("ScrollView");
	const Image = mockComponent("Image");
	const TouchableOpacity = mockComponent("TouchableOpacity");
	const TouchableWithoutFeedback = mockComponent("TouchableWithoutFeedback");
	const TouchableHighlight = mockComponent("TouchableHighlight");
	const Pressable = mockComponent("Pressable");
	const KeyboardAvoidingView = mockComponent("KeyboardAvoidingView");
	const ActivityIndicator = mockComponent("ActivityIndicator");
	const Modal = mockComponent("Modal");
	
	const FlatList = (props: any) => {
		const items = props.data || [];
		return React.createElement(
			"FlatList",
			props,
			props.ListHeaderComponent && (typeof props.ListHeaderComponent === 'function' ? props.ListHeaderComponent() : props.ListHeaderComponent),
			items.map((item: any, index: number) => {
				const key = props.keyExtractor ? props.keyExtractor(item, index) : index;
				return React.createElement(React.Fragment, { key }, props.renderItem({ item, index }));
			}),
			props.ListFooterComponent && (typeof props.ListFooterComponent === 'function' ? props.ListFooterComponent() : props.ListFooterComponent),
			items.length === 0 && props.ListEmptyComponent && (typeof props.ListEmptyComponent === 'function' ? props.ListEmptyComponent() : props.ListEmptyComponent)
		);
	};

	const SectionList = mockComponent("SectionList");
	const Button = mockComponent("Button");
	const Switch = mockComponent("Switch");
	const RefreshControl = mockComponent("RefreshControl");

	const StyleSheet = {
		create: (s: any) => s,
		flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : s,
	};

	const Platform = {
		OS: "ios",
		select: (o: any) => o.ios || o.default,
	};

	const Alert = {
		alert: (...args: any[]) => {
			if ((globalThis as any).__mocks && (globalThis as any).__mocks.alert) {
				(globalThis as any).__mocks.alert(...args);
			}
		}
	};

	const Dimensions = {
		get: () => ({ width: 375, height: 812 }),
	};

	const PixelRatio = {
		get: () => 1,
		roundToNearestPixel: (n: number) => n,
	};

	const NativeModules = {};
	const NativeEventEmitter = class {
		addListener() { return { remove: () => {} }; }
		removeAllListeners() {}
		emit() {}
	};

	const TurboModuleRegistry = {
		get: () => null,
		getEnforcing: () => null,
	};

	const Linking = {
		openURL: mock(),
		canOpenURL: mock(),
		getInitialURL: mock(),
		addEventListener: mock(() => ({ remove: mock() })),
	};

	const Share = {
		share: mock(),
	};

	return {
		View,
		Text,
		TextInput,
		ScrollView,
		Image,
		TouchableOpacity,
		TouchableWithoutFeedback,
		TouchableHighlight,
		Pressable,
		KeyboardAvoidingView,
		ActivityIndicator,
		Modal,
		FlatList,
		SectionList,
		Button,
		Switch,
		RefreshControl,
		StyleSheet,
		Platform,
		Alert,
		Dimensions,
		PixelRatio,
		NativeModules,
		NativeEventEmitter,
		TurboModuleRegistry,
		Linking,
		Share,
		processColor: (c: any) => c,
		__esModule: true,
	};
});

// Mock Gesture Handler
mock.module("react-native-gesture-handler", () => {
	const React = require("react");
	return {
		PanGestureHandler: ({ children }: any) => children,
		TapGestureHandler: ({ children }: any) => children,
		GestureHandlerRootView: ({ children }: any) => children,
		State: {},
		Directions: {},
	};
});

// Mock Reanimated
mock.module("react-native-reanimated", () => {
	const React = require("react");
	return {
		default: {
			View: ({ children, style }: any) => React.createElement("View", { style }, children),
			Text: ({ children, style }: any) => React.createElement("Text", { style }, children),
			Image: ({ children, style }: any) => React.createElement("Image", { style }, children),
			ScrollView: ({ children, style }: any) => React.createElement("ScrollView", { style }, children),
		},
		useSharedValue: (v: any) => ({ value: v }),
		useAnimatedStyle: (cb: any) => ({}),
		useAnimatedGestureHandler: (callbacks: any) => ({}),
		withSpring: (v: any) => v,
		withTiming: (v: any) => v,
		runOnJS: (fn: any) => fn,
		__esModule: true,
	};
});

// Mock AsyncStorage
mock.module("@react-native-async-storage/async-storage", () => ({
	default: asyncStorageMock,
	__esModule: true,
}));

// Global Dropdown Menu mock
mock.module("../app/components/GlobalDropdownMenu", () => ({
	useMenu: () => useMenuMock,
	MenuProvider: ({ children }: any) => children,
}));

// Mock useApi - keeping it out of mock.module by default to let useApi.test.ts work
// But providing it for other tests via local mock.module calls

// Other modules
mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: () => localSearchParamsMock.params,
}));

mock.module("expo-font", () => ({
	useFonts: () => [true, null],
	loadAsync: mock(),
	isLoaded: mock(() => true),
}));

mock.module("expo-modules-core", () => {
	return {
		EventEmitter: class {
			addListener = mock(() => ({ remove: mock() }));
			removeAllListeners = mock();
			emit = mock();
		},
		Platform: { OS: "ios", select: (o: any) => o.ios || o.default },
		requireNativeViewManager: mock(),
		requireNativeModule: mock(),
		NativeModulesProxy: {},
		UnavailabilityError: class extends Error {
			constructor(module: string, method: string) {
				super(`The method or property ${module}.${method} is not available.`);
			}
		},
	};
});

mock.module("expo-clipboard", () => ({
	...clipboardMocks,
}));

mock.module("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
	SafeAreaProvider: ({ children }: any) => children,
	SafeAreaView: ({ children }: any) => children,
}));

mock.module("@react-navigation/native", () => ({
	NavigationContainer: ({ children }: any) => children,
	useFocusEffect: (callback: () => void) => {
		React.useEffect(() => {
			callback();
		}, []);
	},
	useNavigation: () => navigationMocks,
}));

// Mock Screen component
mock.module("../app/components/Screen", () => {
	const React = require("react");
	const { View, Text } = require("react-native");
	return {
		default: ({ children, loading, error }: any) => (
			React.createElement(View, {}, 
				loading && React.createElement(Text, {}, "Loading..."),
				error && React.createElement(Text, {}, error),
				!loading && children
			)
		),
		__esModule: true,
	};
});
