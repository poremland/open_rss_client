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
import { mocks, useApiConfig } from "./setup";

import { mock, expect, describe, it, beforeEach, afterEach } from "bun:test";
import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import FeedItemDetailScreen from "../app/FeedItemDetailScreen";
import * as syncHelper from "../helpers/sync_helper";
import * as cacheHelper from "../helpers/cache_helper";

describe("FeedItemDetailScreen", () => {
	const mockFeedItem = {
		id: 1,
		title: "Test Item",
		link: "http://test.com/1",
		description: "Test Desc",
	};

	beforeEach(() => {
		mocks.resetAll();
		mocks.localSearchParams.params = { feedItemId: "1" };
	});

	afterEach(async () => {
		await act(async () => {
			await new Promise(resolve => setTimeout(resolve, 10));
		});
	});

	it("should display feed item details (via header title)", async () => {
		// Set initial data to avoid immediate state update warning
		useApiConfig.data = mockFeedItem;
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					headerTitle: "Test Item",
				}),
			);
		});
	});

	it("should apply webViewContainer style", async () => {
		useApiConfig.data = mockFeedItem;
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		const { getByTestId } = render(<FeedItemDetailScreen />);

		await waitFor(() => {
			const webViewContainer = getByTestId("webViewContainer");
			expect(webViewContainer).toBeTruthy();
		});
	});

	it("should NOT call goBack on mount when feedItemId is present", async () => {
		// Mock API to stay in loading state or return nothing yet
		mocks.api.getWithAuth.mockReturnValue(new Promise(() => {})); // Never resolves

		render(<FeedItemDetailScreen />);

		// Check that goBack was not called
		expect(mocks.navigation.goBack).not.toHaveBeenCalled();
	});

	it("should set the correct menu items", async () => {
		useApiConfig.data = mockFeedItem;
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(mocks.useMenu.setMenuItems).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ label: "Mark As Read" }),
					expect.objectContaining({ label: "Open Full Site" }),
					expect.objectContaining({ label: "Share" }),
					expect.objectContaining({ label: "Log-out" }),
				]),
			);
		});
	});

	it("should call markItemAsRead and navigate back when Mark As Read is pressed", async () => {
		mocks.api.getWithAuth.mockImplementation((path: string) => {
			if (path.includes("feed_items/1.json")) return Promise.resolve(mockFeedItem);
			if (path.includes("mark_as_read/1")) return Promise.resolve({ success: true });
			return Promise.resolve(null);
		});

		render(<FeedItemDetailScreen />);

		// Wait for the screen to load and the header to update
		await waitFor(() => expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
			expect.objectContaining({ headerTitle: "Test Item" })
		));

		// Wait for any pending effects/renders
		await act(async () => {
			await new Promise(resolve => setTimeout(resolve, 100));
		});

		// Retrieve action after header title update to get updated handler
		const lastCallIndexFinal = mocks.useMenu.setMenuItems.mock.calls.length - 1;
		const menuItemsFinal = mocks.useMenu.setMenuItems.mock.calls[lastCallIndexFinal][0];
		const markAsReadActionFinal = menuItemsFinal.find((item: any) => item.label === "Mark As Read");

		expect(markAsReadActionFinal).toBeTruthy();

		// Reset mock to track the next call (the actual mark as read operation)
		mocks.api.getWithAuth.mockClear();

		await act(async () => {
			await markAsReadActionFinal.onPress();
		});

		await waitFor(() => expect(mocks.api.getWithAuth).toHaveBeenCalledWith(
			expect.stringContaining("mark_as_read/1"),
		));
		expect(mocks.router.back).toHaveBeenCalled();
		expect(mocks.router.setParams).toHaveBeenCalledWith({ removedItemId: "1" });
	});

	it.skip("should queue markItemAsRead and update local cache when offline", async () => {
		const item = { ...mockFeedItem, feed_id: 10 };
		mocks.api.getWithAuth.mockResolvedValue(item);
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		mocks.useConnectionStatusMock.isConnected = false;

		const cachedItems = [item, { id: 2, title: "Other Item", feed_id: 10 }];
		await cacheHelper.setCache("/feeds/10.json", cachedItems);

		render(<FeedItemDetailScreen />);

		await waitFor(() => expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
			expect.objectContaining({ headerTitle: "Test Item" })
		));

		// Wait for useConnectionStatus to update to offline state
		await act(async () => {
			await new Promise(resolve => setTimeout(resolve, 100));
		});

		// Retrieve action after connection status update to get updated handler
		const lastCallIndex = mocks.useMenu.setMenuItems.mock.calls.length - 1;
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[lastCallIndex][0];
		const markAsReadAction = menuItems.find((i: any) => i.label === "Mark As Read");

		await act(async () => {
			await markAsReadAction.onPress();
		});

		// Verify it was queued
		const queue = await syncHelper.getQueue();
		expect(queue).toContainEqual(expect.objectContaining({
			type: "GET",
			path: expect.stringContaining("mark_as_read/1"),
		}));

		// Verify local cache was updated
		const newCachedItems = await cacheHelper.getCache<any[]>("/feeds/10.json");
		expect(newCachedItems).toHaveLength(1);
		expect(newCachedItems![0].id).toBe(2);

		expect(mocks.router.back).toHaveBeenCalled();
	});

	it.skip("should display feed item details offline when data is passed as param", async () => {
		const item = { ...mockFeedItem, feed_id: 10 };
		mocks.localSearchParams.params = { 
			feedItemId: "1", 
			feedItem: JSON.stringify(item) 
		};
		
		// Mock offline state
		mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
		mocks.useConnectionStatusMock.isConnected = false;
		
		// API should not be called if offline and we have initial data (or if it falls through it should fail)
		mocks.api.getWithAuth.mockRejectedValue(new Error("Network request failed"));

		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					headerTitle: "Test Item",
				}),
			);
		});

		// Verify that useApi used the initialData and didn't show error immediately 
		// (Actually useApi might still call execute, but it should not overwrite the data if it fails)
		expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
			expect.objectContaining({ headerTitle: "Test Item" })
		);
	});

	it("should NOT automatically mark item as read on mount", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		render(<FeedItemDetailScreen />);

		// Wait for the screen to load and the header to update
		await waitFor(() => expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
			expect.objectContaining({ headerTitle: "Test Item" })
		));

		// Wait a bit more to ensure no automatic call happens
		await act(async () => {
			await new Promise(resolve => setTimeout(resolve, 100));
		});

		// Verify that mark_as_read was NOT called
		expect(mocks.api.getWithAuth).not.toHaveBeenCalledWith(
			expect.stringContaining("mark_as_read"),
		);
	});

	it("should call goBack on mount when feedItemId is missing", async () => {
		mocks.localSearchParams.params = {}; // Missing feedItemId

		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(mocks.navigation.goBack).toHaveBeenCalled();
		});
	});
});
