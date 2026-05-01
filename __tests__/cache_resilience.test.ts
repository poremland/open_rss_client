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
import { expect, describe, it, beforeEach, afterEach } from "bun:test";
import * as apiHelper from "../helpers/api_helper";
import * as cacheHelper from "../helpers/cache_helper";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("Cache Resilience", () => {
        beforeEach(() => {
                (globalThis as any).__disableApiMock = true;
                (globalThis as any).__disableAuthMock = true;
                mocks.resetAll();
                storageMap.clear();
                cacheHelper.clearLocalCache();
        });

        afterEach(() => {
                (globalThis as any).__disableApiMock = false;
                (globalThis as any).__disableAuthMock = false;
        });

        it("should return null and log an error when cache data is corrupted", async () => {
                const url = "/corrupted";
                const key = cacheHelper.getCacheKey(url);
                await AsyncStorage.setItem(key, "invalid json {");

                // Mock console.error to avoid noise but verify it was called
                const originalConsoleError = console.error;
                let errorLogged = false;
                console.error = () => { errorLogged = true; };

                try {
                        const result = await cacheHelper.getCache(url);
                        expect(result).toBeNull();
                        expect(errorLogged).toBe(true);
                } finally {
                        console.error = originalConsoleError;
                }
        });

        it("should return null when cache is missing", async () => {
                const result = await cacheHelper.getCache("/missing");
                expect(result).toBeNull();
        });

        it("should throw a descriptive error when serverUrl is missing in getBaseUrl", async () => {		await expect(apiHelper.api.getBaseUrl()).rejects.toThrow("Server URL not set. Please log in again.");
	});

	it("should throw a meaningful error when making a request without a serverUrl", async () => {
		// Mock fetch to see what happens when baseUrl is null
		const originalFetch = global.fetch;
		global.fetch = async (url: string) => {
			if (url.startsWith("null")) {
				throw new Error("Invalid URL: baseUrl is null");
			}
			return { ok: true, json: async () => ({}) } as any;
		};

		try {
			await expect(apiHelper.get("/test")).rejects.toThrow();
		} finally {
			global.fetch = originalFetch;
		}
	});

	it("should handle missing authToken gracefully in postWithAuth", async () => {
		await AsyncStorage.setItem("serverUrl", "https://example.com");
		// authToken is NOT set

		await expect(apiHelper.postWithAuth("/test", {})).rejects.toThrow("No authentication token found.");
	});
});
