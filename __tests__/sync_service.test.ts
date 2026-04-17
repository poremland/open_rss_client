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
import { mock, expect, describe, it, beforeEach, afterEach, spyOn } from "bun:test";

import "./setup";
import { mocks } from "./setup";
import * as syncHelper from "../helpers/sync_helper";
import { syncService } from "../helpers/sync_service";

describe("syncService", () => {
	let consoleSpy: any;

	beforeEach(async () => {
		mocks.resetAll();
		await syncHelper.clearQueue();
		consoleSpy = spyOn(console, "error").mockImplementation(() => {});
		
		// Setup default API mocks for proactive fetch
		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
			return {};
		});
		mocks.api.postWithAuth.mockResolvedValue({ success: true });
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("should process the queue when synchronize is called", async () => {
		const action1 = { type: "GET", path: "/test1", body: null };
		const action2 = { type: "POST", path: "/test2", body: { foo: "bar" } };
		
		await syncHelper.queueAction(action1);
		await syncHelper.queueAction(action2);

		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/test1") return { success: true };
			if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
			return {};
		});

		await syncService.synchronize();

		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/test1");
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith("/test2", { foo: "bar" }, "application/json");

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(0);
	});

	it("should batch MARK_READ actions for the same feed", async () => {
		const action1 = { 
			type: "MARK_READ", 
			path: "/feeds/mark_items_as_read/1", 
			body: { items: JSON.stringify([101, 102]) } 
		};
		const action2 = { 
			type: "MARK_READ", 
			path: "/feeds/mark_items_as_read/1", 
			body: { items: JSON.stringify([103]) } 
		};
		const action3 = { 
			type: "MARK_READ", 
			path: "/feeds/mark_items_as_read/2", 
			body: { items: JSON.stringify([201]) } 
		};
		
		await syncHelper.queueAction(action1);
		await syncHelper.queueAction(action2);
		await syncHelper.queueAction(action3);

		await syncService.synchronize();

		// Should call postWithAuth with batched items for feed 1
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			"/feeds/mark_items_as_read/1", 
			{ items: JSON.stringify([101, 102, 103]) },
			"application/json"
		);
		// Should call postWithAuth for feed 2
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith(
			"/feeds/mark_items_as_read/2", 
			{ items: JSON.stringify([201]) },
			"application/json"
		);

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(0);
	});

	it("should emit syncStarted and syncFinished events", async () => {
		const startedListener = mock(() => {});
		const finishedListener = mock(() => {});

		syncService.on('syncStarted', startedListener);
		syncService.on('syncFinished', finishedListener);

		await syncService.synchronize();

		expect(startedListener).toHaveBeenCalled();
		expect(finishedListener).toHaveBeenCalled();

		syncService.off('syncStarted', startedListener);
		syncService.off('syncFinished', finishedListener);
	});

	it("should keep failed actions in the queue", async () => {
		const action = { type: "GET", path: "/fail", body: null };
		await syncHelper.queueAction(action);

		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/fail") throw new Error("Network Error");
			if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
			return {};
		});

		await syncService.synchronize();

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].path).toBe("/fail");
	});

	it("should handle mixed success and failure", async () => {
		await syncHelper.queueAction({ type: "GET", path: "/success", body: null });
		await syncHelper.queueAction({ type: "GET", path: "/fail", body: null });
		await syncHelper.queueAction({ type: "POST", path: "/post-success", body: { foo: "bar" } });

		mocks.api.getWithAuth.mockImplementation(async (path: string) => {
			if (path === "/success") return { success: true };
			if (path === "/fail") throw new Error("Fail");
			if (path === "/feeds/tree.json" || path === "/feeds/all.json") return [];
			return {};
		});

		await syncService.synchronize();

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].path).toBe("/fail");
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith("/post-success", { foo: "bar" }, "application/json");
	});
});
