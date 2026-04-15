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
		{ feed: { id: 1, name: "Test Feed" }, unread_count: 2 },
		{ feed: { id: 2, name: "Other Feed" }, unread_count: 5 },
	];

	beforeEach(async () => {
		mocks.resetAll();
		await cacheHelper.setCache("/feeds/tree.json", mockTree);
	});

	it("should decrement unread count in tree cache", async () => {
		await cacheHelper.decrementUnreadCount(1, 1);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(2);
		expect(newTree!.find(f => f.feed.id === 1).unread_count).toBe(1);
	});

	it("should remove feed from tree cache when unread count reaches zero", async () => {
		await cacheHelper.decrementUnreadCount(1, 2);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(1);
		expect(newTree!.find(f => f.feed.id === 1)).toBeUndefined();
	});

	it("should handle missing tree cache gracefully", async () => {
		await cacheHelper.clearCache("/feeds/tree.json");
		await cacheHelper.clearLocalCache();
		storageMap.clear();
		
		await cacheHelper.decrementUnreadCount(1, 1);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toBeNull();
	});

	it("should handle unread count already at zero", async () => {
		const treeWithZero = [{ feed: { id: 3, name: "Zero Feed" }, unread_count: 0 }];
		await cacheHelper.setCache("/feeds/tree.json", treeWithZero);
		
		await cacheHelper.decrementUnreadCount(3, 1);
		
		const newTree = await cacheHelper.getCache<any[]>("/feeds/tree.json");
		expect(newTree).toHaveLength(0);
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
});
