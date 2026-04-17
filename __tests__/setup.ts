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

// Silence react-test-renderer deprecation warning
const originalWarn = console.warn;
const originalError = console.error;
const originalLog = console.log;
(globalThis as any).originalLog = originalLog;

const filterWarning = (args: any[], originalFn: (...args: any[]) => void) => {
	if (typeof args[0] === "string" && (args[0].includes("react-test-renderer is deprecated") || args[0].includes("current testing environment is not configured to support act"))) {
		return;
	}
	originalFn(...args);
};

Object.defineProperty(console, "warn", {
	value: (...args: any[]) => filterWarning(args, originalWarn),
	configurable: true,
	writable: true,
});

Object.defineProperty(console, "error", {
	value: (...args: any[]) => filterWarning(args, originalError),
	configurable: true,
	writable: true,
});

Object.defineProperty(console, "log", {
	value: (...args: any[]) => filterWarning(args, originalLog),
	configurable: true,
	writable: true,
});
process.env.RNTL_SKIP_DEPS_CHECK = "true";

// Helper to resolve absolute paths for mock.module
export const resolveModule = (p: string) => path.resolve(__dirname, p);

// --- GLOBAL MOCK STATE ---
if (!(process as any).storageMap) {
	(process as any).storageMap = new Map();
}
export const storageMap = (process as any).storageMap;

export const asyncStorageMock = {
	setItem: mock(async (k: string, v: any) => { 
		storageMap.set(k, String(v)); 
	}),
	getItem: mock(async (k: string) => { 
		const val = storageMap.get(k);
		return val === undefined ? null : val;
	}),
	removeItem: mock(async (k: string) => { 
		storageMap.delete(k); 
	}),
	clear: mock(async () => { 
		storageMap.clear(); 
	}),
	getAllKeys: mock(async () => Array.from(storageMap.keys())),
	multiGet: mock(async (keys: string[]) => keys.map(k => [k, storageMap.get(k) || null])),
	multiSet: mock(async (pairs: [string, string][]) => pairs.forEach(([k, v]) => storageMap.set(k, v))),
	multiRemove: mock(async (keys: string[]) => keys.forEach(k => storageMap.delete(k))),
};

(globalThis as any).AsyncStorage = asyncStorageMock;
(global as any).AsyncStorage = asyncStorageMock;

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

export const alertMock = mock(), fetchMock = mock();
export const clipboardMocks = {
	setStringAsync: mock(),
	getStringAsync: mock(),
	isPasteButtonAvailable: true,
};

export const fileSystemMock = {
	documentDirectory: "file:///mock-documents/",
	cacheDirectory: "file:///mock-cache/",
	writeAsStringAsync: mock(async () => {}),
	readAsStringAsync: mock(async () => ""),
	deleteAsync: mock(async () => {}),
	makeDirectoryAsync: mock(async () => {}),
	copyAsync: mock(async () => {}),
	StorageAccessFramework: {
		requestDirectoryPermissionsAsync: mock(async () => ({ granted: true, directoryUri: "file:///mock-saf/" })),
		createFileAsync: mock(async () => "file:///mock-saf/file.opml"),
	},
	File: (() => {
		const F = class {
			uri: string;
			exists = true;
			constructor(path: string, name?: string) {
				this.uri = name ? `${path}/${name}` : path;
			}
			write() { return Promise.resolve(); }
			text() { return Promise.resolve(""); }
			delete() { return Promise.resolve(); }
		};
		(F.prototype as any).write = mock(async () => {});
		(F.prototype as any).text = mock(async () => "");
		(F.prototype as any).delete = mock(async () => {});
		return F;
	})(),
	Paths: {
		cache: "file:///mock-cache",
		document: "file:///mock-documents",
	},
	Directory: (() => {
		const D = class {
			uri: string;
			exists = true;
			constructor(path: string, name?: string) {
				this.uri = name ? `${path}/${name}` : path;
			}
			create() { return Promise.resolve(); }
			delete() { return Promise.resolve(); }
			createFile(name: string) { return new (fileSystemMock.File as any)("file:///mock-uri", name); }
			static pickDirectoryAsync() { return Promise.resolve(null); }
		};
		(D.prototype as any).create = mock(async () => {});
		(D.prototype as any).delete = mock(async () => {});
		(D.prototype as any).createFile = mock((name: string) => new (fileSystemMock.File as any)("file:///mock-uri", name));
		(D as any).pickDirectoryAsync = mock(async () => null);
		return D;
	})(),
};

export const sharingMock = {
	shareAsync: mock(async () => {}),
};

export const documentPickerMock = {
	getDocumentAsync: mock(async () => ({ type: "cancel" })),
};

export const hapticsMock = {
	notificationAsync: mock(async () => {}),
	impactAsync: mock(async () => {}),
	selectionAsync: mock(async () => {}),
	NotificationFeedbackType: {
		Success: "success",
		Warning: "warning",
		Error: "error",
	},
	ImpactFeedbackStyle: {
		Light: "light",
		Medium: "medium",
		Heavy: "heavy",
	},
};

export const opmlMocks = {
	validateOpmlFile: mock(async () => true),
};

export const apiMocks = {
	get: mock(),
	post: mock(),
	getWithAuth: mock((path: string) => {
		if (path === "/feeds/tree.json" || path === "/feeds/all.json") return Promise.resolve([]);
		return Promise.resolve({});
	}),
	getBlobWithAuth: mock(),
	exportOpml: mock(),
	importOpml: mock(),
	readTextFile: mock(),
	postFormDataWithAuth: mock(),
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

export const localSearchParamsMock = (globalThis as any).__localSearchParamsMock || {
	params: {} as any,
	mockReturnValue: (p: any) => { localSearchParamsMock.params = p; }
};
(globalThis as any).__localSearchParamsMock = localSearchParamsMock;

export const useApiConfig = (globalThis as any).__useApiConfig || {
	data: null as any,
	loading: false,
	error: null as string | null,
	execute: mock().mockImplementation(() => Promise.resolve(null)),
	setData: mock(),
};
(globalThis as any).__useApiConfig = useApiConfig;

const useApi = <T,>(
	method: string,
	path: string,
	options: any = {},
	contentType: string = "application/x-www-form-urlencoded",
): any => {
	return {
		data: useApiConfig.data,
		loading: useApiConfig.loading,
		error: useApiConfig.error,
		execute: useApiConfig.execute,
		setData: useApiConfig.setData,
	};
};

export const useApiMock = mock(useApi);

// --- Shared Connection State for Mocks ---
(globalThis as any).__sharedConnectionState = (globalThis as any).__sharedConnectionState || {
	isConnected: true,
	listeners: [] as Array<(s: { isConnected: boolean }) => void>,
};
const sharedConnectionState = (globalThis as any).__sharedConnectionState;

export const networkMocks = {
	getNetworkStateAsync: mock(async () => ({ 
		isConnected: sharedConnectionState.isConnected, 
		isInternetReachable: sharedConnectionState.isConnected 
	})),
	addNetworkStateListener: mock((cb: any) => {
		const listener = (s: any) => cb({ isConnected: s.isConnected, type: 'wifi' });
		sharedConnectionState.listeners.push(listener);
		return { 
			remove: mock(() => {
				const index = sharedConnectionState.listeners.indexOf(listener);
				if (index > -1) {
					sharedConnectionState.listeners.splice(index, 1);
				}
			}) 
		};
	}),
};

const connectionMock = {
	get isConnected() { return sharedConnectionState.isConnected; },
	set isConnected(v: boolean) {
		sharedConnectionState.isConnected = v;
		sharedConnectionState.listeners.forEach(l => l({ isConnected: v }));
	},
	get listeners() { return sharedConnectionState.listeners; },
	updateConnectionStatus: mock(async () => {}),
};
(globalThis as any).__useConnectionStatusMock = connectionMock;

export const useConnectionStatusMock = connectionMock;

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
	fileSystem: fileSystemMock,
	fileSystemMock,
	sharing: sharingMock,
	sharingMock,
	documentPicker: documentPickerMock,
	documentPickerMock,
	haptics: hapticsMock,
	hapticsMock,
	opml: opmlMocks,
	opmlMocks,
	networkMocks,
	useConnectionStatusMock,
	localSearchParams: localSearchParamsMock,
	resetAll: () => {} // Placeholder
};

(globalThis as any).__mocks = mocks;

// --- Bun Module Mocks ---

mock.module("react-native", () => {
	const React = require("react");
	const mockComponent = (name: string) => {
		const Comp = (props: any) => {
			const children = [];
			if (props.children) {
				if (Array.isArray(props.children)) {
					children.push(...props.children);
				} else {
					children.push(props.children);
				}
			}
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
			const items = Array.isArray(props.data) ? props.data : [];
			const React = require("react");
			const { View } = require("react-native");
			return React.createElement(
				View,
				{ ...props, testID: props.testID, style: props.style },
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
		Platform: {
			OS: "ios",
			Version: 1,
			isTesting: true,
			select: (obj: any) => obj.ios || obj.default,
		},
		Alert: {
			alert: alertMock,
		},
		Linking: {
			openURL: mock(async () => {}),
			canOpenURL: mock(async () => true),
		},
		Share: {
			share: mock(async () => {}),
		},
		Dimensions: {
			get: () => ({ width: 375, height: 812 }),
			addEventListener: mock(() => ({ remove: mock() })),
		},
		AppState: {
			addEventListener: mock(() => ({ remove: mock() })),
			currentState: "active",
		},
		NativeModules: {},
		processColor: (color: any) => color,
		PixelRatio: {
			get: () => 1,
			getFontScale: () => 1,
			getPixelSizeForLayoutSize: (layoutSize: number) => layoutSize,
			roundToNearestPixel: (layoutSize: number) => layoutSize,
		},
		AsyncStorage: asyncStorageMock,
	};
});

mock.module("@expo/vector-icons", () => {
	const React = require("react");
	const { Text } = require("react-native");
	const mockIcon = (name: string) => {
		const Comp = (props: any) => React.createElement(Text, props, props.name || name);
		Comp.displayName = name;
		Comp.isLoaded = mock(() => true);
		Comp.loadFont = mock(async () => {});
		Comp.hasIcon = mock(() => true);
		return Comp;
	};
	return {
		Ionicons: mockIcon("Ionicons"),
		FontAwesome: mockIcon("FontAwesome"),
		MaterialIcons: mockIcon("MaterialIcons"),
		MaterialCommunityIcons: mockIcon("MaterialCommunityIcons"),
		Entypo: mockIcon("Entypo"),
		AntDesign: mockIcon("AntDesign"),
	};
});

mock.module("expo-font", () => ({
	useFonts: () => [true, null],
	loadAsync: mock(async () => {}),
	isLoaded: mock(() => true),
}));

mock.module(resolveModule("../helpers/api_helper"), () => ({
	api: apiMocks,
	post: apiMocks.post,
	postWithAuth: apiMocks.postWithAuth,
	get: apiMocks.get,
	getWithAuth: apiMocks.getWithAuth,
	getBlobWithAuth: apiMocks.getBlobWithAuth,
	exportOpml: apiMocks.exportOpml,
	importOpml: apiMocks.importOpml,
	readTextFile: apiMocks.readTextFile,
	postFormDataWithAuth: apiMocks.postFormDataWithAuth,
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

mock.module(resolveModule("../helpers/opml_helper"), () => ({
	validateOpmlFile: opmlMocks.validateOpmlFile,
	__esModule: true,
}));

mock.module("react-native-gesture-handler", () => {
	const React = require("react");
	const mockComponent = (name: string) => (props: any) => React.createElement(name, props, props.children);
	return {
		GestureHandlerRootView: mockComponent("GestureHandlerRootView"),
		Swipeable: mockComponent("Swipeable"),
		RectButton: mockComponent("RectButton"),
		TapGestureHandler: (props: any) => {
			const React = require("react");
			return React.createElement("TapGestureHandler", {
				...props,
				onPress: () => {
					if (props.onHandlerStateChange) {
						props.onHandlerStateChange({ nativeEvent: { state: 6 } }); // State.END
					}
				}
			}, props.children);
		},
		PanGestureHandler: (props: any) => {
			const React = require("react");
			return React.createElement("PanGestureHandler", {
				...props,
				// Allow tests to trigger swipe by calling onHandlerStateChange with State.END
				simulateSwipe: (translationX: number) => {
					if (props.onGestureEvent) {
						props.onGestureEvent({ translationX });
					}
					if (props.onHandlerStateChange) {
						props.onHandlerStateChange({ nativeEvent: { state: 6, translationX } });
					}
				}
			}, props.children);
		},
		State: {
			BEGAN: 1,
			FAILED: 2,
			POSSIBLE: 3,
			CANCELLED: 4,
			ACTIVE: 5,
			END: 6,
		},
	};
});

mock.module("react-native-reanimated", () => {
	const React = require("react");
	return {
		default: {
			View: (props: any) => React.createElement("View", props, props.children),
		},
		useSharedValue: (v: any) => ({ value: v }),
		useAnimatedStyle: (cb: any) => cb(),
		useAnimatedGestureHandler: (handlers: any) => {
			const ctx = {};
			return (event: any) => {
				if (handlers.onStart) handlers.onStart(event, ctx);
				if (handlers.onActive) handlers.onActive(event, ctx);
				if (handlers.onEnd) handlers.onEnd(event, ctx);
			};
		},
		withSpring: (v: any) => v,
		withTiming: (v: any) => v,
		runOnJS: (fn: any) => fn,
		interpolate: (v: any, input: any[], output: any[]) => v,
		Extrapolate: { CLAMP: "clamp" },
	};
});

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
		}, [callback]);
	},
	useNavigation: () => navigationMocks,
	useIsFocused: () => true,
}));

mock.module(resolveModule("../components/GlobalDropdownMenu"), () => ({
	default: ({ children }: any) => children,
	useMenu: () => useMenuMock,
	__esModule: true,
}));

mock.module(resolveModule("../components/Screen"), () => {
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

mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: () => localSearchParamsMock.params,
}));

mock.module("@react-native-async-storage/async-storage", () => ({
	default: asyncStorageMock,
	__esModule: true,
}));

mock.module("expo-network", () => ({
	...networkMocks,
}));

mock.module("expo-modules-core", () => ({
	requireNativeModule: mock(() => ({})),
	UnavailabilityError: class extends Error {
		constructor(moduleName: string, methodName: string) {
			super(`The method or property ${moduleName}.${methodName} is not available on ${process.env.EXPO_OS}, are you sure you've linked all the native dependencies properly?`);
			this.name = 'UnavailabilityError';
		}
	},
}));

mock.module("expo-clipboard", () => ({
	...clipboardMocks,
}));

mock.module("expo-file-system", () => ({
	...fileSystemMock,
}));

mock.module("expo-sharing", () => ({
	...sharingMock,
}));

mock.module("expo-document-picker", () => ({
	...documentPickerMock,
}));

mock.module("expo-haptics", () => ({
	...hapticsMock,
}));

mock.module("expo-task-manager", () => ({
	defineTask: mock(),
	isTaskDefined: mock(() => false),
	unregisterTaskAsync: mock(async () => {}),
	isTaskRegisteredAsync: mock(async () => true),
}));

mock.module("expo-background-fetch", () => ({
	registerTaskAsync: mock(async () => {}),
	unregisterTaskAsync: mock(async () => {}),
	BackgroundFetchResult: {
		NoData: 1,
		NewData: 2,
		Failed: 3,
	},
}));

// --- Environment Setup ---
import { plugin } from "bun";
import * as React from "react";
(globalThis as any).__DEV__ = true;
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
process.env.EXPO_OS = "ios";
(globalThis as any).fetch = fetchMock;

(globalThis as any).expo = {
	EventEmitter: class {
		addListener = mock(() => ({ remove: mock() }));
		removeAllListeners = mock();
		emit = mock();
	}
};

const resetMockFn = (m: any) => {
	if (m && typeof m === 'function' && 'mock' in m) {
		m.mockClear();
		m.mockImplementation(() => Promise.resolve(null));
	}
};

const resetMocksInObj = (obj: any) => {
	Object.values(obj).forEach(m => resetMockFn(m));
};

import * as cacheHelper from "../helpers/cache_helper";

export const resetAll = () => {
	storageMap.clear();
	cacheHelper.clearLocalCache();
	const g = (globalThis as any);
	if (g.localCacheMap) {
		g.localCacheMap.clear();
	}
	if ((process as any).localSyncQueue) {
		(process as any).localSyncQueue.length = 0;
	}
	sharedConnectionState.listeners.length = 0;
	sharedConnectionState.isConnected = true;
	resetMocksInObj(routerMocks);
	resetMocksInObj(navigationMocks);
	
	// Just clear calls, do not reset implementation for asyncStorageMock
	Object.values(asyncStorageMock).forEach(m => {
		if (m && typeof m === 'function' && 'mock' in m) m.mockClear();
	});

	resetMocksInObj(clipboardMocks);
	resetMocksInObj(apiMocks);
	apiMocks.getWithAuth.mockImplementation(async (path: string) => {
		if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
		return {};
	});
	resetMocksInObj(authMocks);
	resetMocksInObj(useMenuMock);
	resetMocksInObj(fileSystemMock);
	resetMocksInObj(sharingMock);
	resetMocksInObj(documentPickerMock);
	resetMocksInObj(hapticsMock);
	resetMocksInObj(opmlMocks);
	resetMocksInObj(networkMocks);
	networkMocks.getNetworkStateAsync.mockImplementation(async () => ({ 
		isConnected: sharedConnectionState.isConnected, 
		isInternetReachable: sharedConnectionState.isConnected 
	}));
	networkMocks.addNetworkStateListener.mockImplementation((cb: any) => {
		const listener = (s: any) => cb({ isConnected: s.isConnected, type: 'wifi' });
		sharedConnectionState.listeners.push(listener);
		return { 
			remove: mock(() => {
				const index = sharedConnectionState.listeners.indexOf(listener);
				if (index > -1) {
					sharedConnectionState.listeners.splice(index, 1);
				}
			}) 
		};
	});
	
	useConnectionStatusMock.updateConnectionStatus.mockClear();
	if (fileSystemMock.StorageAccessFramework) {
		resetMocksInObj(fileSystemMock.StorageAccessFramework);
	}

	useApiConfig.data = null;
	useApiConfig.loading = false;
	useApiConfig.error = null;
	useApiConfig.execute = mock(() => Promise.resolve(null));
	useApiMock.mockClear().mockImplementation(useApi);

	localSearchParamsMock.params = {};

	alertMock.mockClear().mockImplementation(() => {});
	fetchMock.mockClear().mockImplementation(() => Promise.resolve({ 
		ok: true, 
		json: () => Promise.resolve({}),
		text: () => Promise.resolve(""),
		blob: () => Promise.resolve(new Blob())
	}));
};

mocks.resetAll = resetAll;

plugin({
	name: "asset-interceptor",
	setup(build) {
		build.onLoad({ filter: /\.(png|jpg|jpeg|gif|webp|svg|ttf|otf)$/ }, () => ({
			contents: "export default 'mock-asset';",
			loader: "js",
		}));
	},
});
