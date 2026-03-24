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

import { mock, expect } from "bun:test";
import * as path from "path";

// Helper to resolve absolute paths for mock.module
export const resolveModule = (p: string) => path.resolve(__dirname, p);

// --- GLOBAL MOCK STATE ---
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
	getStringAsync: mock(),
	isPasteButtonAvailable: true,
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
};

export const useMenuMock = {
	setMenuItems: mock(),
	onToggleDropdown: mock(),
};

export const localSearchParamsMock = {
	params: {} as any,
};

export const useApiConfig = {
	data: null as any,
	loading: false,
	error: null as string | null,
	execute: mock().mockImplementation(() => Promise.resolve(null)),
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

const resetMockFn = (m: any) => {
	if (m && typeof m === 'function' && 'mock' in m) {
		m.mockClear();
		m.mockImplementation(() => Promise.resolve(null));
	}
};

const resetMocksInObj = (obj: any) => {
	Object.values(obj).forEach(m => resetMockFn(m));
};

export const resetAll = () => {
	storageMap.clear();
	resetMocksInObj(routerMocks);
	resetMocksInObj(navigationMocks);
	resetMocksInObj(asyncStorageMock);
	resetMocksInObj(clipboardMocks);
	resetMocksInObj(apiMocks);
	resetMocksInObj(authMocks);
	resetMocksInObj(useMenuMock);

	useApiConfig.data = null;
	useApiConfig.loading = false;
	useApiConfig.error = null;
	useApiConfig.execute.mockClear().mockImplementation(() => Promise.resolve(null));

	useApiMock.mockClear();
	useApiMock.mockImplementation(() => {
		return {
			data: useApiConfig.data,
			loading: useApiConfig.loading,
			error: useApiConfig.error,
			execute: useApiConfig.execute,
			setData: mock(),
		};
	});

	localSearchParamsMock.params = {};

	alertMock.mockClear().mockImplementation(() => {});
	fetchMock.mockClear().mockImplementation(() => Promise.resolve({ ok: true, json: async () => ({}) }));
};

// --- Bun Module Mocks ---

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

	return {
		View: mockComponent("View"),
		Text: mockComponent("Text"),
		TextInput: mockComponent("TextInput"),
		ScrollView: mockComponent("ScrollView"),
		Image: mockComponent("Image"),
		TouchableOpacity: mockComponent("TouchableOpacity"),
		TouchableWithoutFeedback: mockComponent("TouchableWithoutFeedback"),
		TouchableHighlight: mockComponent("TouchableHighlight"),
		Pressable: mockComponent("Pressable"),
		KeyboardAvoidingView: mockComponent("KeyboardAvoidingView"),
		ActivityIndicator: mockComponent("ActivityIndicator"),
		Modal: mockComponent("Modal"),
		FlatList: (props: any) => {
			const items = props.data || [];
			const React = require("react");
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
		},
		SectionList: mockComponent("SectionList"),
		Button: mockComponent("Button"),
		Switch: mockComponent("Switch"),
		RefreshControl: mockComponent("RefreshControl"),
		StyleSheet: {
			create: (s: any) => s,
			flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : s,
		},
		Platform: { OS: "ios", select: (o: any) => o.ios || o.default },
		Alert: {
			alert: (...args: any[]) => alertMock(...args)
		},
		Dimensions: { get: () => ({ width: 375, height: 812 }) },
		PixelRatio: { get: () => 1, roundToNearestPixel: (n: number) => n },
		NativeModules: {},
		NativeEventEmitter: class {
			addListener() { return { remove: () => {} }; }
			removeAllListeners() {}
			emit() {}
		},
		TurboModuleRegistry: { get: () => null, getEnforcing: () => null },
		Linking: {
			openURL: mock(),
			canOpenURL: mock(),
			getInitialURL: mock(),
			addEventListener: mock(() => ({ remove: mock() })),
		},
		Share: { share: mock() },
		processColor: (c: any) => c,
		__esModule: true,
	};
});

mock.module(resolveModule("../helpers/api_helper"), () => ({
	api: apiMocks,
	post: apiMocks.post,
	postWithAuth: apiMocks.postWithAuth,
	get: apiMocks.get,
	getWithAuth: apiMocks.getWithAuth,
	putWithAuth: apiMocks.putWithAuth,
	refreshToken: apiMocks.refreshToken,
	__esModule: true,
}));

mock.module(resolveModule("../helpers/auth_helper"), () => ({
	auth: authMocks,
	storeAuthToken: authMocks.storeAuthToken,
	getAuthToken: authMocks.getAuthToken,
	storeUser: authMocks.storeUser,
	getUser: authMocks.getUser,
	clearAuthData: authMocks.clearAuthData,
	checkLoggedIn: authMocks.checkLoggedIn,
	refreshTokenOnLoad: authMocks.refreshTokenOnLoad,
	handleSessionExpired: authMocks.handleSessionExpired,
	__esModule: true,
}));

mock.module("react-native-gesture-handler", () => ({
	PanGestureHandler: ({ children }: any) => children,
	TapGestureHandler: ({ children }: any) => children,
	GestureHandlerRootView: ({ children }: any) => children,
	State: {},
	Directions: {},
}));

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

mock.module("@react-native-async-storage/async-storage", () => ({
	default: asyncStorageMock,
	__esModule: true,
}));

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

mock.module("expo-modules-core", () => ({
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
}));

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
		const React = require("react");
		React.useEffect(() => {
			callback();
		}, []);
	},
	useNavigation: () => navigationMocks,
}));

mock.module(resolveModule("../app/components/GlobalDropdownMenu"), () => ({
	useMenu: () => useMenuMock,
	MenuProvider: ({ children }: any) => children,
	__esModule: true,
}));

mock.module(resolveModule("../app/components/Screen"), () => {
	const React = require("react");
	return {
		default: ({ children, loading, error }: any) => {
			const { View, Text } = require("react-native");
			return React.createElement(View, {}, 
				loading && React.createElement(Text, {}, "Loading..."),
				error && React.createElement(Text, {}, error),
				!loading && children
			);
		},
		__esModule: true,
	};
});

// --- Environment Setup ---
import { plugin } from "bun";
import * as React from "react";
(globalThis as any).__DEV__ = true;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
process.env.EXPO_OS = "ios";
(globalThis as any).fetch = fetchMock;
(globalThis as any).AsyncStorage = asyncStorageMock;

(globalThis as any).expo = {
	EventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	}
};

require("@testing-library/jest-native/extend-expect");

export const mocks = {
	storageMap,
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

plugin({
	name: "asset-interceptor",
	setup(build) {
		build.onLoad({ filter: /\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$/ }, () => ({
			contents: "export default 'mock-asset';",
			loader: "js",
		}));
	},
});
