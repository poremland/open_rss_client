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

const { mock } = require("bun:test");

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

const mockComponent = (name: string) => (props: any) => {
	const React = require("react");
	return React.createElement(name, props, props.children);
};

export const RNMock = {
	View: mockComponent("View"),
	Text: mockComponent("Text"),
	TouchableOpacity: mockComponent("TouchableOpacity"),
	TouchableWithoutFeedback: mockComponent("TouchableWithoutFeedback"),
	TouchableHighlight: mockComponent("TouchableHighlight"),
	Pressable: mockComponent("Pressable"),
	Button: mock(({ title, onPress, testID }: any) => {
		const React = require("react");
		return React.createElement(RNMock.Pressable, { onPress, testID, accessibilityRole: "button" }, 
			React.createElement(RNMock.Text, {}, title)
		);
	}),
	FlatList: mock(({ data, renderItem }: any) => {
		const React = require("react");
		return React.createElement(RNMock.View, {}, data?.map((item: any, index: number) => 
			React.createElement(RNMock.View, { key: index }, renderItem({ item, index }))
		));
	}),
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
	Alert: { 
		alert: alertMock
	},
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

// Use mock.module for EVERYTHING - CALL THESE AS EARLY AS POSSIBLE
mock.module("react-native", () => ({
	...RNMock,
	__esModule: true,
	default: RNMock,
}));

mock.module("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
	SafeAreaProvider: ({ children }: any) => {
		const React = require("react");
		return React.createElement(RNMock.View, {}, children);
	},
	SafeAreaView: ({ children }: any) => {
		const React = require("react");
		return React.createElement(RNMock.View, {}, children);
	},
}));

mock.module("@react-native-async-storage/async-storage", () => ({
	__esModule: true,
	...asyncStorageMock,
	default: asyncStorageMock,
}));

mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: mock(() => ({})),
}));

mock.module("@react-navigation/native", () => {
	const React = require("react");
	return {
		NavigationContainer: ({ children }: any) => React.createElement(RNMock.View, {}, children),
		useFocusEffect: (callback: () => void) => {
			const React = require("react");
			React.useEffect(() => {
				callback();
			}, []);
		},
		useNavigation: () => navigationMocks,
	};
});

mock.module("expo-font", () => ({
	useFonts: () => [true, null],
	loadAsync: mock(),
}));

mock.module("expo-constants", () => ({
	default: { expoConfig: { extra: {} } },
	manifest: { extra: {} },
}));

mock.module("expo-linking", () => ({
	createURL: (p: string) => p,
	addEventListener: mock(() => ({ remove: mock() })),
}));

mock.module("expo-clipboard", () => clipboardMocks);

// App-specific modules
mock.module("/mnt/e/source/expo/open_rss_client/app/components/useApi", () => ({
	default: useApiMock,
}));
mock.module("/mnt/e/source/expo/open_rss_client/app/components/GlobalDropdownMenu", () => ({
	useMenu: () => useMenuMock,
}));
mock.module("/mnt/e/source/expo/open_rss_client/helpers/api_helper", () => apiMocks);
mock.module("/mnt/e/source/expo/open_rss_client/helpers/auth_helper", () => authMocks);

// Expo Modules Core
const ExpoModulesCoreMock = {
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
};
mock.module("expo-modules-core", () => ExpoModulesCoreMock);

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

(globalThis as any).fetch = (...args: any[]) => fetchMock(...args);
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
