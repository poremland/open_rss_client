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
		fetchMock.mockImplementation(() => Promise.resolve({ 
			ok: true, 
			status: 200,
			headers: {
				get: (name: string) => name.toLowerCase() === "content-type" ? "application/json" : null
			},
			json: async () => ({}),
			text: async () => ""
		}));
		api = new Api();
		api.setDeps({
			storage: asyncStorageMock,
			fetch: fetchMock as any,
			sharing: sharingMock as any,
			haptics: hapticsMock as any,
			platform: { OS: "ios" } as any,
			file: fileSystemMock.File as any,
			paths: fileSystemMock.Paths as any,
			directory: fileSystemMock.Directory as any,
			blob: class { constructor(c: any, o: any) {} } as any,
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
				headers: { get: () => "application/json" },
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

		it("should return text if response is not JSON", async () => {
			const mockText = "not json content";
			let consumed = false;
			const checkConsumed = () => {
				if (consumed) throw new Error("Already read");
				consumed = true;
			};

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: {
				        get: (name: string) => name.toLowerCase() === "content-type" ? "text/plain" : null
				},
				json: async () => { 
				        checkConsumed();
				        throw new Error("Unexpected token 'n', \"not json ...\" is not valid JSON"); 
				},
				text: async () => {
				        checkConsumed();
				        return mockText;
				},
			} as any);

			const result = await api.post("/test", { foo: "bar" });
			expect(result).toBe(mockText);
		});
	});

	describe("postWithAuth", () => {
		it("should make an authenticated POST request with form data", async () => {
			const mockData = { message: "Success" };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: () => "application/json" },
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
				headers: { get: () => "application/json" },
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
				headers: { get: () => "application/json" },
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
				headers: { get: () => "application/json" },
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
				        headers: { get: () => "application/json" },
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
				headers: { get: () => "application/json" },
				json: async () => mockData,
			} as any);

			const result = await api.getWithAuth("/test");

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
				        headers: { get: () => "application/json" },
				        json: async () => mockData,
				} as any);

			const result = await api.getWithAuth("/test");

			expect(result).toEqual(mockData);
			expect(fetchMock).toHaveBeenCalledTimes(2);
		});
	});

	describe("getBlobWithAuth", () => {
		it("should make an authenticated GET request and return a blob", async () => {
			const mockBlob = { size: 100, type: "application/pdf" };
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
			expect(result).toEqual(mockBlob as any);
		});

		it("should throw an error if no auth token is found", async () => {
			await expect(api.getBlobWithAuth("/test")).rejects.toThrow(
				"No authentication token found.",
			);
		});
	});

	describe("exportOpml", () => {
		it("should fetch OPML text and share it on iOS", async () => {
			const mockOpml = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><body></body></opml>';
			await asyncStorageMock.setItem("authToken", "test-token");
			api.setDeps({ platform: { OS: "ios" } as any });

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/x-opml" : null },
				json: async () => { throw new Error("not json"); },
				text: async () => mockOpml,
			} as any);

			await api.exportOpml();

			expect(sharingMock.shareAsync).toHaveBeenCalledWith(
				expect.stringContaining("subscriptions"),
				expect.any(Object)
			);
			expect(hapticsMock.notificationAsync).toHaveBeenCalledWith("success");
		});

		it("should fetch OPML text and save to folder on Android", async () => {
			const mockOpml = '<?xml version="1.0" encoding="UTF-8"?><opml version="2.0"><body></body></opml>';
			await asyncStorageMock.setItem("authToken", "test-token");
			api.setDeps({ platform: { OS: "android" } as any });

			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: (name: string) => name.toLowerCase() === "content-type" ? "text/x-opml" : null },
				json: async () => { throw new Error("not json"); },
				text: async () => mockOpml,
			} as any);

			const mockFile = { write: mock(async () => {}), uri: "file:///mock-saf/file.opml" };
			const mockDirectory = { createFile: mock(() => mockFile) };
			fileSystemMock.Directory.pickDirectoryAsync = mock(async () => mockDirectory);

			await api.exportOpml();

			expect(fileSystemMock.Directory.pickDirectoryAsync).toHaveBeenCalled();
			expect(mockDirectory.createFile).toHaveBeenCalledWith(expect.stringContaining("subscriptions"), "text/x-opml");
			expect(mockFile.write).toHaveBeenCalledWith(mockOpml);
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

		it("should trigger a browser download on web", async () => {
			api.setDeps({
				platform: { OS: "web" } as any,
				blob: class { constructor(c: any, o: any) {} } as any,
			});
			await asyncStorageMock.setItem("authToken", "test-token");
			const mockOpml = "<opml>test</opml>";
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: () => "application/json" },
				json: async () => mockOpml,
				text: async () => mockOpml,
			} as any);

			const mockElement = {
				setAttribute: mock(() => {}),
				style: { display: "" },
				click: mock(() => {}),
			};
			const mockDocument = {
				createElement: mock(() => mockElement),
				body: {
				        appendChild: mock(() => {}),
				        removeChild: mock(() => {}),
				},
			};
			const mockURL = {
				createObjectURL: mock(() => "blob:test"),
				revokeObjectURL: mock(() => {}),
			};

			(globalThis as any).document = mockDocument;
			(globalThis as any).URL = mockURL;

			await api.exportOpml();

			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/feeds/export`, expect.any(Object));
			expect(mockDocument.createElement).toHaveBeenCalledWith("a");
			expect(mockElement.setAttribute).toHaveBeenCalledWith("download", expect.stringContaining(".opml"));
			expect(mockElement.click).toHaveBeenCalled();

			// Clean up
			delete (globalThis as any).document;
			delete (globalThis as any).URL;
		});
	});

	describe("importOpml", () => {
		it("should upload an OPML file and return success", async () => {
			api.setDeps({
				platform: { OS: "ios" } as any,
				blob: class { constructor(c: any, o: any) {} } as any,
			});
			const mockUri = "file:///test.opml";
			const mockResponse = { message: "Import started", count: 10 };
			await asyncStorageMock.setItem("authToken", "test-token");
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: () => "application/json" },
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

		it("should read file and upload on web", async () => {
			const originalFormData = (globalThis as any).FormData;
			(globalThis as any).FormData = class {
				append = mock();
			};
			api.setDeps({
				platform: { OS: "web" } as any,
				blob: class { constructor(c: any, o: any) {} } as any,
			});
			await asyncStorageMock.setItem("authToken", "test-token");
			const mockOpml = "<opml>test</opml>";
			const mockResponse = { message: "Import started", count: 10 };
			
			fetchMock.mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: { get: () => "application/json" },
				json: async () => mockResponse,
			} as any);

			const originalFetch = (globalThis as any).fetch;
			(globalThis as any).fetch = mock(async (url: string) => {
				if (url === "blob:test") {
				        return {
				                text: async () => mockOpml,
				                blob: async () => ({ size: mockOpml.length, type: "text/x-opml" }),
				        };
				}
				return fetchMock(url);
			});

			const result = await api.importOpml<{ message: string; count: number }>("blob:test");

			expect(result).toEqual(mockResponse);
			expect(fetchMock).toHaveBeenCalledWith(`${MOCK_BASE_URL}/feeds/import`, expect.any(Object));
			
			// Clean up
			(globalThis as any).fetch = originalFetch;
			(globalThis as any).FormData = originalFormData;
		});
	});
});
