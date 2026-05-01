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

import React from "react";
import { render, waitFor, act } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
import * as SplashScreen from "expo-splash-screen";
import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { mocks } from "./setup";
import * as authHelper from "../helpers/auth_helper";
import * as backgroundSync from "../helpers/background_sync";

describe("RootLayout", () => {
	let consoleSpy: any;

	beforeEach(() => {
		mocks.resetAll();
		consoleSpy = spyOn(console, "error").mockImplementation((msg) => {
			if (msg && typeof msg === 'string') {
				if (msg.includes("was not wrapped in act")) return;
				if (msg.includes("react-test-renderer is deprecated")) return;
				if (msg.includes("Initialization failed")) return;
			}
			console.log("Console error:", msg);
		});
	});

	afterEach(() => {
		consoleSpy.mockRestore();
	});

	it("should call SplashScreen.preventAutoHideAsync", async () => {
		render(<RootLayout />);
		expect(mocks.splashScreen.preventAutoHideAsync).toHaveBeenCalled();
	});

	it("should perform initialization sequence", async () => {
		const refreshTokenSpy = spyOn(authHelper, "refreshTokenOnLoad");
		const proactiveFetchSpy = spyOn(backgroundSync, "performProactiveFetch");
		
		render(<RootLayout />);
		
		await waitFor(() => {
			expect(refreshTokenSpy).toHaveBeenCalled();
			expect(proactiveFetchSpy).toHaveBeenCalled();
		});
	});

	it("should hide splash screen when initialization is complete", async () => {
		render(<RootLayout />);
		
		await waitFor(() => {
			expect(mocks.splashScreen.hideAsync).toHaveBeenCalled();
		});
	});

	it("should hide splash screen even if initialization fails", async () => {
		const refreshTokenSpy = spyOn(authHelper, "refreshTokenOnLoad").mockRejectedValue(new Error("Token refresh failed"));
		const proactiveFetchSpy = spyOn(backgroundSync, "performProactiveFetch");
		
		render(<RootLayout />);
		
		await waitFor(() => {
			expect(mocks.splashScreen.hideAsync).toHaveBeenCalled();
		});
		
		refreshTokenSpy.mockRestore();
	});

	it("should NOT hide splash screen until initialization is complete (simulated slow connection)", async () => {
		let resolveInit: any;
		const initPromise = new Promise((resolve) => { resolveInit = resolve; });
		const refreshTokenSpy = spyOn(authHelper, "refreshTokenOnLoad").mockReturnValue(initPromise as any);
		
		render(<RootLayout />);
		
		// Wait a bit to ensure it hasn't hidden yet
		await new Promise(r => setTimeout(r, 100));
		expect(mocks.splashScreen.hideAsync).not.toHaveBeenCalled();
		
		// Resolve the promise
		await act(async () => {
			resolveInit();
		});
		
		await waitFor(() => {
			expect(mocks.splashScreen.hideAsync).toHaveBeenCalled();
		});
		
		refreshTokenSpy.mockRestore();
	});
});
