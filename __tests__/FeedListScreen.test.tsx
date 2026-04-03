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
import { expect, describe, it, beforeEach } from "bun:test";
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import FeedListScreen from "../app/FeedListScreen";

describe("FeedListScreen", () => {
	const mockFeeds = [
		{ feed: { id: 1, name: "Feed 1", count: 5 } },
		{ feed: { id: 2, name: "Feed 2", count: 0 } },
	];

	beforeEach(() => {
		mocks.resetAll();
		mocks.api.getWithAuth.mockResolvedValue(mockFeeds);
		mocks.auth.getUser.mockResolvedValue("testuser");
	});

	it("should display a list of feeds", async () => {
		const { getByText } = render(<FeedListScreen />);

		await waitFor(() => {
			expect(getByText("Feed 1")).toBeTruthy();
			expect(getByText("5")).toBeTruthy();
		});
	});

	it("should navigate to AddFeedScreen when Add Feed is pressed", async () => {
		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const addFeedAction = menuItems.find((item: any) => item.label === "Add Feed");
		addFeedAction.onPress();

		expect(mocks.router.push).toHaveBeenCalledWith("/AddFeedScreen");
	});

	it("should navigate to ManageFeedsListScreen when Manage Feeds is pressed", async () => {
		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const manageFeedsAction = menuItems.find((item: any) => item.label === "Manage Feeds");
		manageFeedsAction.onPress();

		expect(mocks.router.push).toHaveBeenCalledWith("/ManageFeedsListScreen");
	});

	it("should call clearAuthData when Log-out is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		render(<FeedListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const logoutAction = menuItems.find((item: any) => item.label === "Log-out");
		logoutAction.onPress();

		expect(mocks.auth.clearAuthData).toHaveBeenCalled();
	});

	it("should display error message when api call fails", async () => {
		mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

		const { getByText } = render(<FeedListScreen />);
		await waitFor(() => expect(getByText("API Error")).toBeTruthy());
	});

	it("should display no feeds message when there are no feeds", async () => {
		mocks.api.getWithAuth.mockResolvedValue([]);

		const { getByText } = render(<FeedListScreen />);
		await waitFor(() => expect(getByText("Congratulations! No more feeds with unread items.")).toBeTruthy());
	});
});
