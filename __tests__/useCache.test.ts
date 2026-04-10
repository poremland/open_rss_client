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
import { expect, describe, it, beforeEach } from "bun:test";
import { renderHook } from "@testing-library/react-native";
import useCache from "../components/useCache";

describe("useCache", () => {
	beforeEach(() => {
		mocks.resetAll();
	});

	it("should store and retrieve cached items for a specific URL", async () => {
		const url = "/feeds/1.json";
		const data = [{ id: 1, title: "Test Item" }];
		
		const { result } = renderHook(() => useCache());

		await result.current.setCache(url, data);
		
		expect(mocks.asyncStorageMock.setItem).toHaveBeenCalledWith(
			`cache:${url}`,
			JSON.stringify(data)
		);

		mocks.asyncStorageMock.getItem.mockResolvedValue(JSON.stringify(data));
		const cachedData = await result.current.getCache(url);
		expect(cachedData).toEqual(data);
	});

	it("should return null if no cached items found", async () => {
		const url = "/feeds/unknown.json";
		mocks.asyncStorageMock.getItem.mockResolvedValue(null);
		
		const { result } = renderHook(() => useCache());
		const cachedData = await result.current.getCache(url);
		
		expect(cachedData).toBeNull();
	});

	it("should handle invalid JSON in cache", async () => {
		const url = "/feeds/invalid.json";
		mocks.asyncStorageMock.getItem.mockResolvedValue("invalid-json");
		
		const { result } = renderHook(() => useCache());
		const cachedData = await result.current.getCache(url);
		
		expect(cachedData).toBeNull();
	});

	it("should clear cache for a specific URL", async () => {
		const url = "/feeds/1.json";
		const { result } = renderHook(() => useCache());

		await result.current.clearCache(url);
		
		expect(mocks.asyncStorageMock.removeItem).toHaveBeenCalledWith(`cache:${url}`);
	});
});
