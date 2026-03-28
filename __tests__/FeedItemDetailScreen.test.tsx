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
import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import FeedItemDetailScreen from "../app/FeedItemDetailScreen";

describe("FeedItemDetailScreen", () => {
	const mockFeedItem = {
		id: 1,
		title: "Test Item",
		link: "http://test.com/1",
		description: "Test Desc",
	};

	beforeEach(() => {
		mocks.resetAll();
		mocks.localSearchParams.params = { feedItemId: "1" };
	});

	it("should display feed item details (via header title)", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		render(<FeedItemDetailScreen />);

		await waitFor(() => {
			expect(mocks.navigation.setOptions).toHaveBeenCalledWith(
				expect.objectContaining({
					headerTitle: "Test Item",
				}),
			);
		});
	});

	it("should apply webViewContainer style", async () => {
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItem);

		const { getByTestId } = render(<FeedItemDetailScreen />);

		await waitFor(() => {
			const webViewContainer = getByTestId("webViewContainer");
			expect(webViewContainer).toBeTruthy();
		});
	});
});
