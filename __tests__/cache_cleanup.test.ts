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
import * as cacheHelper from "../helpers/cache_helper";
import { syncService } from "../helpers/sync_service";
import * as syncHelper from "../helpers/sync_helper";

describe("Cache Cleanup on Mark Read", () => {
	const feedId = 1;
	const itemId = 101;
	const itemUrl = `/feed_items/${itemId}.json`;
	const feedUrl = `/feeds/${feedId}.json`;

	beforeEach(async () => {
		mocks.resetAll();
		if ((globalThis as any).storageMap) (globalThis as any).storageMap.clear();
		await syncHelper.clearQueue();

		// Setup initial cache
		await cacheHelper.setCache(itemUrl, { id: itemId, feed_id: feedId, title: "Test Item" });
		await cacheHelper.setCache(feedUrl, [{ id: itemId, feed_id: feedId, title: "Test Item" }]);
		await cacheHelper.setCache("/feeds/tree.json", [{ feed: { id: feedId, count: 1 } }]);

		// Default API mocks
		mocks.api.postWithAuth.mockResolvedValue({ success: true });
		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
			return {};
		});
	});

	it("should clear individual item cache and remove from feed list cache after successful syncService.synchronize", async () => {
		// Queue a MARK_READ action
		await syncHelper.queueAction({
			type: "MARK_READ",
			path: `/feeds/mark_items_as_read/${feedId}`,
			body: { items: JSON.stringify([itemId]) }
		});

		// Verify cache exists before sync
		expect(await cacheHelper.getCache(itemUrl)).toBeDefined();
		const feedItemsBefore = await cacheHelper.getCache<any[]>(feedUrl);
		expect(feedItemsBefore).toHaveLength(1);

		// Synchronize
		await syncService.synchronize();

		// Verify sync happened
		expect(mocks.api.postWithAuth).toHaveBeenCalled();

		// Verify cache is cleared
		const itemCacheAfter = await cacheHelper.getCache(itemUrl);
		expect(itemCacheAfter).toBeNull();

		const feedItemsAfter = await cacheHelper.getCache<any[]>(feedUrl);
		expect(feedItemsAfter).toHaveLength(0);
	});

	it("should NOT clear cache if syncService.synchronize fails", async () => {
		const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
		mocks.api.postWithAuth.mockRejectedValue(new Error("Server Error"));

		await syncHelper.queueAction({
			type: "MARK_READ",
			path: `/feeds/mark_items_as_read/${feedId}`,
			body: { items: JSON.stringify([itemId]) }
		});

		try {
			await syncService.synchronize();
		} catch (e) {
			// Expected
		}

		// Verify cache STILL exists
		expect(await cacheHelper.getCache(itemUrl)).toBeDefined();
		const feedItems = await cacheHelper.getCache<any[]>(feedUrl);
		expect(feedItems).toHaveLength(1);

		consoleErrorSpy.mockRestore();
	});
});
