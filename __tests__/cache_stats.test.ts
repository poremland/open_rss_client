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
import { mocks, storageMap } from "./setup";
import { expect, describe, it, beforeEach } from "bun:test";
import * as cacheHelper from "../helpers/cache_helper";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Cache Stats", () => {
	beforeEach(async () => {
		mocks.resetAll();
		storageMap.clear();
		if ((globalThis as any).localCacheMap) (globalThis as any).localCacheMap.clear();
	});

	it("should calculate correct cache stats based on feed item lists", async () => {
		const feed1 = "/feeds/1.json";
		const item1 = "/feed_items/101.json";
		const data1 = [{ id: 101 }, { id: 102 }]; // 2 items in this feed
		const data2 = { id: 101, content: "full content" };

		await cacheHelper.setCache(feed1, data1);
		await cacheHelper.setCache(item1, data2);
		await AsyncStorage.setItem("lastSyncTime", "2026-04-20T10:00:00Z");

		const stats = await cacheHelper.getCacheStats();
		
		expect(stats.cachedFeeds).toBe(1);
		expect(stats.cachedItems).toBe(2); // Counted from data1
		expect(stats.lastSyncTime).toBe("2026-04-20T10:00:00Z");
		expect(stats.totalSize).toBeGreaterThan(0);
	});
});
