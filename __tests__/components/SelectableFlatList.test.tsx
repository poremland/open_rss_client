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
import { expect, describe, it, mock, beforeEach } from "bun:test";
import { alertMock } from "../setup";
import React from "react";
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { View, Text } from "react-native";
import SelectableFlatList from "../../components/SelectableFlatList";
import { GestureHandlerRootView } from "react-native-gesture-handler";

describe("SelectableFlatList", () => {
	const mockData = [
		{ id: 1, name: "Item 1" },
		{ id: 2, name: "Item 2" },
	];

	const renderItem = ({ item }: { item: any }) => (
		<View>
			<Text>{item.name}</Text>
		</View>
	);

	beforeEach(() => {
		alertMock.mockClear();
	});

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
			/>
		);

		expect(getByText("Item 1")).toBeTruthy();
		expect(getByText("Item 2")).toBeTruthy();
	});

	it("should call onItemPress when an item is pressed", () => {
		const onItemPress = mock();
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={false}
				onSelectionChange={() => {}}
				selectedItems={[]}
				onItemPress={onItemPress}
			/>
		);

		fireEvent.press(getByText("Item 1"));
		expect(onItemPress).toHaveBeenCalledWith(mockData[0]);
	});

	it("should call onItemPress when an item is pressed (with swipe enabled)", () => {
		const onItemPress = mock();
		const { getByText } = render(
			<SelectableFlatList
				data={mockData}
				renderItem={renderItem}
				onRefresh={() => {}}
				refreshing={false}
				multiSelectActive={false}
				onSelectionChange={() => {}}
				selectedItems={[]}
				onItemPress={onItemPress}
				swipeEnabled={true}
			/>
		);

		fireEvent.press(getByText("Item 1"));
		expect(onItemPress).toHaveBeenCalledWith(mockData[0]);
	});

	it("should enter multi-select mode on long press", () => {
		const onSelectionChange = mock();
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
			/>
		);

		fireEvent(getByText("Item 1"), "onLongPress");
		expect(onSelectionChange).toHaveBeenCalledWith([1]);
	});

	it("should select and deselect items in multi-select mode", () => {
		const onSelectionChange = mock();
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
			/>
		);

		// Deselect item 1
		fireEvent.press(getByText("Item 1"));
		expect(onSelectionChange).toHaveBeenCalledWith([]);

		// Select item 2
		fireEvent.press(getByText("Item 2"));
		expect(onSelectionChange).toHaveBeenCalledWith([1, 2]);
	});

	it("should not call onSwipeAction when swipe threshold is not met", () => {
		const onSwipeAction = mock();
		const { getAllByTestId } = render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
				/>
			</GestureHandlerRootView>
		);

		const handlers = getAllByTestId("pan-gesture-handler");
		const handler = handlers[0];

		(handler as any).props.simulateSwipe(-10);

		expect(onSwipeAction).not.toHaveBeenCalled();
	});

	it("should call onSwipeAction when swipe threshold is met", () => {
		const onSwipeAction = mock();
		const { getAllByTestId } = render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
				/>
			</GestureHandlerRootView>
		);

		const handlers = getAllByTestId("pan-gesture-handler");
		const handler = handlers[0];

		(handler as any).props.simulateSwipe(-500);

		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("should show a confirmation dialog if confirmation is set", async () => {
		const onSwipeAction = mock();
		const { getAllByTestId } = render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={true}
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>
		);

		const handlers = getAllByTestId("pan-gesture-handler");
		const handler = handlers[0];

		(handler as any).props.simulateSwipe(-500);

		await waitFor(() => {
			expect(alertMock).toHaveBeenCalledWith(
				"Confirm Action",
				"Confirm delete?",
				expect.any(Array),
				expect.any(Object)
			);
		});
	});

	it("should execute action when confirmed", async () => {
		let called = false;
		const onSwipeAction = mock(() => { called = true; });
		
		const { getAllByTestId } = render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={true}
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>
		);

		const handlers = getAllByTestId("pan-gesture-handler");
		const handler = handlers[0];

		(handler as any).props.simulateSwipe(-500);

		await waitFor(() => expect(alertMock).toHaveBeenCalled());
		const buttons = alertMock.mock.calls[0][2];
		const yesButton = buttons.find((b: any) => b.text === "Yes");
		
		await act(async () => {
			yesButton.onPress();
		});
		
		await waitFor(() => expect(called).toBe(true));
		expect(onSwipeAction).toHaveBeenCalled();
	});

	it("if confirmation is set on the SelectableFlatList the action is not executed if canceled", async () => {
		const onSwipeAction = mock();
		const { getAllByTestId } = render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={true}
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>
		);

		const handlers = getAllByTestId("pan-gesture-handler");
		const handler = handlers[0];

		(handler as any).props.simulateSwipe(-500);

		await waitFor(() => expect(alertMock).toHaveBeenCalled());
		const buttons = alertMock.mock.calls[0][2];
		const noButton = buttons.find((b: any) => b.text === "No");
		
		await act(async () => {
			noButton.onPress();
		});
		expect(onSwipeAction).toHaveBeenCalledTimes(0);
	});
});
