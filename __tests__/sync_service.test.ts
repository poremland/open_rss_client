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

	beforeEach(() => {
		mocks.resetAll();
		if ((process as any).localSyncQueue) {
			(process as any).localSyncQueue.length = 0;
		}
		consoleSpy = spyOn(console, "error").mockImplementation(() => {});
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
		mocks.api.postWithAuth.mockResolvedValue({ success: true });

		await syncService.synchronize();

		expect(mocks.api.getWithAuth).toHaveBeenCalledWith("/test1");
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith("/test2", { foo: "bar" }, undefined);

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(0);
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
		mocks.api.postWithAuth.mockResolvedValue({ success: true });

		await syncService.synchronize();

		const queue = await syncHelper.getQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].path).toBe("/fail");
		expect(mocks.api.postWithAuth).toHaveBeenCalledWith("/post-success", { foo: "bar" }, undefined);
	});
});
