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
import { mocks, useApiMock } from "./setup";
import { mock, expect, describe, it, beforeEach, spyOn } from "bun:test";
import React from "react";
import { render, waitFor } from "@testing-library/react-native";

mock.module("../app/components/useApi", () => ({
	default: useApiMock,
	__esModule: true,
}));

mock.module("../helpers/auth_helper", () => ({
	auth: {
		getUser: mock(),
		getAuthToken: mock(),
		storeAuthToken: mock(),
		storeUser: mock(),
		clearAuthData: mock(),
		checkLoggedIn: mock(),
		refreshTokenOnLoad: mock(),
		handleSessionExpired: mock(),
	},
	clearAuthData: mock(),
	__esModule: true,
}));

const ManageFeedsListScreen = require("../app/ManageFeedsListScreen").default;
const auth = require("../helpers/auth_helper");

describe("ManageFeedsListScreen", () => {
	const mockFeeds = [
		{ id: 1, name: "Feed 1", uri: "http://feed1.com" },
		{ id: 2, name: "Feed 2", uri: "http://feed2.com" },
	];

	beforeEach(async () => {
		mocks.resetAll();
	});

	it("should fetch feeds when the screen is focused", async () => {
		const execute = mock().mockResolvedValue(mockFeeds);
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute,
			setData: mock(),
		});

		render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(execute).toHaveBeenCalled();
		});
	});

	it("should display a list of all feeds", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock().mockResolvedValue(mockFeeds),
			setData: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("Feed 2")).toBeTruthy();
		});
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		render(<ManageFeedsListScreen />);

		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenuMock.setMenuItems.mock.calls[0][0];
		const logoutItem = menuItems.find((item: any) => item.label === "Log-out");
		logoutItem.onPress();

		expect(auth.clearAuthData).toHaveBeenCalled();
	});

	it("should display loading message when feeds are loading", async () => {
		useApiMock.mockReturnValue({
			loading: true,
			error: null,
			data: null,
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("Loading...")).toBeTruthy());
	});

	it("should display error message when api call fails", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: "API Error",
			data: null,
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("API Error")).toBeTruthy());
	});

	it("should display no feeds message when there are no feeds", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("No feeds to manage!")).toBeTruthy());
	});

	it("should copy feed uri to clipboard on press", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock().mockResolvedValue(mockFeeds),
			setData: mock(),
		});

		const { getByText } = render(<ManageFeedsListScreen />);
		await waitFor(() => expect(getByText("Feed 1")).toBeTruthy());
	});
});
