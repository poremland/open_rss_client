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
import { mock, expect, describe, it, beforeEach } from "bun:test";
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
	getUser: mock(),
	clearAuthData: mock(),
	__esModule: true,
}));

const FeedListScreen = require("../app/FeedListScreen").default;
const auth = require("../helpers/auth_helper");

describe("FeedListScreen", () => {
	const mockFeeds = [
		{ feed: { id: 1, name: "Feed 1", count: 5 } },
		{ feed: { id: 2, name: "Feed 2", count: 0 } },
	];

	beforeEach(() => {
		mocks.resetAll();
		auth.getUser.mockResolvedValue("test-user");
	});

	it("should display a list of feeds", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock().mockResolvedValue(mockFeeds),
			setData: mock(),
		});

		const { getByText } = render(<FeedListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("5")).toBeTruthy();
		});
	});

	it("should navigate to AddFeedScreen when Add Feed is pressed", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: mockFeeds,
			execute: mock().mockResolvedValue(mockFeeds),
			setData: mock(),
		});

		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenuMock.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenuMock.setMenuItems.mock.calls[0][0];
		const addItem = menuItems.find((item: any) => item.label === "Add Feed");
		addItem.onPress();

		expect(mocks.routerMocks.push).toHaveBeenCalledWith("/AddFeedScreen");
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		useApiMock.mockReturnValue({
			loading: false,
			error: null,
			data: [],
			execute: mock().mockResolvedValue([]),
			setData: mock(),
		});

		render(<FeedListScreen />);

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

		const { getByText } = render(<FeedListScreen />);
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

		const { getByText } = render(<FeedListScreen />);
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

		const { getByText } = render(<FeedListScreen />);
		await waitFor(() => expect(getByText(/Congratulations/i)).toBeTruthy());
	});
});
