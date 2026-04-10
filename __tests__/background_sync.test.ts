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
import { mock, expect, describe, it, beforeEach } from "bun:test";
import "./setup";
import { mocks } from "./setup";
import * as cacheHelper from "../helpers/cache_helper";
import { backgroundSyncTask } from "../helpers/background_sync";

describe("backgroundSyncTask", () => {
	beforeEach(() => {
		mocks.resetAll();
		cacheHelper.clearLocalCache();
	});

	it("should fetch and cache all unread items for all feeds", async () => {
		const feeds = [{ id: 1, name: "Feed 1" }, { id: 2, name: "Feed 2" }];
		const items1 = [{ id: 101, title: "Item 1.1", feed_id: 1 }];
		const items2 = [{ id: 201, title: "Item 2.1", feed_id: 2 }];

		mocks.api.getWithAuth.mockImplementation((path: string) => {
			if (path === "/feeds.json") return Promise.resolve(feeds);
			if (path === "/feeds/1.json") return Promise.resolve(items1);
			if (path === "/feeds/2.json") return Promise.resolve(items2);
			return Promise.resolve([]);
		});

		await backgroundSyncTask();

		const cachedFeeds = await cacheHelper.getCache("/feeds.json");
		expect(cachedFeeds).toEqual(feeds);

		const cachedItems1 = await cacheHelper.getCache("/feeds/1.json");
		expect(cachedItems1).toEqual(items1);

		const cachedItems2 = await cacheHelper.getCache("/feeds/2.json");
		expect(cachedItems2).toEqual(items2);
	});
});
