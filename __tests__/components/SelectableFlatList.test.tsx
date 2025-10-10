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
import { render, fireEvent } from "@testing-library/react-native";
import SelectableFlatList from "../../app/components/SelectableFlatList";
import { TouchableOpacity, Text } from "react-native";

const mockData = [
	{ id: 1, name: "Item 1" },
	{ id: 2, name: "Item 2" },
	{ id: 3, name: "Item 3" },
];

describe("SelectableFlatList", () => {
	const renderItem = ({ item, onPress, onLongPress }) => (
		<TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
			<Text>{item.name}</Text>
		</TouchableOpacity>
	);

	it("should render a list of items", () => {
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={false}
				onSelectionChange={() => {}}
				selectedItems={[]}
				onItemPress={() => {}}
			/>,
		);

		expect(getByText("Item 1")).toBeTruthy();
		expect(getByText("Item 2")).toBeTruthy();
		expect(getByText("Item 3")).toBeTruthy();
	});

	it("should call onItemPress when an item is pressed", () => {
		const onItemPress = jest.fn();
		const onSelectionChange = jest.fn(); // Add this line
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={false}
				onSelectionChange={onSelectionChange}
				selectedItems={[]}
				onItemPress={onItemPress}
			/>,
		);

		fireEvent.press(getByText("Item 1"));
		expect(onItemPress).toHaveBeenCalledWith(mockData[0]);
	});

	it("should enter multi-select mode on long press", () => {
		const onSelectionChange = jest.fn();
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={false}
				onSelectionChange={onSelectionChange}
				selectedItems={[]}
				onItemPress={() => {}}
			/>,
		);

		fireEvent(getByText("Item 1"), "longPress");
		expect(onSelectionChange).toHaveBeenCalledWith([1]);
	});

	it("should select and deselect items in multi-select mode", () => {
		const onSelectionChange = jest.fn();
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={true}
				onSelectionChange={onSelectionChange}
				selectedItems={[1]}
				onItemPress={() => {}}
			/>,
		);

		fireEvent.press(getByText("Item 2"));
		expect(onSelectionChange).toHaveBeenCalledWith([1, 2]);

		fireEvent.press(getByText("Item 1"));
		expect(onSelectionChange).toHaveBeenCalledWith([]);
	});
});