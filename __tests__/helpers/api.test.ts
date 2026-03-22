import "../setup";
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
import "../setup";

import * as setup from "../setup";
import { expect, describe, it, beforeEach } from "bun:test";
import { api } from "../../helpers/api_helper";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe("API Helper", () => {
	const MOCK_BASE_URL = "http://localhost:3000";

	beforeEach(async () => {
		setup.resetAll();
		api.setDeps({
			storage: AsyncStorage,
			fetch: setup.fetchMock as any,
		});
		await AsyncStorage.setItem("serverUrl", MOCK_BASE_URL);
	});

	describe("post", () => {
		it("should make a POST request and return JSON data", async () => {
			const mockData = { message: "Success" };
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.post("/test", { foo: "bar" });

			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			setup.fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => "Internal Server Error",
			} as any);

			await expect(api.post("/test", { foo: "bar" })).rejects.toThrow(
				"Request failed with status 500: Internal Server Error",
			);
		});

		it("should throw 'Session expired' error if status is 401", async () => {
			setup.fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 401,
				text: async () => "Unauthorized",
			} as any);

			await expect(api.post("/test", { foo: "bar" })).rejects.toThrow(
				"Session expired",
			);
		});
	});

	describe("postWithAuth", () => {
		it("should make an authenticated POST request with form data", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.postWithAuth("/test", { foo: "bar" });

			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.postWithAuth(
				"/test",
				{ foo: "bar" },
				"application/json",
			);

			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			await expect(api.postWithAuth("/test", { foo: "bar" })).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("get", () => {
		it("should make a GET request without auth", async () => {
			const mockData = { message: "Success" };
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.get("/test");

			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {},
			});
			expect(result).toEqual(mockData);
		});

		it("should make a GET request with auth if token exists", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.get("/test");

			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			setup.fetchMock.mockRejectedValue(mockError);

			await expect(api.get("/test")).rejects.toThrow("Network error");
			expect(setup.fetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			setup.fetchMock
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockData,
				} as any);

			const result = await api.get("/test");

			expect(result).toEqual(mockData);
			expect(setup.fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("getWithAuth", () => {
		it("should make an authenticated GET request", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			setup.fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.getWithAuth("/test");

			const authToken = "test-token";
			expect(setup.fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			await expect(api.getWithAuth("/test")).rejects.toThrow(
				"No authentication token found.",
			);
		});

		it("should retry a failed GET request up to 3 times", async () => {
			const mockError = new Error("Network error");
			await AsyncStorage.setItem("authToken", "test-token");
			setup.fetchMock.mockRejectedValue(mockError);

			await expect(api.getWithAuth("/test")).rejects.toThrow("Network error");
			expect(setup.fetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			await AsyncStorage.setItem("authToken", "test-token");
			setup.fetchMock
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockData,
				} as any);

			const result = await api.getWithAuth("/test");

			expect(result).toEqual(mockData);
			expect(setup.fetchMock).toHaveBeenCalledTimes(2);
		});
	});
});
