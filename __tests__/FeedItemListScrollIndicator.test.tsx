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
import React, { act } from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import FeedItemListScreen from "../app/FeedItemListScreen";

describe("FeedItemListScreen - Scroll Progress Indicator", () => {
	const mockFeed = { id: 1, name: "Test Feed" };
	const mockFeedItems = [
		{ id: 1, feed_id: 1, title: "Item 1", link: "http://test.com/1", description: "Desc 1" },
		{ id: 2, feed_id: 1, title: "Item 2", link: "http://test.com/2", description: "Desc 2" },
		{ id: 3, feed_id: 1, title: "Item 3", link: "http://test.com/3", description: "Desc 3" },
	];

	beforeEach(() => {
		mocks.resetAll();
		mocks.api.getWithAuth.mockResolvedValue(mockFeedItems);
		mocks.localSearchParams.mockReturnValue({ feed: JSON.stringify(mockFeed) });
	});

	it("should disable native vertical scroll indicator on mobile", async () => {
		const { Platform } = require("react-native");
		const originalPlatform = Platform.OS;
		Platform.OS = "ios";

		const { getByTestId } = render(<FeedItemListScreen />);

		await waitFor(() => {
			const list = getByTestId("selectable-flat-list");
			expect(list.props.showsVerticalScrollIndicator).toBe(false);
		});

		Platform.OS = originalPlatform;
	});

	it("should render native progress bar on mobile and update accurately on scroll", async () => {
		const { Platform } = require("react-native");
		const originalPlatform = Platform.OS;
		Platform.OS = "ios";

		const { getByTestId, UNSAFE_getAllByType } = render(<FeedItemListScreen />);
		const { View } = require("react-native");

		await waitFor(() => {
			const list = getByTestId("selectable-flat-list");
			const views = UNSAFE_getAllByType(View);
			const progressBar = views.find(v => v.props.style && v.props.style[1] && v.props.style[1].width !== undefined);
			expect(progressBar).toBeTruthy();
			expect(progressBar?.props.style[1].width).toBe("0%");

			// 1. Simulate scroll to 25%
			act(() => {
				list.props.onScroll({
					nativeEvent: {
						contentOffset: { y: 25 },
						contentSize: { height: 200 },
						layoutMeasurement: { height: 100 }
					}
				});
			});
			expect(progressBar?.props.style[1].width).toBe("25%");

			// 2. Simulate scroll to 75%
			act(() => {
				list.props.onScroll({
					nativeEvent: {
						contentOffset: { y: 75 },
						contentSize: { height: 200 },
						layoutMeasurement: { height: 100 }
					}
				});
			});
			expect(progressBar?.props.style[1].width).toBe("75%");

			// 3. Simulate scroll to bottom (100%)
			act(() => {
				list.props.onScroll({
					nativeEvent: {
						contentOffset: { y: 100 },
						contentSize: { height: 200 },
						layoutMeasurement: { height: 100 }
					}
				});
			});
			expect(progressBar?.props.style[1].width).toBe("100%");

			// 4. Test boundary (negative scroll)
			act(() => {
				list.props.onScroll({
					nativeEvent: {
						contentOffset: { y: -10 },
						contentSize: { height: 200 },
						layoutMeasurement: { height: 100 }
					}
				});
			});
			expect(progressBar?.props.style[1].width).toBe("0%");
		});

		Platform.OS = originalPlatform;
	});

	it("should NOT render native progress bar on web", async () => {
		const { Platform } = require("react-native");
		const originalPlatform = Platform.OS;
		Platform.OS = "web";

		const { getByTestId, UNSAFE_getAllByType } = render(<FeedItemListScreen />);
		const { View } = require("react-native");

		await waitFor(() => {
			const list = getByTestId("selectable-flat-list");
			// Native vertical scroll indicator should remain enabled on Web
			expect(list.props.showsVerticalScrollIndicator).toBe(true);

			const views = UNSAFE_getAllByType(View);
			// On web, there should be no View with a width percentage style related to scroll progress
			const progressBar = views.find(v => v.props.style && v.props.style[1] && typeof v.props.style[1].width === 'string' && v.props.style[1].width.endsWith('%'));
			expect(progressBar).toBeFalsy();
		});

		Platform.OS = originalPlatform;
	});
});
