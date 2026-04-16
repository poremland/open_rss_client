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
import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import * as cacheHelper from "../helpers/cache_helper";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Offline Feed List Pruning Unit Tests", () => {
	const mockTree = [
		{ feed: { id: 1, name: "Test Feed", count: 2 } },
		{ feed: { id: 2, name: "Other Feed", count: 5 } },
	];
	const mockItems1 = [
		{ id: 101, feed_id: 1, title: "Item 1" },
		{ id: 102, feed_id: 1, title: "Item 2" },
	];

	beforeEach(async () => {
		mocks.resetAll();
		await cacheHelper.setCache("/feeds/tree.json", mockTree);
		await cacheHelper.setCache("/feeds/1.json", mockItems1);
	});

	it("should decrement unread count in tree cache when an item is marked read", async () => {
		await cacheHelper.markItemsReadInCache(1, [101]);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(2);
		expect(newTree!.find(f => f.feed.id === 1).feed.count).toBe(1);

		const newItems = await cacheHelper.getCache<any[]>("/feeds/1.json");
		expect(newItems).toHaveLength(1);
		expect(newItems![0].id).toBe(102);
	});

	it("should remove feed from tree cache when all items are marked read", async () => {
		await cacheHelper.markItemsReadInCache(1, [101, 102]);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(1);
		expect(newTree!.find(f => f.feed.id === 1)).toBeUndefined();
	});

	it("should handle missing tree cache gracefully", async () => {
		await cacheHelper.clearCache("/feeds/tree.json");
		await cacheHelper.clearLocalCache();
		storageMap.clear();
		
		await cacheHelper.markItemsReadInCache(1, [101]);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toBeNull();
	});

	it("should handle marking all items read", async () => {
		await cacheHelper.markAllItemsReadInCache(1);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(1);
		expect(newTree!.find(f => f.feed.id === 1)).toBeUndefined();

		const newItems = await cacheHelper.getCache<any[]>("/feeds/1.json");
		expect(newItems).toHaveLength(0);
	});

	it("should handle errors in getCache", async () => {
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
		await cacheHelper.clearLocalCache();
		
		const getItemSpy = spyOn(AsyncStorage, "getItem").mockImplementationOnce(() => {
			return Promise.reject(new Error("AsyncStorage error"));
		});
		
		const result = await cacheHelper.getCache("/any-error");
		expect(result).toBeNull();
		expect(consoleSpy).toHaveBeenCalled();
		
		consoleSpy.mockRestore();
		getItemSpy.mockRestore();
	});

	it("should handle errors in setCache", async () => {
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});
		
		const setItemSpy = spyOn(AsyncStorage, "setItem").mockImplementationOnce(() => {
			return Promise.reject(new Error("AsyncStorage error"));
		});
		
		await cacheHelper.setCache("/any-set-error", { data: 1 });
		
		expect(consoleSpy).toHaveBeenCalled();
		
		consoleSpy.mockRestore();
		setItemSpy.mockRestore();
	});

	it("should NOT remove other feeds when one feed is pruned", async () => {
		const multiTree = [
			{ feed: { id: 1, name: "Feed 1", count: 1 } },
			{ feed: { id: 2, name: "Feed 2", count: 5 } },
			{ feed: { id: 3, name: "Feed 3", count: 10 } },
		];
		const multiItems1 = [{ id: 101, feed_id: 1, title: "Item 101" }];
		await cacheHelper.setCache("/feeds/tree.json", multiTree);
		await cacheHelper.setCache("/feeds/1.json", multiItems1);

		// Prune Feed 1
		await cacheHelper.markItemsReadInCache(1, [101]);

		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(2);
		expect(newTree!.find(f => f.feed.id === 2)).toBeDefined();
		expect(newTree!.find(f => f.feed.id === 3)).toBeDefined();
		expect(newTree!.find(f => f.feed.id === 1)).toBeUndefined();
		});

		it("should NOT remove feed from tree when count is undefined", async () => {
		const tree = [
		        { feed: { id: 1, name: "Feed 1" } }, // count is undefined
		        { feed: { id: 2, name: "Feed 2", count: 5 } },
		];
		await cacheHelper.setCache("/feeds/tree.json", tree);

		await cacheHelper.markItemsReadInCache(1, [101]);

		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(2);
		expect(newTree!.find(f => f.feed.id === 1)).toBeDefined();
		});

		it("should handle unread_count at top level (backward compatibility/bug fix)", async () => {
		        const tree = [
		                { feed: { id: 1, name: "Feed 1" }, unread_count: 5 },
		                { feed: { id: 2, name: "Feed 2" }, unread_count: 10 },
		        ];
		        await cacheHelper.setCache("/feeds/tree.json", tree);
		        await cacheHelper.clearCache("/feeds/1.json");

		        await cacheHelper.markItemsReadInCache(1, [101]);
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(2);
		expect(newTree!.find(f => f.feed.id === 1).feed.count).toBe(4);
		});
		});
