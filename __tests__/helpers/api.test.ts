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
import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { Api } from "../../helpers/api_helper.impl";
import { mocks } from "../setup";

const sharingMock = mocks.sharing;
const fileSystemMock = mocks.fileSystem;
const asyncStorageMock = mocks.asyncStorageMock;
const storageMap = mocks.storageMap;
const createFetchResponse = mocks.createFetchResponse;

const MOCK_BASE_URL = "http://localhost:3000";

describe("API Helper", () => {
	let api: Api;
	let localFetchMock: any;

	beforeEach(async () => {
		(globalThis as any).__disableApiMock = true;
		storageMap.clear();
		
		// Use a locally created fetch mock for ultimate isolation
		localFetchMock = mock(() => Promise.resolve(createFetchResponse(true, 200, {})));
		
		sharingMock.shareAsync.mockClear();
		if (fileSystemMock.StorageAccessFramework) {
			Object.values(fileSystemMock.StorageAccessFramework).forEach((fn: any) => fn.mockClear && fn.mockClear());
		}

		// Explicitly inject mocked storage AND local fetch
		api = new Api({ storage: asyncStorageMock, fetch: localFetchMock });
		await asyncStorageMock.setItem("serverUrl", MOCK_BASE_URL);
		await asyncStorageMock.setItem("authToken", "test-token");
	});

	afterEach(() => {
		(globalThis as any).__disableApiMock = false;
		delete (globalThis as any).window;
		delete (globalThis as any).document;
		delete (globalThis as any).URL;
	});

	describe("getBaseUrl", () => {
		it("should return the server URL from storage", async () => {
			const baseUrl = await api.getBaseUrl();
			expect(baseUrl).toBe(MOCK_BASE_URL);
		});
	});

	describe("post", () => {
		it("should make a POST request and return JSON data", async () => {
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.post("/test", { foo: "bar" });

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			localFetchMock.mockResolvedValue(createFetchResponse(false, 500, "Internal Server Error", "text/plain"));

			await expect(api.post("/test", { foo: "bar" })).rejects.toThrow(
				"Request failed with status 500: Internal Server Error",
			);
		});

		it("should throw 'Session expired' error if status is 401", async () => {
			localFetchMock.mockResolvedValue(createFetchResponse(false, 401, "Unauthorized", "text/plain"));

			await expect(api.post("/test", { foo: "bar" })).rejects.toThrow(
				"Session expired",
			);
		});

		it("should support JSON content type", async () => {
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			await api.post("/test", { foo: "bar" }, "application/json");

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify({ foo: "bar" }),
			});
		});

		it("should return text if response is not JSON", async () => {
			const mockText = "not json content";
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockText, "text/plain"));

			const result = await api.post("/test", { foo: "bar" });
			expect(result).toBe(mockText);
		});
	});

	describe("postWithAuth", () => {
		it("should make an authenticated POST request with form data", async () => {
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.postWithAuth("/test", { foo: "bar" });

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.postWithAuth(
				"/test",
				{ foo: "bar" },
				"application/json",
			);

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: "Bearer test-token",
				},
				body: '{"foo":"bar"}',
			});
			expect(result).toEqual(mockData);
		});

		it("should throw an error if no auth token is found", async () => {
			await asyncStorageMock.removeItem("authToken");
			await expect(api.postWithAuth("/test", { foo: "bar" })).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("get", () => {
		it("should make a GET request without auth", async () => {
			await asyncStorageMock.removeItem("authToken");
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.get("/test");

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {},
			});
			expect(result).toEqual(mockData);
		});

		it("should make a GET request with auth if token exists", async () => {
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.get("/test");

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
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
			localFetchMock.mockRejectedValue(mockError);

			await expect(api.get("/test")).rejects.toThrow("Network error");
			expect(localFetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			localFetchMock
				.mockRejectedValueOnce(new Error("Fail 1"))
				.mockRejectedValueOnce(new Error("Fail 2"))
				.mockResolvedValueOnce(createFetchResponse(true, 200, mockData));

			const result = await api.get("/test");

			expect(result).toEqual(mockData);
			expect(localFetchMock).toHaveBeenCalledTimes(3);
		});
	});

	describe("getWithAuth", () => {
		it("should make an authenticated GET request", async () => {
			const mockData = { success: true };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockData));

			const result = await api.getWithAuth("/test");

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
					"Content-Type": "application/json",
					Accept: "application/json",
				},
			});
			expect(result).toEqual(mockData);
		});

		it("should throw an error if no auth token is found", async () => {
			await asyncStorageMock.removeItem("authToken");
			await expect(api.getWithAuth("/test")).rejects.toThrow(
				"No authentication token found.",
			);
		});

		it("should retry a failed GET request up to 3 times", async () => {
			const mockError = new Error("Network error");
			await asyncStorageMock.setItem("authToken", "test-token");
			localFetchMock.mockRejectedValue(mockError);

			await expect(api.getWithAuth("/test")).rejects.toThrow("Network error");
			expect(localFetchMock).toHaveBeenCalledTimes(3);
		});

		it("should succeed if one of the retry attempts is successful", async () => {
			const mockData = { message: "Success" };
			localFetchMock
				.mockRejectedValueOnce(new Error("Fail 1"))
				.mockRejectedValueOnce(new Error("Fail 2"))
				.mockResolvedValueOnce(createFetchResponse(true, 200, mockData));

			const result = await api.getWithAuth("/test");

			expect(result).toEqual(mockData);
			expect(localFetchMock).toHaveBeenCalledTimes(3);
		});
	});

	describe("getBlobWithAuth", () => {
		it("should make an authenticated GET request and return a blob", async () => {
			const mockBlob = new Blob(['test'], { type: 'image/png' });
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockBlob));

			const result = await api.getBlobWithAuth("/test");

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/test`, {
				method: "GET",
				headers: {
					Authorization: "Bearer test-token",
				},
			});
			expect(result).toEqual(mockBlob as any);
		});

		it("should throw an error if no auth token is found", async () => {
			await asyncStorageMock.removeItem("authToken");
			await expect(api.getBlobWithAuth("/test")).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("exportOpml", () => {
		const mockOpml = "<opml>test</opml>";

		it("should fetch OPML text and share it on iOS", async () => {
			const RN = require("react-native");
			RN.Platform.OS = "ios";

			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockOpml, "text/plain"));

			await api.exportOpml();

			expect(sharingMock.shareAsync).toHaveBeenCalledWith(
				expect.stringContaining("subscriptions")
			);
		});

		it("should fetch OPML text and save to folder on Android", async () => {
			const RN = require("react-native");
			RN.Platform.OS = "android";

			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockOpml, "text/plain"));

			await api.exportOpml();

			expect(fileSystemMock.StorageAccessFramework.requestDirectoryPermissionsAsync).toHaveBeenCalled();
		});

		it("should throw an error if export fails", async () => {
			localFetchMock.mockResolvedValue(createFetchResponse(false, 500, "Internal Server Error", "text/plain"));

			await expect(api.exportOpml()).rejects.toThrow(
				"Request failed with status 500: Internal Server Error",
			);
		});

		it("should trigger a browser download on web", async () => {
			const RN = require("react-native");
			RN.Platform.OS = "web";

			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockOpml, "text/plain"));

			const mockElement = {
				click: mock(),
				setAttribute: mock(),
				style: {},
			};
			(globalThis as any).document = {
				createElement: mock(() => mockElement),
			};
			(globalThis as any).window = {
				URL: {
					createObjectURL: mock(() => "blob:test"),
					revokeObjectURL: mock(),
				}
			};
			(globalThis as any).URL = (globalThis as any).window.URL;

			await api.exportOpml();

			expect(localFetchMock).toHaveBeenCalledWith(
				`${MOCK_BASE_URL}/feeds/export`,
				expect.any(Object)
			);
		});
	});

	describe("importOpml", () => {
		const mockUri = "file:///test.opml";

		it("should upload an OPML file and return success", async () => {
			const mockResponse = { message: "Import started" };
			localFetchMock.mockResolvedValue(createFetchResponse(true, 200, mockResponse));

			const result = await api.importOpml(mockUri);

			expect(localFetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/feeds/import`, {
				method: "POST",
				headers: {
					Authorization: "Bearer test-token",
					Accept: "application/json",
				},
				body: expect.any(Object),
			});
			expect(result).toEqual(mockResponse);
		});

		it("should throw an error if import fails", async () => {
			localFetchMock.mockResolvedValue(createFetchResponse(false, 422, JSON.stringify({ error: "No valid feeds found" }), "application/json"));

			await expect(api.importOpml(mockUri)).rejects.toThrow(
				"Request failed with status 422",
			);
		});

		it("should read file and upload on web", async () => {
			const RN = require("react-native");
			RN.Platform.OS = "web";

			const mockResponse = { message: "Import started", count: 10 };
			const mockBlob = new Blob(['test'], { type: 'text/xml' });

			localFetchMock.mockImplementation(async (url: string) => {
				if (url === "blob:test") {
					return createFetchResponse(true, 200, mockBlob);
				}
				return createFetchResponse(true, 200, mockResponse);
			});

			const result = await api.importOpml<{ message: string; count: number }>(
				"blob:test",
			);

			expect(result).toEqual(mockResponse);
		});
	});
});
