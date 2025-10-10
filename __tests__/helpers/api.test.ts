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

jest.unmock("../../helpers/api");

jest.doMock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

import { post, postWithAuth, get, getWithAuth } from "../../helpers/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("API Helper", () => {
	const MOCK_BASE_URL = "http://localhost:3000";

	beforeEach(async () => {
		mockFetch.mockClear();
		await AsyncStorage.clear();
		await AsyncStorage.setItem("serverUrl", MOCK_BASE_URL);
	});

	describe("post", () => {
		it("should make a POST request and return JSON data", async () => {
			const mockData = { message: "Success" };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await post("/test", { foo: "bar" });

			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
				},
				body: "foo=bar",
			});
			expect(result).toEqual(mockData);
		});

		it("should throw an error if the request fails", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => "Internal Server Error",
			});

			await expect(post("/test", { foo: "bar" })).rejects.toThrow(
				"Request failed with status 500: Internal Server Error",
			);
		});

		it("should throw 'Session expired' error if status is 401", async () => {
			mockFetch.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => "Unauthorized",
			});

			await expect(post("/test", { foo: "bar" })).rejects.toThrow(
				"Session expired",
			);
		});
	});

	describe("postWithAuth", () => {
		it("should make an authenticated POST request with form data", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await postWithAuth("/test", { foo: "bar" });

			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Accept: "application/json",
					Authorization: "Bearer test-token",
				},
				body: "foo=bar",
			});
			expect(result).toEqual(mockData);
		});

		it("should make an authenticated POST request with JSON data", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await postWithAuth(
				"/test",
				{ foo: "bar" },
				"application/json",
			);

			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: "Bearer test-token",
				},
				body: JSON.stringify({ foo: "bar" }),
			});
			expect(result).toEqual(mockData);
		});

		it("should throw an error if no auth token is found", async () => {
			await expect(postWithAuth("/test", { foo: "bar" })).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("get", () => {
		it("should make a GET request without auth", async () => {
			const mockData = { message: "Success" };
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await get("/test");

			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {},
			});
			expect(result).toEqual(mockData);
		});

		it("should make a GET request with auth if token exists", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await get("/test");

			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			});
			expect(result).toEqual(mockData);
		});

		it("should retry a failed GET request up to 3 times", async () => {
			const mockError = new Error("Network error");
			mockFetch.mockRejectedValue(mockError);

			await expect(get("/test")).rejects.toThrow("Network error");
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			mockFetch
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockData,
				});

			const result = await get("/test");

			expect(result).toEqual(mockData);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("getWithAuth", () => {
		it("should make an authenticated GET request", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch.mockResolvedValueOnce({
				ok: true,
				json: async () => mockData,
			});

			const result = await getWithAuth("/test");

			const authToken = "test-token";
			expect(mockFetch).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${authToken}`,
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			});
			expect(result).toEqual(mockData);
		});

		it("should throw an error if no auth token is found", async () => {
			await expect(getWithAuth("/test")).rejects.toThrow("No authentication token found.",
			);
		});

		it("should retry a failed GET request up to 3 times", async () => {
			const mockError = new Error("Network error");
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch.mockRejectedValue(mockError);

			await expect(getWithAuth("/test")).rejects.toThrow("Network error");
			expect(mockFetch).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			mockFetch
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => mockData,
				});

			const result = await getWithAuth("/test");

			expect(result).toEqual(mockData);
			expect(mockFetch).toHaveBeenCalledTimes(2);
		});
	});
});