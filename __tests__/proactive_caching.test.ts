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
import { expect, describe, it, mock, beforeEach } from "bun:test";
import { mocks } from "./setup";
import { backgroundSyncTask } from "../helpers/background_sync";
import * as cacheHelper from "../helpers/cache_helper";
import { syncService } from "../helpers/sync_service";

describe("Proactive Caching", () => {
	beforeEach(() => {
		mocks.resetAll();
		cacheHelper.clearLocalCache();
	});

	it("should fetch and cache unread items for all feeds in the tree", async () => {
		const mockTree = [
			{ feed: { id: 1, name: "Feed 1" }, unread_count: 5 },
			{ feed: { id: 2, name: "Feed 2" }, unread_count: 10 },
		];
		const mockItems1 = [{ id: 101, title: "Item 1.1" }];
		const mockItems2 = [{ id: 201, title: "Item 2.1" }];

		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/feeds/tree.json") return mockTree;
			if (path === "/feeds/1.json") return mockItems1;
			if (path === "/feeds/2.json") return mockItems2;
			if (path === "/feeds/all.json") return [];
			return null;
		});

		await backgroundSyncTask();

		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/tree.json");
		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/1.json");
		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/2.json");
		
		const treeCache = await cacheHelper.getCache("/feeds/tree.json");
		expect(treeCache).toEqual(mockTree);
		
		const items1Cache = await cacheHelper.getCache("/feeds/1.json");
		expect(items1Cache).toEqual(mockItems1);
		
		const items2Cache = await cacheHelper.getCache("/feeds/2.json");
		expect(items2Cache).toEqual(mockItems2);
	});

	it.skip("should perform proactive fetch when syncService.synchronize is called", async () => {
		const mockTree = [{ feed: { id: 3, name: "Feed 3" } }];
		const mockItems3 = [{ id: 301, title: "Item 3.1" }];

		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/feeds/tree.json") return mockTree;
			if (path === "/feeds/3.json") return mockItems3;
			if (path === "/feeds/all.json") return [];
			return null;
		});

		await syncService.synchronize();

		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/tree.json");
		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/feeds/3.json");

		const cachedTree = await cacheHelper.getCache("/feeds/tree.json");
		expect(cachedTree).toEqual(mockTree);

		const cachedItems3 = await cacheHelper.getCache("/feeds/3.json");
		expect(cachedItems3).toEqual(mockItems3);
	});
});
