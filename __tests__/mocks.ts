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
		};
		(D.prototype as any).create = mock(async () => {});
		(D.prototype as any).delete = mock(async () => {});
		(D.prototype as any).createFile = mock((name: string) => new (fileSystemMock.File as any)("file:///mock-uri", name));
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

export const apiMocks = {
	get: mock(),
	post: mock(),
	getWithAuth: mock(),
	getBlobWithAuth: mock(),
	exportOpml: mock(),
	importOpml: mock(),
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
	fetchMock.mockClear().mockImplementation(() => Promise.resolve({ 
		ok: true, 
		headers: {
			get: (name: string) => name.toLowerCase() === "content-type" ? "application/json" : null
		},
		json: async () => ({}),
		text: async () => ""
	}));
	alertMock.mockClear();
	routerMocks.push.mockClear();
	routerMocks.replace.mockClear();
	routerMocks.back.mockClear();
	routerMocks.dismissAll.mockClear();
	routerMocks.setParams.mockClear();
	navigationMocks.setOptions.mockClear();
	navigationMocks.goBack.mockClear();
	Object.values(apiMocks).forEach(m => typeof m.mockClear === 'function' && m.mockClear());
	Object.values(authMocks).forEach(m => typeof m.mockClear === 'function' && m.mockClear());
	Object.values(fileSystemMock).forEach(m => typeof m.mockClear === 'function' && m.mockClear());
	Object.values(sharingMock).forEach(m => typeof m.mockClear === 'function' && m.mockClear());
	Object.values(documentPickerMock).forEach(m => typeof m.mockClear === 'function' && m.mockClear());
	useApiMock.mockClear();
	useApiMock.mockReturnValue({
		data: null,
		loading: false,
		error: "",
		execute: mock(),
		setData: mock(),
	});
};
