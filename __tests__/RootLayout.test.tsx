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
import { render, waitFor } from "@testing-library/react-native";
import RootLayout from "../app/_layout";
import * as SplashScreen from "expo-splash-screen";
import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test";
import { mocks } from "./setup";
import * as authHelper from "../helpers/auth_helper";
import * as backgroundSync from "../helpers/background_sync";

describe("RootLayout", () => {
	beforeEach(() => {
		mocks.resetAll();
	});

	it("should call SplashScreen.preventAutoHideAsync", () => {
		render(<RootLayout />);
		expect(SplashScreen.preventAutoHideAsync).toHaveBeenCalled();
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
			expect(SplashScreen.hideAsync).toHaveBeenCalled();
		});
	});

	it("should hide splash screen even if initialization fails", async () => {
		const refreshTokenSpy = spyOn(authHelper, "refreshTokenOnLoad").mockRejectedValue(new Error("Token refresh failed"));
		const proactiveFetchSpy = spyOn(backgroundSync, "performProactiveFetch");
		
		render(<RootLayout />);
		
		await waitFor(() => {
			expect(SplashScreen.hideAsync).toHaveBeenCalled();
		});
		
		refreshTokenSpy.mockRestore();
	});
});
