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

import { renderHook, waitFor, act } from "@testing-library/react-native";
import useApi from "../app/components/useApi";
import * as api from "../helpers/api";
import * as auth from "../helpers/auth";
import { useRouter } from "expo-router";

jest.mock("../helpers/api", () => ({
	getWithAuth: jest.fn(),
	postWithAuth: jest.fn(),
}));

jest.mock("../helpers/auth", () => ({
	handleSessionExpired: jest.fn(),
}));

jest.mock("expo-router", () => ({
	useRouter: jest.fn(),
}));

describe("useApi", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("should handle GET request successfully", async () => {
		const mockData = { message: "GET success" };
		(api.getWithAuth as jest.Mock).mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/test-get"));

		expect(result.current.loading).toBe(false);
		expect(result.current.data).toBeNull();
		expect(result.current.error).toBe("");

		let promise;
		act(() => {
			promise = result.current.execute();
		});
		await waitFor(() => expect(result.current.loading).toBe(true)); // Wait for loading state to be true

		await act(async () => {
			await promise;
		});
		await waitFor(() => expect(result.current.loading).toBe(false)); // Wait for loading state to be false
		expect(api.getWithAuth).toHaveBeenCalledWith("/test-get");
		expect(result.current.data).toEqual(mockData);
		expect(result.current.error).toBe("");
	});

	it("should handle POST request with form data successfully", async () => {
		const mockData = { message: "POST success" };
		(api.postWithAuth as jest.Mock).mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("post", "/test-post"));

		let promise;
		act(() => {
			promise = result.current.execute({ key: "value" });
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(api.postWithAuth).toHaveBeenCalledWith(
			"/test-post",
			{ key: "value" },
			"application/x-www-form-urlencoded",
		);
		expect(result.current.data).toEqual(mockData);
		expect(result.current.error).toBe("");
	});

	it("should handle POST request with JSON data successfully", async () => {
		const mockData = { message: "JSON POST success" };
		(api.postWithAuth as jest.Mock).mockResolvedValue(mockData);

		const { result } = renderHook(() =>
			useApi("post", "/test-json-post", {}, "application/json"),
		);

		let promise;
		act(() => {
			promise = result.current.execute({ key: "value" });
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(api.postWithAuth).toHaveBeenCalledWith(
			"/test-json-post",
			{ key: "value" },
			"application/json",
		);
		expect(result.current.data).toEqual(mockData);
		expect(result.current.error).toBe("");
	});

	it("should handle API error", async () => {
		const errorMessage = "Network Error";
		(api.getWithAuth as jest.Mock).mockRejectedValue(
			new Error(errorMessage),
		);

		const { result } = renderHook(() => useApi("get", "/error-get"));

		let promise;
		act(() => {
			promise = result.current.execute({ key: "value" });
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(result.current.data).toBeNull();
		expect(result.current.error).toBe(errorMessage);
		expect(auth.handleSessionExpired).not.toHaveBeenCalled();
	});

	it("should set initial data", () => {
		const initialData = { initial: "data" };
		const { result } = renderHook(() =>
			useApi("get", "/initial", { initialData }),
		);

		expect(result.current.data).toEqual(initialData);
	});

	it("should return the response from execute", async () => {
		const mockData = { message: "GET success" };
		(api.getWithAuth as jest.Mock).mockResolvedValue(mockData);

		const { result } = renderHook(() => useApi("get", "/test-get"));

		let response;
		let promise;
		act(() => {
			promise = result.current.execute();
		});
		await waitFor(() => expect(result.current.loading).toBe(true));
		await act(async () => {
			response = await promise;
		});
		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(response).toEqual(mockData);
	});

	it("should call handleSessionExpired when session expires", async () => {
		const mockRouter = { replace: jest.fn() };
		(useRouter as jest.Mock).mockReturnValue(mockRouter);
		(api.getWithAuth as jest.Mock).mockRejectedValue(
			new Error("Session expired"),
		);

		const { result } = renderHook(() => useApi("get", "/expired-session"));

		let promise;
		act(() => {
			promise = result.current.execute();
		});

		await act(async () => {
			await promise;
		});

		await waitFor(() => expect(result.current.loading).toBe(false));

		expect(auth.handleSessionExpired).toHaveBeenCalledWith(mockRouter);
		expect(result.current.error).toBe("");
		expect(result.current.data).toBeNull();
	});
});