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

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { post } from "../helpers/api";
import Index from "../app/index";

import * as authHelper from "../helpers/auth";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
	getItem: jest.fn(),
	setItem: jest.fn(),
}));

jest.mock("../helpers/auth", () => ({
	storeUser: jest.fn(),
	storeAuthToken: jest.fn(),
	checkLoggedIn: jest.fn(),
}));

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
}));

describe("Login Screen", () => {
	const mockRouter = {
		replace: jest.fn(),
	};

	beforeEach(() => {
		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		(post as jest.Mock).mockClear();

		(authHelper.storeUser as jest.Mock).mockClear();
		(authHelper.storeAuthToken as jest.Mock).mockClear();
		(authHelper.checkLoggedIn as jest.Mock).mockClear();
		mockRouter.replace.mockClear();
		(AsyncStorage.getItem as jest.Mock).mockClear();
		(AsyncStorage.setItem as jest.Mock).mockClear();
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue(null); // Default to no stored URL
	});

	it("should render the server URL input", async () => {
		const { getByTestId } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		expect(getByTestId("serverUrlInput")).toBeTruthy();
	});

	it("should load server URL from AsyncStorage on mount", async () => {
		(AsyncStorage.getItem as jest.Mock).mockResolvedValue("http://test.com");
		const { getByTestId } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);
		await waitFor(() => {
			expect(getByTestId("serverUrlInput").props.value).toBe("http://test.com");
		});
	});

	it("should save server URL to AsyncStorage on login", async () => {
		const mockToken = "test-token";
		(post as jest.Mock).mockResolvedValue({ token: mockToken });

		const { getByPlaceholderText, getByTestId } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);

		fireEvent.changeText(getByTestId("serverUrlInput"), "http://newurl.com");
		fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
		fireEvent.press(getByTestId("requestOtpButton"));

		await waitFor(() => {
			expect(AsyncStorage.setItem).toHaveBeenCalledWith(
				"serverUrl",
				"http://newurl.com",
			);
			expect(post).toHaveBeenCalledWith("/api/request_otp", {
				username: "testuser",
			});
		});

		fireEvent.changeText(getByTestId("otpInput"), "123456");
		fireEvent.press(getByTestId("loginButton"));

		await waitFor(() => {
			expect(post).toHaveBeenCalledWith("/api/login", {
				username: "testuser",
				otp: "123456",
			});
			expect(authHelper.storeUser).toHaveBeenCalledWith("testuser");
			expect(authHelper.storeAuthToken).toHaveBeenCalledWith(mockToken);
			expect(mockRouter.replace).toHaveBeenCalledWith("FeedListScreen");
		});
	});

	it("should log in successfully and navigate to the feed list screen", async () => {
		const mockToken = "test-token";
		(post as jest.Mock).mockResolvedValue({ token: mockToken });

		const { getByPlaceholderText, getByTestId } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);

		fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
		fireEvent.press(getByTestId("requestOtpButton"));

		await waitFor(() => {
			expect(post).toHaveBeenCalledWith("/api/request_otp", {
				username: "testuser",
			});
		});

		fireEvent.changeText(getByTestId("otpInput"), "123456");
		fireEvent.press(getByTestId("loginButton"));

		await waitFor(() => {
			expect(post).toHaveBeenCalledWith("/api/login", {
				username: "testuser",
				otp: "123456",
			});
			expect(authHelper.storeUser).toHaveBeenCalledWith("testuser");
			expect(authHelper.storeAuthToken).toHaveBeenCalledWith(mockToken);
			expect(mockRouter.replace).toHaveBeenCalledWith("FeedListScreen");
		});
	});

	it("should display an error message if login fails due to invalid token", async () => {
		(post as jest.Mock).mockResolvedValue({ token: null });

		const { getByPlaceholderText, getByTestId, getByText } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);

		fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
		fireEvent.press(getByTestId("requestOtpButton"));

		await waitFor(() => {
			expect(post).toHaveBeenCalledWith("/api/request_otp", {
				username: "testuser",
			});
		});

		fireEvent.changeText(getByTestId("otpInput"), "123456");
		fireEvent.press(getByTestId("loginButton"));

		await waitFor(() => {
			expect(getByText("Login Failed: Invalid token in response")).toBeTruthy();
			expect(authHelper.storeUser).not.toHaveBeenCalled();
			expect(authHelper.storeAuthToken).not.toHaveBeenCalled();
			expect(mockRouter.replace).not.toHaveBeenCalled();
		});
	});

	it("should display an error message if login fails due to API error", async () => {
		(post as jest.Mock).mockResolvedValueOnce({});

		const { getByPlaceholderText, getByTestId, getByText } = render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);

		fireEvent.changeText(getByPlaceholderText("Username"), "testuser");
		fireEvent.press(getByTestId("requestOtpButton"));

		await waitFor(() => {
			expect(post).toHaveBeenCalledWith("/api/request_otp", {
				username: "testuser",
			});
		});

		(post as jest.Mock).mockRejectedValue(new Error("Network Error"));
		fireEvent.changeText(getByTestId("otpInput"), "123456");
		fireEvent.press(getByTestId("loginButton"));

		await waitFor(() => {
			expect(getByText("Login Error: Network Error")).toBeTruthy();
			expect(authHelper.storeUser).not.toHaveBeenCalled();
			expect(authHelper.storeAuthToken).not.toHaveBeenCalled();
			expect(mockRouter.replace).not.toHaveBeenCalled();
		});
	});

	it("should call checkLoggedIn on component mount", () => {
		render(
			<NavigationContainer>
				<Index />
			</NavigationContainer>,
		);

		expect(authHelper.checkLoggedIn).toHaveBeenCalledWith(mockRouter);
	});
});
