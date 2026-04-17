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
import { plugin } from "bun";
import * as path from "path";

// Define __DEV__ globally for all modules
(globalThis as any).__DEV__ = true;
(global as any).__DEV__ = true;

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
// Using globalThis singletons to ensure consistent state in CI isolates
const g = (globalThis as any);

if (!g.storageMap) {
	g.storageMap = new Map();
}
export const storageMap = g.storageMap;

export const asyncStorageMock = g.asyncStorageMock || {
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
g.asyncStorageMock = asyncStorageMock;
g.AsyncStorage = asyncStorageMock;
(globalThis as any).AsyncStorage = asyncStorageMock;
(global as any).AsyncStorage = asyncStorageMock;

export const routerMocks = g.routerMocks || {
	push: mock(),
	replace: mock(),
	back: mock(),
	dismissAll: mock(),
	setParams: mock(),
};
g.routerMocks = routerMocks;

export const navigationMocks = g.navigationMocks || {
	setOptions: mock(),
	goBack: mock(),
	navigate: mock(),
	dispatch: mock(),
};
g.navigationMocks = navigationMocks;

export const alertMock = g.alertMock || mock();
g.alertMock = alertMock;

export const createFetchResponse = (ok: boolean, status: number, data: any, contentType: string = 'application/json') => {
	const response = {
		ok,
		status,
		json: async () => (typeof data === 'string' ? JSON.parse(data) : data),
		text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
		blob: async () => new Blob([typeof data === 'string' ? data : JSON.stringify(data)]),
		headers: {
			get: (name: string) => {
				if (name.toLowerCase() === 'content-type') return contentType;
				return null;
			}
		}
	};
	return response;
};

export const fetchMock = g.fetchMock || mock(() => Promise.resolve(createFetchResponse(true, 200, {})));
g.fetchMock = fetchMock;
g.fetch = fetchMock;
(globalThis as any).fetch = fetchMock;
(global as any).fetch = fetchMock;

export const clipboardMocks = g.clipboardMocks || {
	setStringAsync: mock(),
	getStringAsync: mock(),
};
g.clipboardMocks = clipboardMocks;

export const opmlMocks = g.opmlMocks || {
	validateOpmlFile: mock(async (content: string) => {
		if (content === "not xml at all") throw new Error("Invalid OPML file: Not a valid XML");
		if (content.includes("<notopml>")) throw new Error("Invalid OPML file: Missing <opml> root element");
		if (content.includes("<opml") && !content.includes("<body>")) throw new Error("Invalid OPML file: Missing <body> element");
		if (content.includes("<body>") && !content.includes("<outline")) throw new Error("Invalid OPML file: No <outline> elements found");
		return true;
	}),
};
g.opmlMocks = opmlMocks;

export const apiMocks = g.apiMocks || {
	get: mock(),
	post: mock(),
	getWithAuth: mock((path: string) => {
		if (path === "/feeds/tree.json" || path === "/feeds/all.json" || path.startsWith("/feeds/")) return Promise.resolve([]);
		return Promise.resolve({});
	}),
	getBlobWithAuth: mock(),
	exportOpml: mock(),
	importOpml: mock(async () => ({ success: true, count: 0 })),
	readTextFile: mock(),
	postFormDataWithAuth: mock(),
	postWithAuth: mock(),
	putWithAuth: mock(),
	refreshToken: mock(),
};
g.apiMocks = apiMocks;

export const authMocks = g.authMocks || {
	storeAuthToken: mock(),
	getAuthToken: mock(),
	storeUser: mock(),
	getUser: mock(),
	clearAuthData: mock(),
	checkLoggedIn: mock(),
	refreshTokenOnLoad: mock(),
	handleSessionExpired: mock(),
};
g.authMocks = authMocks;

export const useMenuMock = g.useMenuMock || {
	setMenuItems: mock(),
	onToggleDropdown: mock(),
};
g.useMenuMock = useMenuMock;

export const localSearchParamsMock = g.localSearchParamsMock || {
	params: {} as any,
	mockReturnValue: (p: any) => { localSearchParamsMock.params = p; }
};
g.localSearchParamsMock = localSearchParamsMock;

export const useApiConfig = g.useApiConfig || {
	data: null as any,
	loading: false,
	error: null as string | null,
	execute: mock().mockImplementation(() => Promise.resolve(null)),
	setData: mock(),
};
g.useApiConfig = useApiConfig;

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
g.__sharedConnectionState = g.__sharedConnectionState || {
	isConnected: true,
	listeners: [] as Array<(s: { isConnected: boolean }) => void>,
};
const sharedConnectionState = g.__sharedConnectionState;

export const networkMocks = g.__networkMocks || {
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
g.__networkMocks = networkMocks;

const connectionMock = g.__connectionMock || {
	get isConnected() { return sharedConnectionState.isConnected; },
	set isConnected(v: boolean) {
		sharedConnectionState.isConnected = v;
		sharedConnectionState.listeners.forEach((l: any) => l({ isConnected: v }));
	},
	get listeners() { return sharedConnectionState.listeners; },
	updateConnectionStatus: mock(async () => {}),
};
g.__connectionMock = connectionMock;
g.__useConnectionStatusMock = connectionMock;
(global as any).__useConnectionStatusMock = connectionMock;

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
	createFetchResponse,
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
	fileSystem: g.fileSystemMock || {
		StorageAccessFramework: {
			requestDirectoryPermissionsAsync: mock(async () => ({ granted: true })),
			createFileAsync: mock(async () => "mock-uri"),
			writeAsStringAsync: mock(async () => {}),
		},
		File: mock(),
		Paths: {
			documentDirectory: "mock-docs",
			cacheDirectory: "mock-cache",
		},
		Directory: mock(),
		writeAsStringAsync: mock(async () => {}),
		readAsStringAsync: mock(async () => ""),
		cacheDirectory: "mock-cache/",
		documentDirectory: "mock-docs/",
	},
	sharing: g.sharingMock || {
		shareAsync: mock(async () => {}),
		isAvailableAsync: mock(async () => true),
	},
	documentPicker: g.documentPickerMock || {
		getDocumentAsync: mock(async () => ({ canceled: false, assets: [{ uri: "mock-uri" }] })),
	},
	haptics: g.hapticsMock || {
		impactAsync: mock(async () => {}),
		notificationAsync: mock(async () => {}),
		selectionAsync: mock(async () => {}),
		ImpactFeedbackStyle: { Light: 0, Medium: 1, Heavy: 2 },
		NotificationFeedbackType: { Success: 0, Warning: 1, Error: 2 },
	},
	opml: opmlMocks,
	opmlMocks,
	networkMocks,
	useConnectionStatusMock,
	localSearchParams: localSearchParamsMock,
	resetAll: () => {} // Placeholder
};
g.__mocks = mocks;
(global as any).__mocks = mocks;

const fileSystemMock = mocks.fileSystem;
const sharingMock = mocks.sharing;
const documentPickerMock = mocks.documentPicker;
const hapticsMock = mocks.haptics;

// --- Bun Module Mocks ---

// Mock react-native BEFORE anything else
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
			return React.createElement(name, props, ...children);
		};
		Comp.displayName = name;
		return Comp;
	};

	const baseRN: any = {
		View: mockComponent("View"),
		Text: mockComponent("Text"),
		TouchableOpacity: mockComponent("TouchableOpacity"),
		TouchableWithoutFeedback: mockComponent("TouchableWithoutFeedback"),
		FlatList: (props: any) => {
			const React = require("react");
			const items = props.data || [];
			if (items.length === 0 && props.ListEmptyComponent) {
				return React.createElement("FlatList", props, 
					typeof props.ListEmptyComponent === 'function' ? props.ListEmptyComponent() : props.ListEmptyComponent
				);
			}
			return React.createElement("FlatList", props, 
				items.map((item: any, index: number) => 
					React.createElement(React.Fragment, { key: props.keyExtractor ? props.keyExtractor(item, index) : index },
						props.renderItem({ item, index })
					)
				)
			);
		},
		ScrollView: mockComponent("ScrollView"),
		TextInput: mockComponent("TextInput"),
		Button: (props: any) => {
			const React = require("react");
			const { Text, TouchableOpacity } = require("react-native");
			return React.createElement(TouchableOpacity, { ...props, accessibilityRole: 'button' }, 
				React.createElement(Text, {}, props.title)
			);
		},
		Image: mockComponent("Image"),
		KeyboardAvoidingView: mockComponent("KeyboardAvoidingView"),
		ActivityIndicator: mockComponent("ActivityIndicator"),
		Modal: mockComponent("Modal"),
		RefreshControl: mockComponent("RefreshControl"),
		Alert: {
			alert: alertMock,
		},
		StyleSheet: {
			create: (s: any) => s,
			flatten: (s: any) => {
				if (Array.isArray(s)) {
					return Object.assign({}, ...s);
				}
				return s || {};
			},
		},
		Platform: {
			OS: "ios",
			select: (obj: any) => obj.ios || obj.default,
		},
		LogBox: {
			ignoreLogs: () => {},
			ignoreAllLogs: () => {},
		},
		I18nManager: {
			isRTL: false,
			allowRTL: () => {},
			forceRTL: () => {},
		},
		TurboModuleRegistry: {
			get: mock(() => null),
			getEnforcing: mock(() => ({})),
		},
		Share: {
			share: mock(async () => ({ action: "sharedAction" })),
		},
		NativeEventEmitter: class {
			addListener = mock(() => ({ remove: mock(() => {}) }));
			removeAllListeners = mock(() => {});
		},
		findNodeHandle: mock(() => 1),
		Linking: {
			openURL: mock(async () => true),
			canOpenURL: mock(async () => true),
			addEventListener: mock(() => ({ remove: mock(() => {}) })),
		},
		Dimensions: {
			get: mock(() => ({ width: 375, height: 812, scale: 3, fontScale: 1 })),
			set: mock(() => {}),
			addEventListener: mock(() => ({ remove: mock(() => {}) })),
		},
	};

	// Use Proxy to handle missing exports robustly
	return new Proxy(baseRN, {
		get: (target, prop) => {
			if (prop in target) return target[prop];
			if (typeof prop === 'string' && prop[0] === prop[0].toUpperCase()) {
				return mockComponent(prop);
			}
			return mock(() => {});
		}
	});
});

mock.module("react-native-reanimated", () => {
	const React = require("react");
	const mockComponent = (name: string) => (props: any) => React.createElement(name, props, props.children);
	const baseReanimated: any = {
		default: {
			configureProps: () => {},
			addWhitelistedNativeProps: () => {},
			addWhitelistedUIProps: () => {},
			View: mockComponent("Animated.View"),
			Text: mockComponent("Animated.Text"),
			ScrollView: mockComponent("Animated.ScrollView"),
			Image: mockComponent("Animated.Image"),
		},
		useAnimatedStyle: (cb: any) => cb() || {},
		useSharedValue: (val: any) => ({ value: val }),
		withTiming: (val: any) => val,
		withSpring: (val: any) => val,
		runOnJS: (fn: any) => fn,
		createAnimatedComponent: (comp: any) => comp,
		FadeIn: { duration: () => ({ delay: () => ({ springify: () => {} }) }) },
		FadeOut: { duration: () => ({ delay: () => ({ springify: () => {} }) }) },
		useAnimatedGestureHandler: (handlers: any) => {
			const ctx = {};
			const handler = (event: any) => {
				const fullEvent = { ...event, nativeEvent: event.nativeEvent || event };
				if (fullEvent.nativeEvent.state === 1 && handlers.onStart) handlers.onStart(fullEvent.nativeEvent, ctx); // BEGAN
				if (fullEvent.nativeEvent.state === 5 && handlers.onActive) handlers.onActive(fullEvent.nativeEvent, ctx); // ACTIVE
				if (fullEvent.nativeEvent.state === 6 && handlers.onEnd) handlers.onEnd(fullEvent.nativeEvent, ctx); // END
			};
			return handler;
		},
		interpolate: (x: number, [a, b]: number[], [c, d]: number[]) => c,
		Extrapolate: { CLAMP: "clamp" },
		View: mockComponent("Animated.View"),
		Text: mockComponent("Animated.Text"),
		ScrollView: mockComponent("Animated.ScrollView"),
		Image: mockComponent("Animated.Image"),
	};

	return new Proxy(baseReanimated, {
		get: (target, prop) => {
			if (prop in target) return target[prop];
			return mock(() => ({}));
		}
	});
});

mock.module("@react-navigation/native", () => ({
	useFocusEffect: (cb: any) => {
		const React = require("react");
		React.useEffect(cb, []);
	},
	useIsFocused: () => true,
	useNavigation: () => navigationMocks,
}));

mock.module("expo-router", () => ({
	useRouter: () => routerMocks,
	useNavigation: () => navigationMocks,
	useLocalSearchParams: () => localSearchParamsMock.params,
}));

mock.module("@react-native-async-storage/async-storage", () => ({
	default: asyncStorageMock,
	__esModule: true,
}));

const mockIcon = (name: string) => (props: any) => {
	const React = require("react");
	const { Text } = require("react-native");
	return React.createElement(Text, { ...props }, props.name);
};

mock.module("@expo/vector-icons", () => {
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

// We don't use mock.module for project helpers to avoid re-evaluation SyntaxErrors.
// Instead, they check globalThis.apiMocks/authMocks/opmlMocks in their implementation.

mock.module(resolveModule("../components/GlobalDropdownMenu"), () => ({
	useMenu: () => useMenuMock,
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
			const handler = (event: any) => {
				if (typeof props.onGestureEvent === 'function') props.onGestureEvent(event);
				if (typeof props.onHandlerStateChange === 'function') props.onHandlerStateChange(event);
			};
			return React.createElement("PanGestureHandler", {
				...props,
				simulateSwipe: (translationX: number) => {
					handler({ nativeEvent: { translationX: 0, state: 1 } }); // BEGAN
					handler({ nativeEvent: { translationX, state: 5 } }); // ACTIVE
					handler({ nativeEvent: { translationX, state: 6 } }); // END
				}
			}, props.children);
		},
		State: {
			BEGAN: 1,
			FAILED: 2,
			CHANGED: 3,
			CANCELLED: 4,
			ACTIVE: 5,
			END: 6,
		},
	};
});

mock.module("expo-file-system", () => ({
	StorageAccessFramework: fileSystemMock.StorageAccessFramework,
	File: fileSystemMock.File,
	Paths: fileSystemMock.Paths,
	Directory: fileSystemMock.Directory,
	writeAsStringAsync: fileSystemMock.writeAsStringAsync,
	readAsStringAsync: fileSystemMock.readAsStringAsync,
	cacheDirectory: fileSystemMock.cacheDirectory,
	documentDirectory: fileSystemMock.documentDirectory,
	__esModule: true,
}));

mock.module("expo-sharing", () => ({
	shareAsync: sharingMock.shareAsync,
	isAvailableAsync: sharingMock.isAvailableAsync,
	__esModule: true,
}));

mock.module("expo-document-picker", () => ({
	getDocumentAsync: documentPickerMock.getDocumentAsync,
	__esModule: true,
}));

mock.module("expo-haptics", () => ({
	impactAsync: hapticsMock.impactAsync,
	notificationAsync: hapticsMock.notificationAsync,
	selectionAsync: hapticsMock.selectionAsync,
	ImpactFeedbackStyle: hapticsMock.ImpactFeedbackStyle,
	NotificationFeedbackType: hapticsMock.NotificationFeedbackType,
	__esModule: true,
}));

mock.module("expo-task-manager", () => ({
	defineTask: mock(),
	isTaskDefined: mock(() => true),
	__esModule: true,
}));

mock.module("expo-background-task", () => ({
	registerTaskAsync: mock(async () => {}),
	unregisterTaskAsync: mock(async () => {}),
	getStatusAsync: mock(async () => 2), // Available
	BackgroundTaskStatus: {
		Restricted: 1,
		Available: 2,
	},
	BackgroundTaskResult: {
		Success: 1,
		Failed: 2,
	},
	__esModule: true,
}));

mock.module("expo-network", () => ({
	...networkMocks,
	__esModule: true,
}));

mock.module("react-native-webview", () => ({
	WebView: (props: any) => {
		const React = require("react");
		return React.createElement("WebView", props);
	},
	__esModule: true,
}));

mock.module("expo-clipboard", () => ({
	setStringAsync: clipboardMocks.setStringAsync,
	getStringAsync: clipboardMocks.getStringAsync,
	__esModule: true,
}));

mock.module("expo-system-ui", () => ({
	setBackgroundColorAsync: mock(async () => {}),
	__esModule: true,
}));

mock.module("expo-splash-screen", () => ({
	preventAutoHideAsync: mock(async () => true),
	hideAsync: mock(async () => true),
	__esModule: true,
}));

mock.module("expo-constants", () => ({
	default: {
		expoConfig: {
			extra: {
				eas: {
					projectId: "mock-id",
				},
			},
		},
	},
	__esModule: true,
}));

export const resetMocksInObj = (obj: any) => {
	Object.values(obj).forEach((m: any) => {
		if (m && typeof m.mockClear === "function") {
			m.mockClear();
		}
	});
};

export const resetAll = () => {
	if ((globalThis as any).AsyncStorage && (globalThis as any).AsyncStorage.clear) {
		(globalThis as any).AsyncStorage.clear();
	}
	const g = (globalThis as any);
	if (g.localCacheMap) {
		g.localCacheMap.clear();
	}
	if (g.localSyncQueue) {
		g.localSyncQueue.length = 0;
	}
	sharedConnectionState.listeners.length = 0;
	sharedConnectionState.isConnected = true;
	resetMocksInObj(routerMocks);
	resetMocksInObj(navigationMocks);
	
	// Just clear calls, do not reset implementation for asyncStorageMock
	resetMocksInObj(asyncStorageMock);
	asyncStorageMock.setItem.mockImplementation(async (k: string, v: any) => { storageMap.set(k, String(v)); });
	asyncStorageMock.getItem.mockImplementation(async (k: string) => { 
		const val = storageMap.get(k);
		return val === undefined ? null : val;
	});
	asyncStorageMock.removeItem.mockImplementation(async (k: string) => { storageMap.delete(k); });
	asyncStorageMock.clear.mockImplementation(async () => { storageMap.clear(); });
	
	resetMocksInObj(apiMocks);
	apiMocks.getWithAuth.mockImplementation(async (path: string) => {
		if (path === "/feeds/tree.json" || path === "/feeds/all.json" || path.startsWith("/feeds/")) return Promise.resolve([]);
		return Promise.resolve({});
	});
	apiMocks.postWithAuth.mockImplementation(async () => ({}));
	apiMocks.get.mockImplementation(async () => ({}));
	apiMocks.post.mockImplementation(async () => ({}));

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
	fetchMock.mockClear().mockImplementation(() => Promise.resolve(createFetchResponse(true, 200, {})));
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
