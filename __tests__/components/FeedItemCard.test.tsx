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
import React from "react";
import { expect, describe, it, mock, beforeEach } from "bun:test";
import { render, fireEvent } from "@testing-library/react-native";
import FeedItemCard from "../../components/FeedItemCard";

describe("FeedItemCard", () => {
	beforeEach(() => {
		setup.resetAll();
	});

	const mockItem: any = {
		id: 1,
		title: "Test Title",
		link: "http://example.com",
		description:
			'<p>Test Description</p><img src="http://example.com/image.jpg" />',
		url: "http://example.com",
		feed_id: 1,
		created_on_time: 0,
		status: "unread",
	};

	it("renders the title, link, and description", () => {
		const { getByText } = render(
			<FeedItemCard
				item={mockItem}
				onPress={() => {}}
				onLongPress={() => {}}
				isItemSelected={false}
			/>,
		);

		expect(getByText("Test Title")).toBeTruthy();
		expect(getByText("http://example.com")).toBeTruthy();
		expect(getByText("Test Description")).toBeTruthy();
	});

	it("calls onPress when pressed", () => {
		const onPress = mock();
		const { getByTestId } = render(
			<FeedItemCard
				item={mockItem}
				onPress={onPress}
				onLongPress={() => {}}
				isItemSelected={false}
			/>,
		);

		fireEvent.press(getByTestId("feed-item-1"));
		expect(onPress).toHaveBeenCalled();
	});

	it("calls onLongPress when long-pressed", () => {
		const onLongPress = mock();
		const { getByTestId } = render(
			<FeedItemCard
				item={mockItem}
				onPress={() => {}}
				onLongPress={onLongPress}
				isItemSelected={false}
			/>,
		);

		fireEvent(getByTestId("feed-item-1"), "longPress");
		expect(onLongPress).toHaveBeenCalled();
	});

	it("extracts and displays an image from the description", () => {
		const { getByTestId } = render(
			<FeedItemCard
				item={mockItem}
				onPress={() => {}}
				onLongPress={() => {}}
				isItemSelected={false}
			/>,
		);

		const image = getByTestId("feed-item-image");
		expect(image.props.source.uri).toBe("http://example.com/image.jpg");
	});

	it("does not display an image if there is no image in the description", () => {
		const itemWithoutImage: any = {
			...mockItem,
			description: "<p>No image here</p>",
		};
		const { queryByTestId } = render(
			<FeedItemCard
				item={itemWithoutImage}
				onPress={() => {}}
				onLongPress={() => {}}
				isItemSelected={false}
			/>,
		);

		expect(queryByTestId("feed-item-image")).toBeNull();
	});

	it("applies the selected style when isItemSelected is true", () => {
		const { getByTestId } = render(
			<FeedItemCard
				item={mockItem}
				onPress={() => {}}
				onLongPress={() => {}}
				isItemSelected={true}
			/>,
		);

		const card = getByTestId("feed-item-1");
		const { StyleSheet } = require("react-native");
		const style = StyleSheet.flatten(card.props.style);
		expect(style.backgroundColor).toBe("lightblue");
	});

	it("decodes HTML entities in the title and description", () => {
		const mockItemWithEntities: any = {
			...mockItem,
			title: "Test&#39;s Title &amp; More",
			description: "<p>Test&#39;s Description &amp; More</p>",
		};
		const { getByText } = render(
			<FeedItemCard
				item={mockItemWithEntities}
				onPress={() => {}}
				onLongPress={() => {}}
				isItemSelected={false}
			/>,
		);

		expect(getByText("Test's Title & More")).toBeTruthy();
		expect(getByText("Test's Description & More")).toBeTruthy();
	});
});
