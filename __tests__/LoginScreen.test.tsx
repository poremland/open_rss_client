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
import "./setup";
import { mocks } from "./setup";
import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import LoginScreen from "../app/index";

const fetchMock = mocks.fetch;
const createFetchResponse = mocks.createFetchResponse;
const storageMap = mocks.storageMap;

describe("Login Screen", () => {
	beforeEach(async () => {
		mocks.resetAll();
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

		fetchMock.mockResolvedValueOnce(createFetchResponse(true, 200, { status: "ok" }));

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

		fetchMock.mockResolvedValueOnce(createFetchResponse(true, 200, { status: "ok" }));

		fireEvent.press(otpButton);

		await waitFor(() => {
			expect(getByPlaceholderText("OTP")).toBeTruthy();
		});

		const otpInput = getByPlaceholderText("OTP");
		const loginButton = getByText("Login");

		fireEvent.changeText(otpInput, "123456");

		fetchMock.mockResolvedValueOnce(createFetchResponse(true, 200, { status: "ok" }));
		fetchMock.mockResolvedValueOnce(createFetchResponse(true, 200, { status: "error", message: "Invalid OTP" }));

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
