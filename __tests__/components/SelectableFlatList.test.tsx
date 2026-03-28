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
import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";

let triggerSwipeActionFn: any;
let triggerSwipeActionNotMetThresholdFn: any;

const mockListItemInternal = ({ item, renderItem, onPress, onLongPress, isItemSelected, swipeEnabled, onSwipeAction, swipeActionRequiresConfirmation, swipeConfirmationMessage }: any) => {
	const React = require("react");
	const { View } = require("react-native");

	triggerSwipeActionFn = () => {
		if (swipeActionRequiresConfirmation) {
			setup.alertMock(
				"Confirm Action",
				swipeConfirmationMessage,
				[
					{ text: "No", style: "cancel", onPress: () => {} },
					{ text: "Yes", onPress: () => onSwipeAction?.(item) },
				],
				{ cancelable: true, onDismiss: () => {} },
			);
		} else {
			onSwipeAction?.(item);
		}
	};

	triggerSwipeActionNotMetThresholdFn = () => {};

	return React.createElement(View, {}, renderItem({ item, onPress, onLongPress, isItemSelected }));
};

mock.module("../../app/components/SelectableFlatListItem", () => ({
	default: mockListItemInternal,
}));

import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { act } from "react";
import { TouchableOpacity, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import SelectableFlatList from "../../app/components/SelectableFlatList";

const mockData = [
	{ id: 1, name: "Item 1" },
	{ id: 2, name: "Item 2" },
	{ id: 3, name: "Item 3" },
];

describe("SelectableFlatList", () => {
	const renderItem = ({ item, onPress, onLongPress }: any) => (
		<TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
			<Text>{item.name}</Text>
		</TouchableOpacity>
	);

	beforeEach(() => {
		setup.resetAll();
		triggerSwipeActionFn = undefined;
		triggerSwipeActionNotMetThresholdFn = undefined;
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
			/>,
		);

		expect(getByText("Item 1")).toBeTruthy();
		expect(getByText("Item 2")).toBeTruthy();
		expect(getByText("Item 3")).toBeTruthy();
	});

	it("should call onItemPress when an item is pressed", () => {
		const onItemPress = mock();
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
				onItemPress={onItemPress}
			/>,
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
			/>,
		);

		fireEvent(getByText("Item 1"), "longPress");
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
			/>,
		);

		fireEvent.press(getByText("Item 2"));
		expect(onSelectionChange).toHaveBeenCalledWith([1, 2]);

		fireEvent.press(getByText("Item 1"));
		expect(onSelectionChange).toHaveBeenCalledWith([]);
	});

	it("should not call onSwipeAction when swipe threshold is not met", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
				/>
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionNotMetThresholdFn).toBeDefined();

		act(() => {
			triggerSwipeActionNotMetThresholdFn();
		});

		expect(onSwipeAction).not.toHaveBeenCalled();
	});

	it("should call onSwipeAction when swipe threshold is met", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
				/>
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionFn).toBeDefined();

		act(() => {
			triggerSwipeActionFn();
		});

		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("should show a confirmation dialog if confirmation is set", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
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
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionFn).toBeDefined();

		act(() => {
			triggerSwipeActionFn();
		});

		await waitFor(() => {
			expect(setup.alertMock).toHaveBeenCalledWith(
				"Confirm Action",
				"Confirm delete?",
				expect.any(Array),
				expect.any(Object),
			);
		});
		expect(onSwipeAction).not.toHaveBeenCalled();
	});

	it("should not show a confirmation dialog if confirmation is not set", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
					renderItem={renderItem}
					onRefresh={() => {}}
					refreshing={false}
					multiSelectActive={false}
					onSelectionChange={() => {}}
					selectedItems={[]}
					onItemPress={() => {}}
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
				/>
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionFn).toBeDefined();

		act(() => {
			triggerSwipeActionFn();
		});

		await waitFor(() => {
			expect(setup.alertMock).not.toHaveBeenCalled();
		});
		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("if confirmation is set on the SelectableFlatList the action is only called if confirmed", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
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
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionFn).toBeDefined();

		act(() => {
			triggerSwipeActionFn();
		});

		await waitFor(() => {
			expect(setup.alertMock).toHaveBeenCalledTimes(1);
		});

		const alertOptions = setup.alertMock.mock.calls[0][2];
		const confirmButton = alertOptions.find((option: any) => option.text === "Yes");
		expect(confirmButton).toBeDefined();

		act(() => {
			confirmButton.onPress();
		});

		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("if confirmation is set on the SelectableFlatList the action is not executed if canceled", async () => {
		const onSwipeAction = mock();
		render(
			<GestureHandlerRootView>
				<SelectableFlatList
					data={mockData.slice(0, 1)}
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
			</GestureHandlerRootView>,
		);

		expect(triggerSwipeActionFn).toBeDefined();

		act(() => {
			triggerSwipeActionFn();
		});

		await waitFor(() => {
			expect(setup.alertMock).toHaveBeenCalledTimes(1);
		});

		const alertOptions = setup.alertMock.mock.calls[0][2];
		const cancelButton = alertOptions.find((option: any) => option.text === "No");
		expect(cancelButton).toBeDefined();

		act(() => {
			cancelButton.onPress();
		});

		expect(onSwipeAction).not.toHaveBeenCalled();
	});
});
