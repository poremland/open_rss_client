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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import FeedItemListScreen from "../app/FeedItemListScreen";

describe("FeedItemListScreen", () => {
	const mockFeed = { id: 1, name: "Test Feed" };
	const mockItems = [
		{ id: 1, title: "Item 1", link: "http://test.com/1", description: "Desc 1" },
		{ id: 2, title: "Item 2", link: "http://test.com/2", description: "Desc 2" },
	];

	beforeEach(() => {
		mocks.resetAll();
		mocks.localSearchParams.params = { feed: JSON.stringify(mockFeed) };
	});

	it("should display a list of feed items", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockItems);

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => {
			expect(getByText("Item 1")).toBeTruthy();
			expect(getByText("Item 2")).toBeTruthy();
		});
	});

	it("should mark all items as read when Mark All As Read is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockItems);

		render(<FeedItemListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const markAllReadItem = menuItems.find(
			(item: any) => item.label === "Mark All As Read",
		);

		mocks.api.postWithAuth.mockResolvedValue({ success: true });

		await act(async () => {
			await markAllReadItem.onPress();
		});

		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			"/feeds/mark_items_as_read/1",
			{ items: JSON.stringify([1, 2]) },
			"application/x-www-form-urlencoded"
		);
	});

	it("should activate multi-select mode when an item is long-pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockItems);

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => expect(getByText("Select All")).toBeTruthy());
	});

	it("should mark selected items as read when Mark Read is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockItems);

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

		fireEvent(getByText("Item 1"), "longPress");

		await waitFor(() => expect(getByText("Mark Read")).toBeTruthy());
		const markReadButton = getByText("Mark Read");

		mocks.api.postWithAuth.mockResolvedValue({ success: true });

		await act(async () => {
			fireEvent.press(markReadButton);
		});

		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			"/feeds/mark_items_as_read/1",
			{ items: JSON.stringify([1]) },
			"application/x-www-form-urlencoded"
		);
	});

	it("should display an error message if the api call fails", async () => {
		mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("API Error")).toBeTruthy());
	});

	it("should navigate to FeedItemDetailScreen when an item is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockItems);

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

		fireEvent.press(getByText("Item 1"));

		expect(mocks.router.push).toHaveBeenCalledWith({
			pathname: "/FeedItemDetailScreen",
			params: { feedItemId: "1" },
		});
	});
});
