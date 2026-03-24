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
import { mock, expect, describe, it, beforeEach } from "bun:test";
import { resolveModule } from "./setup";

const storageMap = new Map();
const asyncStorageMock = {
	setItem: mock(async (k: string, v: any) => { storageMap.set(k, String(v)); }),
	getItem: mock(async (k: string) => { 
		const val = storageMap.get(k);
		return val === undefined ? null : val;
	}),
	removeItem: mock(async (k: string) => { storageMap.delete(k); }),
	clear: mock(async () => { storageMap.clear(); }),
};

mock.module("@react-native-async-storage/async-storage", () => ({
	default: asyncStorageMock,
	__esModule: true,
}));

import "./setup";
import { mocks } from "./setup";
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/index";

describe("Login Screen", () => {
	beforeEach(async () => {
		mocks.resetAll();
		storageMap.clear();
	});

	it("should render the server URL input", async () => {
		const { getByPlaceholderText } = render(<LoginScreen />);
		expect(getByPlaceholderText("Server URL")).toBeTruthy();
	});

	it("should load server URL from AsyncStorage on mount", async () => {
		storageMap.set("serverUrl", "http://test-server.com");
		const { getByPlaceholderText } = render(<LoginScreen />);
		await waitFor(() => {
			const input = getByPlaceholderText("Server URL");
			expect(input.props.value).toBe("http://test-server.com");
		});
	});

	it("should save server URL to AsyncStorage on login", async () => {
		const { getByPlaceholderText, getByText } = render(<LoginScreen />);
		const urlInput = getByPlaceholderText("Server URL");
		const usernameInput = getByPlaceholderText("Username");
		const otpButton = getByText("Request OTP");

		fireEvent.changeText(urlInput, "http://test-server.com");
		fireEvent.changeText(usernameInput, "testuser");

		mocks.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "ok" }),
		});

		fireEvent.press(otpButton);

		await waitFor(() => {
			expect(storageMap.get("serverUrl")).toBe("http://test-server.com");
		});
	});

	it("should display an error message if login fails due to invalid token", async () => {
		const { getByPlaceholderText, getByText } = render(<LoginScreen />);
		const urlInput = getByPlaceholderText("Server URL");
		const usernameInput = getByPlaceholderText("Username");
		const otpButton = getByText("Request OTP");

		fireEvent.changeText(urlInput, "http://test-server.com");
		fireEvent.changeText(usernameInput, "testuser");

		mocks.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "ok" }),
		});

		fireEvent.press(otpButton);

		await waitFor(() => {
			expect(getByPlaceholderText("OTP")).toBeTruthy();
		});

		const otpInput = getByPlaceholderText("OTP");
		const loginButton = getByText("Login");

		fireEvent.changeText(otpInput, "123456");

		mocks.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "ok" }),
		});
		mocks.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "error", message: "Invalid OTP" }),
		});

		fireEvent.press(loginButton);

		await waitFor(() => {
			expect(getByText(/Invalid token/i)).toBeTruthy();
		});
	});

	it("should call checkLoggedIn on component mount", async () => {
		render(<LoginScreen />);
		expect(mocks.auth.checkLoggedIn).toHaveBeenCalled();
	});
});
