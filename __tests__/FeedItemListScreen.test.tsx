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
import { act } from "react";
import FeedItemListScreen from "../app/FeedItemListScreen";
import * as syncHelper from "../helpers/sync_helper";
import * as cacheHelper from "../helpers/cache_helper";

describe("FeedItemListScreen", () => {
        const mockFeed = { id: 1, name: "Test Feed" };
        const mockFeedItems = [
                { id: 1, feed_id: 1, title: "Item 1", link: "http://test.com/1", description: "Desc 1" },
                { id: 2, feed_id: 1, title: "Item 2", link: "http://test.com/2", description: "Desc 2" },
        ];

        beforeEach(() => {
                mocks.resetAll();
                mocks.api.getWithAuth.mockResolvedValue(mockFeedItems);
                mocks.localSearchParams.mockReturnValue({ feed: JSON.stringify(mockFeed) });
        });

        it("disables feed deletion when disconnected", async () => {
                mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
                mocks.useConnectionStatusMock.isConnected = false;
                render(<FeedItemListScreen />);

                // Wait for the hook to update and setMenuItems to be called
                await waitFor(() => {
                        expect(mocks.useMenu.setMenuItems).toHaveBeenCalled();
                });

                const menuItems = mocks.useMenu.setMenuItems.mock.calls[mocks.useMenu.setMenuItems.mock.calls.length - 1][0];
                const deleteAction = menuItems.find((item: any) => item.label === "Delete Feed");

                await act(async () => {
                        await deleteAction.onPress();
                });

                expect(mocks.alert).toHaveBeenCalledWith("Offline", "Deleting feeds is disabled while offline.");
                expect(mocks.api.getWithAuth).not.toHaveBeenCalledWith(expect.stringContaining("remove"));
        });

        it("should display a list of feed items", async () => {		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());
		expect(getByText("Item 2")).toBeTruthy();
	});

	it("should mark all items as read when Mark All As Read is pressed", async () => {
		mocks.api.postWithAuth.mockResolvedValue({ message: "Success" });

		render(<FeedItemListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const markAllReadAction = menuItems.find((item: any) => item.label === "Mark All As Read");

		await act(async () => {
			await markAllReadAction.onPress();
		});

		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			expect.stringContaining("mark_items_as_read"),
			expect.any(Object),
			expect.any(String)
		);
		expect(mocks.navigation.goBack).toHaveBeenCalled();
	});

	it("should delete the feed when Delete Feed is pressed", async () => {
		mocks.api.getWithAuth.mockResolvedValueOnce(mockFeedItems); // first call
		mocks.api.getWithAuth.mockResolvedValueOnce({ message: "Deleted" }); // delete call

		render(<FeedItemListScreen />);

		await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
		const menuItems = mocks.useMenu.setMenuItems.mock.calls[0][0];
		const deleteAction = menuItems.find((item: any) => item.label === "Delete Feed");

		await act(async () => {
			await deleteAction.onPress();
		});

		expect(mocks.api.getWithAuth).toHaveBeenCalledWith(expect.stringContaining("remove"));
		expect(mocks.navigation.goBack).toHaveBeenCalled();
	});

	it("should activate multi-select mode when an item is long-pressed", async () => {
		const { getByText, getByTestId } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

		fireEvent(getByTestId("feed-item-1"), "onLongPress");

		await waitFor(() => expect(getByText("Mark Read")).toBeTruthy());
	});

	it("should mark selected items as read when Mark Read is pressed", async () => {
		mocks.api.postWithAuth.mockResolvedValue({ message: "Success" });

		const { getByText, getByTestId } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

		fireEvent(getByTestId("feed-item-1"), "onLongPress");
		await waitFor(() => expect(getByText("Mark Read")).toBeTruthy());

		fireEvent.press(getByText("Mark Read"));

		await waitFor(() => expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			expect.stringContaining("mark_items_as_read"),
			expect.objectContaining({ items: JSON.stringify([1]) }),
			expect.any(String)
		));
	});

	it("should handle swipe mark as read", async () => {
		mocks.api.postWithAuth.mockResolvedValue({ message: "Success" });

		const { getByTestId, getAllByTestId } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByTestId("feed-item-1")).toBeTruthy());

		const handlers = getAllByTestId("pan-gesture-handler");
		await act(async () => {
			(handlers[0] as any).props.simulateSwipe(-500);
		});

		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			expect.stringContaining("mark_items_as_read"),
			expect.objectContaining({ items: JSON.stringify([1]) }),
			expect.any(String)
		);
	});

	it("should display an error message if the api call fails", async () => {
		mocks.api.getWithAuth.mockRejectedValue(new Error("API Error"));

		const { getByText } = render(<FeedItemListScreen />);

		await waitFor(() => expect(getByText("API Error")).toBeTruthy());
	});

	it("should navigate to FeedItemDetailScreen when an item is pressed", async () => {
		const { getAllByTestId } = render(<FeedItemListScreen />);

		await waitFor(() => expect(mocks.api.getWithAuth).toHaveBeenCalled());
		
		const handlers = getAllByTestId("tap-gesture-handler");
		fireEvent.press(handlers[0]);

		expect(mocks.router.push).toHaveBeenCalledWith(expect.objectContaining({
			pathname: "/FeedItemDetailScreen",
			params: expect.objectContaining({ 
				feedItemId: "1",
				feedItem: JSON.stringify(mockFeedItems[0])
			})
		}));
	});

	describe("Offline Mode", () => {
		beforeEach(async () => {
			mocks.networkMocks.getNetworkStateAsync.mockResolvedValue({ isConnected: false });
			mocks.useConnectionStatusMock.isConnected = false;
			if ((process as any).localSyncQueue) {
				(process as any).localSyncQueue.length = 0;
			}
			await cacheHelper.setCache("/feeds/1.json", mockFeedItems);
		});

		it("should queue mark all as read and update local cache when offline", async () => {
			render(<FeedItemListScreen />);

			await waitFor(() => expect(mocks.useMenu.setMenuItems).toHaveBeenCalled());
			
			// Wait for useConnectionStatus to update
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			const lastCallIndex = mocks.useMenu.setMenuItems.mock.calls.length - 1;
			const menuItems = mocks.useMenu.setMenuItems.mock.calls[lastCallIndex][0];
			const markAllReadAction = menuItems.find((item: any) => item.label === "Mark All As Read");

			await act(async () => {
				await markAllReadAction.onPress();
			});

			// Verify it was queued
			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining({
				type: "POST",
				path: expect.stringContaining("mark_items_as_read/1"),
				body: { items: JSON.stringify([1, 2]) },
			}));

			// Verify local cache was cleared
			const newCachedItems = await cacheHelper.getCache<any[]>("/feeds/1.json");
			expect(newCachedItems).toHaveLength(0);

			expect(mocks.navigation.goBack).toHaveBeenCalled();
		});

		it("should queue swipe mark as read and update local cache when offline", async () => {
			const { getAllByTestId, getByText } = render(<FeedItemListScreen />);

			await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

			// Wait for useConnectionStatus to update
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			const handlers = getAllByTestId("pan-gesture-handler");
			await act(async () => {
				(handlers[0] as any).props.simulateSwipe(-500);
			});

			// Verify it was queued
			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining({
				type: "POST",
				path: expect.stringContaining("mark_items_as_read/1"),
				body: { items: JSON.stringify([1]) },
			}));

			// Verify local cache was updated
			const newCachedItems = await cacheHelper.getCache<any[]>("/feeds/1.json");
			expect(newCachedItems).toHaveLength(1);
			expect(newCachedItems![0].id).toBe(2);
		});

		it("should queue multi-select mark as read and update local cache when offline", async () => {
			const { getByText, getByTestId } = render(<FeedItemListScreen />);

			await waitFor(() => expect(getByText("Item 1")).toBeTruthy());

			// Wait for useConnectionStatus to update
			await act(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
			});

			fireEvent(getByTestId("feed-item-1"), "onLongPress");
			await waitFor(() => expect(getByText("Mark Read")).toBeTruthy());

			await act(async () => {
				fireEvent.press(getByText("Mark Read"));
			});

			// Verify it was queued
			const queue = await syncHelper.getQueue();
			expect(queue).toContainEqual(expect.objectContaining({
				type: "POST",
				path: expect.stringContaining("mark_items_as_read/1"),
				body: { items: JSON.stringify([1]) },
			}));

			// Verify local cache was updated
			const newCachedItems = await cacheHelper.getCache<any[]>("/feeds/1.json");
			expect(newCachedItems).toHaveLength(1);
			expect(newCachedItems![0].id).toBe(2);
		});
	});
});
