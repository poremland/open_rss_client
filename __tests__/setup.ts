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
import React from "react";

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

export const useApiMock = mock(() => ({
	data: null,
	loading: false,
	error: "",
	execute: mock(),
	setData: mock(),
}));

export const useMenuMock = {
	setMenuItems: mock(),
	onToggleDropdown: mock(),
};

const resetMocks = (obj: any) => {
	Object.values(obj).forEach(m => {
		if (m && typeof m === 'object' && 'mock' in m && typeof (m as any).mockClear === 'function') {
			(m as any).mockClear();
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
	useApiMock.mockClear();
	useApiMock.mockReturnValue({
		data: null,
		loading: false,
		error: "",
		execute: mock(),
		setData: mock(),
	});
	alertMock.mockClear();
	fetchMock.mockClear();
};

// Global Environment Setup
(globalThis as any).__DEV__ = true;
process.env.EXPO_OS = "ios";
(globalThis as any).document = { title: "" } as any;
(globalThis as any).window = {
	history: { state: { id: 0 } },
	addEventListener: mock(),
	removeEventListener: mock(),
	setTimeout: globalThis.setTimeout,
	clearTimeout: globalThis.clearTimeout,
} as any;

(globalThis as any).fetch = fetchMock;
(globalThis as any).AsyncStorage = asyncStorageMock;

// Mock Expo global BEFORE modules load
(globalThis as any).expo = {
	modules: {
		ExpoFontLoader: { 
			loadAsync: mock(),
			getLoadedFonts: mock(() => []),
		},
		ExpoAsset: { downloadAsync: mock() },
		ExponentConstants: { manifest: {} },
	},
	EventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	}
};

// Initialize global state for tests
(globalThis as any).__mocks = {
	storage: storageMap,
	router: routerMocks,
	navigation: navigationMocks,
	alert: alertMock,
	fetch: fetchMock,
	clipboard: clipboardMocks,
	asyncStorage: asyncStorageMock,
	api: apiMocks,
	auth: authMocks,
	useApi: useApiMock,
	useMenu: useMenuMock,
	resetAll
};

// USE A PLUGIN TO PREVENT BUN FROM PARSING node_modules/react-native FILES AND ASSETS
plugin({
	name: "module-and-asset-interceptor",
	setup(build) {
		// Assets - Redirect all common extensions to a simple mock
		build.onLoad({ filter: /\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$/ }, () => ({
			contents: "export default 1;",
			loader: "js",
		}));

		// React Native and related
		const rnFilter = /^react-native($|\/)/;
		build.onResolve({ filter: rnFilter }, (args) => {
			return {
				path: args.path,
				namespace: "mock-rn",
			};
		});

		build.onLoad({ filter: /.*/, namespace: "mock-rn" }, (args) => {
			if (args.path === "react-native") {
				return {
					contents: `
						const React = require("react");
						const { mock } = require("bun:test");
						const mockComponent = (name) => (props) => React.createElement(name, props, props.children);
						const RNMock = {
							View: mockComponent("View"),
							Text: mockComponent("Text"),
							TouchableOpacity: mockComponent("TouchableOpacity"),
							TouchableWithoutFeedback: mockComponent("TouchableWithoutFeedback"),
							TouchableHighlight: mockComponent("TouchableHighlight"),
							Pressable: mockComponent("Pressable"),
							Button: (props) => React.createElement(mockComponent("View"), props),
							FlatList: (props) => React.createElement(mockComponent("View"), props),
							ScrollView: mockComponent("ScrollView"),
							Image: mockComponent("Image"),
							TextInput: mockComponent("TextInput"),
							ActivityIndicator: mockComponent("ActivityIndicator"),
							RefreshControl: mockComponent("RefreshControl"),
							KeyboardAvoidingView: mockComponent("KeyboardAvoidingView"),
							Modal: mockComponent("Modal"),
							StyleSheet: {
								create: (s) => s,
								flatten: (s) => Array.isArray(s) ? Object.assign({}, ...s) : s,
							},
							Platform: { OS: "ios", select: (o) => o.ios || o.default },
							Alert: { alert: mock() },
							Dimensions: { get: () => ({ width: 375, height: 812 }) },
							PixelRatio: { get: () => 1, roundToNearestPixel: (n) => n },
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
							processColor: (c) => c,
							NativeModules: {},
						};
						module.exports = RNMock;
					`,
					loader: "js",
				};
			}
			return {
				contents: "module.exports = new Proxy({}, { get: () => () => null });",
				loader: "js",
			};
		});

		// Also intercept @react-native-async-storage/async-storage
		build.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({
			path: "@react-native-async-storage/async-storage",
			namespace: "mock-storage",
		}));

		build.onLoad({ filter: /.*/, namespace: "mock-storage" }, () => ({
			contents: `
				const setup = require("${import.meta.url}");
				module.exports = {
					__esModule: true,
					default: setup.asyncStorageMock,
					...setup.asyncStorageMock,
				};
			`,
			loader: "js",
		}));
	},
});

// Mock modules that don't need the plugin's aggressive interception
mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: mock(() => ({})),
}));

mock.module("expo-font", () => ({
	useFonts: () => [true, null],
	loadAsync: mock(),
}));

mock.module("expo-constants", () => ({
	default: { expoConfig: { extra: {} } },
	manifest: { extra: {} },
}));

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
