/*
 * RSS Reader: A mobile application for consuming RSS feeds.
 * Copyright (C) 2025 Paul Oremland
 */

import { mock } from "bun:test";

export const createApiMocks = () => ({
	get: mock().mockImplementation(() => Promise.resolve(null)),
	post: mock().mockImplementation(() => Promise.resolve(null)),
	getWithAuth: mock().mockImplementation(() => Promise.resolve(null)),
	postWithAuth: mock().mockImplementation(() => Promise.resolve(null)),
	putWithAuth: mock().mockImplementation(() => Promise.resolve(null)),
	refreshToken: mock().mockImplementation(() => Promise.resolve(null)),
});

export const createAuthMocks = () => ({
	storeAuthToken: mock(),
	getAuthToken: mock(),
	storeUser: mock(),
	getUser: mock(),
	clearAuthData: mock(),
	checkLoggedIn: mock(),
	refreshTokenOnLoad: mock(),
	handleSessionExpired: mock(),
});

export const createRouterMocks = () => ({
	push: mock(),
	replace: mock(),
	back: mock(),
	dismissAll: mock(),
	setParams: mock(),
});

export const createNavigationMocks = () => ({
	setOptions: mock(),
	goBack: mock(),
});
