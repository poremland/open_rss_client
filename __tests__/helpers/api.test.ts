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
import { Api } from "../../helpers/api_helper.impl";
import { resetAll, asyncStorageMock, fetchMock, fileSystemMock, sharingMock, hapticsMock } from "../mocks";

describe("API Helper", () => {
	const MOCK_BASE_URL = "http://localhost:3000";
	let api: Api;

	beforeEach(async () => {
		resetAll();
		api = new Api();
		api.setDeps({
			storage: asyncStorageMock,
			fetch: fetchMock as any,
			fileSystem: fileSystemMock as any,
			sharing: sharingMock as any,
			haptics: hapticsMock as any,
		});
		await asyncStorageMock.setItem("serverUrl", MOCK_BASE_URL);
		fetchMock.mockClear();
		fileSystemMock.writeAsStringAsync.mockClear();
		sharingMock.shareAsync.mockClear();
		hapticsMock.notificationAsync.mockClear();
	});

	describe("post", () => {
		it("should make a POST request and return JSON data", async () => {
			const mockData = { message: "Success" };
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.post("/test", { foo: "bar" });

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => "Internal Server Error",
			} as any);

			await expect(api.post("/test", { foo: "bar" })).rejects.toThrow(
				"Request failed with status 500: Internal Server Error",
			);
		});

		it("should throw 'Session expired' error if status is 401", async () => {
			fetchMock.mockResolvedValueOnce({
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
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.postWithAuth("/test", { foo: "bar" });

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.postWithAuth(
				"/test",
				{ foo: "bar" },
				"application/json",
			);

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.get("/test");

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {},
			});
			expect(result).toEqual(mockData);
		});

		it("should make a GET request with auth if token exists", async () => {
			const mockData = { message: "Success" };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.get("/test");

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			fetchMock.mockRejectedValue(mockError);

			await expect(api.get("/test")).rejects.toThrow("Network error");
			expect(fetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			fetchMock
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockData,
				} as any);

			const result = await api.get("/test");

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("getWithAuth", () => {
		it("should make an authenticated GET request", async () => {
			const mockData = { message: "Success" };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				json: async () => mockData,
			} as any);

			const result = await api.getWithAuth("/test");

			const authToken = "test-token";
			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockRejectedValue(mockError);

			await expect(api.getWithAuth("/test")).rejects.toThrow("Network error");
			expect(fetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock
				.mockRejectedValueOnce(new Error("Network error"))
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => mockData,
				} as any);

			const result = await api.getWithAuth("/test");

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("getBlobWithAuth", () => {
		it("should make an authenticated GET request and return a blob", async () => {
			const mockBlob = { size: 1024, type: "text/x-opml" };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				blob: async () => mockBlob,
			} as any);

			const result = await api.getBlobWithAuth("/test");

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
				},
			});
			expect(result).toEqual(mockBlob);
		});

		it("should throw an error if no auth token is found", async () => {
			await expect(api.getBlobWithAuth("/test")).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("exportOpml", () => {
		it("should fetch OPML blob, save to file, and share it", async () => {
			const mockOpml = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><body></body></opml>';
			const mockBlob = { 
				size: mockOpml.length, 
				type: "text/x-opml",
				text: async () => mockOpml
			};
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				blob: async () => mockBlob,
			} as any);

			await api.exportOpml();

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/feeds/export`, {
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
				},
			});
			expect(fileSystemMock.writeAsStringAsync).toHaveBeenCalledWith(
				expect.stringContaining("subscriptions"),
				mockOpml
			);
			expect(sharingMock.shareAsync).toHaveBeenCalled();
			expect(hapticsMock.notificationAsync).toHaveBeenCalledWith("success");
		});

		it("should throw an error if export fails", async () => {
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 500,
				text: async () => "Internal Server Error",
			} as any);

			await expect(api.exportOpml()).rejects.toThrow("Request failed with status 500: Internal Server Error");
		});
	});

	describe("importOpml", () => {
		it("should upload an OPML file and return success", async () => {
			const mockUri = "file:///test.opml";
			const mockResponse = { message: "Import started", count: 10 };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 202,
				json: async () => mockResponse,
			} as any);

			const result = await api.importOpml(mockUri);

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/feeds/import`, {
				method: "POST",
				headers: {
					Authorization: "Bearer test-token",
					"Accept": "application/json",
				},
				body: expect.any(FormData),
			});

			const formData = fetchMock.mock.calls[0][1].body as FormData;
			// FormData inspection is tricky in some environments, but we can check if append was likely called
			expect(result).toEqual(mockResponse);
			expect(hapticsMock.notificationAsync).toHaveBeenCalledWith("success");
		});

		it("should throw an error if import fails", async () => {
			const mockUri = "file:///test.opml";
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: false,
				status: 422,
				text: async () => JSON.stringify({ error: "No valid feeds found" }),
			} as any);

			await expect(api.importOpml(mockUri)).rejects.toThrow("Request failed with status 422");
		});
	});
});
