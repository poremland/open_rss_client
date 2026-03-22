import "./setup";
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
import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Index from "../app/index";
import * as authHelper from "../helpers/auth_helper";

describe("Login Screen", () => {
	beforeEach(async () => {
		mocks.resetAll();
		mocks.storageMap.clear();
	});

	it("should render the server URL input", async () => {
		const { getByPlaceholderText } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		expect(getByPlaceholderText("Server URL")).toBeTruthy();
	});

	it("should load server URL from AsyncStorage on mount", async () => {
		await AsyncStorage.setItem("serverUrl", "http://test-server.com");
		const { getByDisplayValue } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		await waitFor(() => {
			expect(getByDisplayValue("http://test-server.com")).toBeTruthy();
		});
	});

	it("should save server URL to AsyncStorage on login", async () => {
		const { getByPlaceholderText, getByText } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		const urlInput = getByPlaceholderText("Server URL");
		const usernameInput = getByPlaceholderText("Username");
		const otpButton = getByText("Request OTP");

		fireEvent.changeText(urlInput, "http://new-server.com");
		fireEvent.changeText(usernameInput, "testuser");

		mocks.fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "ok" }),
		});

		fireEvent.press(otpButton);

		await waitFor(() => {
			expect(mocks.asyncStorageMock.setItem).toHaveBeenCalledWith(
				"serverUrl",
				"http://new-server.com",
			);
		});
	});

	it("should display an error message if login fails due to invalid token", async () => {
		const { getByPlaceholderText, getByText, findByText } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		const urlInput = getByPlaceholderText("Server URL");
		const usernameInput = getByPlaceholderText("Username");
		const otpButton = getByText("Request OTP");

		fireEvent.changeText(urlInput, "http://test-server.com");
		fireEvent.changeText(usernameInput, "testuser");

		mocks.fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ status: "ok" }),
		});

		fireEvent.press(otpButton);

		const otpInput = await waitFor(() => getByPlaceholderText("OTP"));
		const loginButton = getByText("Login");

		fireEvent.changeText(otpInput, "123456");

		mocks.fetchMock.mockResolvedValueOnce({
			ok: false,
			status: 401,
			text: async () => "Invalid OTP",
		});

		fireEvent.press(loginButton);

		const errorMsg = await findByText(/Login Failed|Session expired|Invalid OTP/);
		expect(errorMsg).toBeTruthy();
	});

	it("should call checkLoggedIn on component mount", async () => {
		const checkLoggedInSpy = spyOn(authHelper, "checkLoggedIn").mockImplementation(async () => {});
		render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		expect(checkLoggedInSpy).toHaveBeenCalled();
		checkLoggedInSpy.mockRestore();
	});
});
