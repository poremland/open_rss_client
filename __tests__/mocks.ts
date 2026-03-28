import { mock } from "bun:test";

export const storageMap = new Map();
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

export const fetchMock = mock();

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

export const fileSystemMock = {
	documentDirectory: "file:///mock-documents/",
	cacheDirectory: "file:///mock-cache/",
	writeAsStringAsync: mock(async () => {}),
	readAsStringAsync: mock(async () => ""),
	deleteAsync: mock(async () => {}),
	makeDirectoryAsync: mock(async () => {}),
	copyAsync: mock(async () => {}),
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

export const resetAll = () => {
	storageMap.clear();
	asyncStorageMock.setItem.mockClear();
	asyncStorageMock.getItem.mockClear();
	asyncStorageMock.removeItem.mockClear();
	asyncStorageMock.clear.mockClear();
	asyncStorageMock.getAllKeys.mockClear();
	asyncStorageMock.multiGet.mockClear();
	fetchMock.mockClear();
	alertMock.mockClear();
	routerMocks.push.mockClear();
	routerMocks.replace.mockClear();
	routerMocks.back.mockClear();
	routerMocks.dismissAll.mockClear();
	routerMocks.setParams.mockClear();
	navigationMocks.setOptions.mockClear();
	navigationMocks.goBack.mockClear();
	Object.values(apiMocks).forEach(m => m.mockClear());
	Object.values(authMocks).forEach(m => m.mockClear());
	Object.values(fileSystemMock).forEach(m => typeof m === 'function' && m.mockClear());
	Object.values(sharingMock).forEach(m => m.mockClear());
	Object.values(documentPickerMock).forEach(m => m.mockClear());
	useApiMock.mockClear();
	useApiMock.mockReturnValue({
		data: null,
		loading: false,
		error: "",
		execute: mock(),
		setData: mock(),
	});
};
