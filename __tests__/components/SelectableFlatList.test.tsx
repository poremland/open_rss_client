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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import SelectableFlatList from "../../app/components/SelectableFlatList";
import { TouchableOpacity, Text, Alert, Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Mock SelectableFlatListItem
jest.mock("../../app/components/SelectableFlatListItem", () => {
	const { View, Text, TouchableOpacity, Alert } = require("react-native"); // Import Alert here
	const React = require("react");

	const MockSelectableFlatListItem = jest.fn(
		({ item, renderItem, onPress, onLongPress, isItemSelected, swipeEnabled, onSwipeAction, swipeActionRequiresConfirmation, swipeConfirmationMessage }) => {
			// This function simulates the internal logic of SelectableFlatListItem's onEnd handler
			MockSelectableFlatListItem.triggerSwipeAction = () => {
				if (swipeActionRequiresConfirmation) {
					Alert.alert(
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

			// This function simulates a swipe that does not meet the threshold
			MockSelectableFlatListItem.triggerSwipeActionNotMetThreshold = () => {
				// Do nothing, as the action should not be triggered
			};

			return (
				<View>
					{renderItem({ item, onPress, onLongPress, isItemSelected })}
				</View>
			);
		},
	);
	return MockSelectableFlatListItem;
});

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

	beforeEach(() => {
		jest.clearAllMocks();
		jest.spyOn(Alert, "alert");
		// Clear the internal state of the SelectableFlatListItem mock
		require("../../app/components/SelectableFlatListItem").triggerSwipeAction = undefined;
		require("../../app/components/SelectableFlatListItem").triggerSwipeActionNotMetThreshold = undefined;
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
		const onItemPress = jest.fn();
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

	it("should not create a gesture handler when swipeEnabled is false", () => {
		render(
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
					swipeEnabled={false}
					onSwipeAction={() => {}}
				/>
			</GestureHandlerRootView>,
		);

		const gestureHandler =
			require("react-native-reanimated")._getAnimatedGestureHandler(
				mockData[0].id,
			);
		expect(gestureHandler).toBeUndefined();
	});

	it("should not call onSwipeAction when swipe threshold is not met", async () => {
		const onSwipeAction = jest.fn();
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

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeActionNotMetThreshold).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeActionNotMetThreshold();
		});

		expect(onSwipeAction).not.toHaveBeenCalled();
	});

	it("should call onSwipeAction when swipe threshold is met", async () => {
		const onSwipeAction = jest.fn();
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

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeAction).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeAction();
		});

		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("should show a confirmation dialog if confirmation is set", async () => {
		const onSwipeAction = jest.fn();
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
					swipeActionRequiresConfirmation={true} // Confirmation enabled
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>,
		);

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeAction).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeAction();
		});

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith(
				"Confirm Action",
				"Confirm delete?",
				expect.any(Array),
				expect.any(Object),
			);
		});
		expect(onSwipeAction).not.toHaveBeenCalled(); // Action should not be called yet
	});

	it("should not show a confirmation dialog if confirmation is not set", async () => {
		const onSwipeAction = jest.fn();
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
					swipeActionRequiresConfirmation={false} // Confirmation not enabled
				/>
			</GestureHandlerRootView>,
		);

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeAction).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeAction();
		});

		await waitFor(() => {
			expect(Alert.alert).not.toHaveBeenCalled();
		});
		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]); // Action should be called directly
	});

	it("if confirmation is set on the SelectableFlatList the action is only called if confirmed", async () => {
		const onSwipeAction = jest.fn();
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
					swipeActionRequiresConfirmation={true} // Confirmation enabled
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>,
		);

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeAction).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeAction();
		});

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledTimes(1);
		});

		const alertOptions = Alert.alert.mock.calls[0][2]; // Get the options array
		const confirmButton = alertOptions.find((option) => option.text === "Yes");
		expect(confirmButton).toBeDefined();

		act(() => {
			confirmButton.onPress(); // Simulate pressing the "Yes" button
		});

		expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
	});

	it("if confirmation is set on the SelectableFlatList the action is not executed if canceled", async () => {
		const onSwipeAction = jest.fn();
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
					swipeActionRequiresConfirmation={true} // Confirmation enabled
					swipeConfirmationMessage="Confirm delete?"
				/>
			</GestureHandlerRootView>,
		);

		const MockSelectableFlatListItem = require("../../app/components/SelectableFlatListItem");
		expect(MockSelectableFlatListItem.triggerSwipeAction).toBeDefined();

		act(() => {
			MockSelectableFlatListItem.triggerSwipeAction();
		});

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledTimes(1);
		});

		const alertOptions = Alert.alert.mock.calls[0][2]; // Get the options array
		const cancelButton = alertOptions.find((option) => option.text === "No");
		expect(cancelButton).toBeDefined();

		act(() => {
			cancelButton.onPress(); // Simulate pressing the "No" button
		});

		expect(onSwipeAction).not.toHaveBeenCalled(); // Action should not be called
	});
});
