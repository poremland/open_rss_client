import "./setup";
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
import { renderHook, waitFor, act } from "@testing-library/react-native";
import useApi from "../app/components/useApi";
import { api } from "../helpers/api_helper";
import { auth } from "../helpers/auth_helper";

describe("useApi", () => {
	beforeEach(() => {
		mocks.resetAll();
		api.setDeps({
			fetch: mocks.fetchMock as any,
		});
		auth.setDeps({
			alert: { alert: mocks.alertMock } as any,
		});
	});

	it("should handle GET request successfully", async () => {
		const mockData = { message: "GET success" };
		mocks.apiMocks.getWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/test-get"));

		expect(result.current.loading).toBe(false);
		expect(result.current.data).toBeNull();
		expect(result.current.error).toBe("");

		let promise: any;
		act(() => {
			promise = result.current.execute();
		});
		await waitFor(() => expect(result.current.loading).toBe(true));

		await act(async () => {
			await promise;
		});
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(mocks.apiMocks.getWithAuth).toHaveBeenCalledWith("/test-get");
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle POST request with form data successfully", async () => {
		const mockData = { message: "POST success" };
		mocks.apiMocks.postWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("post", "/test-post"));

		let promise: any;
		act(() => {
			promise = result.current.execute({ key: "value" });
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mocks.apiMocks.postWithAuth).toHaveBeenCalledWith(
			"/test-post",
			{ key: "value" },
			"application/x-www-form-urlencoded",
		);
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle POST request with JSON data successfully", async () => {
		const mockData = { message: "JSON POST success" };
		mocks.apiMocks.postWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() =>
			useApi("post", "/test-json-post", {}, "application/json"),
		);

		let promise: any;
		act(() => {
			promise = result.current.execute({ key: "value" });
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(mocks.apiMocks.postWithAuth).toHaveBeenCalledWith(
			"/test-json-post",
			{ key: "value" },
			"application/json",
		);
		expect(result.current.data).toEqual(mockData);
	});

	it("should handle API error", async () => {
		const errorMessage = "Network Error";
		mocks.apiMocks.getWithAuth.mockRejectedValue(new Error(errorMessage));

		const { result } = renderHook(() => useApi("get", "/error-get"));

		let promise: any;
		act(() => {
			promise = result.current.execute();
		});

		await act(async () => {
			try { await promise; } catch (e) {}
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe(errorMessage);
	});

	it("should set initial data", () => {
		const initialData = { initial: "data" };
		const { result } = renderHook(() =>
			useApi("get", "/initial", { initialData }),
		);

		expect(result.current.data).toEqual(initialData);
	});

	it("should return the response from execute", async () => {
		const mockData = { success: true };
		mocks.apiMocks.getWithAuth.mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/execute"));

		let response;
		await act(async () => {
			response = await result.current.execute();
		});

		expect(response).toEqual(mockData);
	});

	it("should call handleSessionExpired when session expires", async () => {
		mocks.apiMocks.getWithAuth.mockRejectedValue(new Error("Session expired"));

		const { result } = renderHook(() => useApi("get", "/expired"));

		await act(async () => {
			try { await result.current.execute(); } catch (e) {}
		});

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(mocks.authMocks.handleSessionExpired).toHaveBeenCalled();
	});
});
