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
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SelectableFlatList from "../../app/components/SelectableFlatList";
import { TouchableOpacity, Text, Alert } from "react-native";
import { GestureHandlerRootView, State } from "react-native-gesture-handler";



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
		require('react-native-reanimated')._clearAnimatedGestureHandlers(); // Clear handlers
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

	it("should not call onSwipeAction when swipeEnabled is false", async () => {
		const onSwipeAction = jest.fn();
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
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
					swipeConfirmationMessage=""
				/>
			</GestureHandlerRootView>,
		);

		// Use the exposed helper to trigger the handler
		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.END, // END state
				translationX: -100, // Swiped left
			},
		});

		await waitFor(() => {
			expect(onSwipeAction).not.toHaveBeenCalled();
		});
	});

	it("should call onSwipeAction when swipeEnabled is true and no confirmation is required", async () => {
		const onSwipeAction = jest.fn();
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
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
					swipeConfirmationMessage=""
				/>
			</GestureHandlerRootView>,
		);

		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.END, // END state
				translationX: -100, // Swiped left
			},
		});

		await waitFor(() => {
			expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
		});
	});

	it("should not call onSwipeAction when swipe is abandoned (cancelled state)", async () => {
		const onSwipeAction = jest.fn();
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
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
					swipeConfirmationMessage=""
				/>
			</GestureHandlerRootView>,
		);

		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.CANCELLED, // CANCELLED state
				translationX: -50, // Partial swipe
			},
		});

		await waitFor(() => {
			expect(onSwipeAction).not.toHaveBeenCalled();
		});
	});

	it("should not call onSwipeAction when swipe is abandoned (failed state)", async () => {
		const onSwipeAction = jest.fn();
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
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={false}
					swipeConfirmationMessage=""
				/>
			</GestureHandlerRootView>,
		);

		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.FAILED, // FAILED state
				translationX: -50, // Partial swipe
			},
		});

		await waitFor(() => {
			expect(onSwipeAction).not.toHaveBeenCalled();
		});
	});

	it("should prompt for confirmation when swipeActionRequiresConfirmation is true and then call onSwipeAction if confirmed", async () => {
		const onSwipeAction = jest.fn();
		const confirmationMessage = "Are you sure?";
		Alert.alert.mockImplementation((title, message, buttons) => {
			const confirmButton = buttons.find((btn) => btn.text === "Yes");
			if (confirmButton) {
				confirmButton.onPress();
			}
		});

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
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={true}
					swipeConfirmationMessage={confirmationMessage}
				/>
			</GestureHandlerRootView>,
		);

		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.END, // END state
				translationX: -100, // Swiped left
			},
		});

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith(
				"Confirm Action",
				confirmationMessage,
				expect.arrayContaining([ // Use expect.arrayContaining for buttons
					expect.objectContaining({ text: "No", style: "cancel" }),
					expect.objectContaining({ text: "Yes" }),
				]),
				{ cancelable: true } // Add the expected options object
			);
			expect(onSwipeAction).toHaveBeenCalledWith(mockData[0]);
		});
	});

	it("should prompt for confirmation and not call onSwipeAction if confirmation is canceled", async () => {
		const onSwipeAction = jest.fn();
		const confirmationMessage = "Are you sure?";
		Alert.alert.mockImplementation((title, message, buttons) => {
			const cancelButton = buttons.find((btn) => btn.text === "No");
			if (cancelButton) {
				cancelButton.onPress();
			}
		});

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
					swipeEnabled={true}
					onSwipeAction={onSwipeAction}
					swipeActionRequiresConfirmation={true}
					swipeConfirmationMessage={confirmationMessage}
				/>
			</GestureHandlerRootView>,
		);

		require("react-native-gesture-handler")._triggerPanGestureHandlerStateChange(mockData[0].id, {
			nativeEvent: {
				state: State.END, // END state
				translationX: -100, // Swiped left
			},
		});

		await waitFor(() => {
			expect(Alert.alert).toHaveBeenCalledWith(
				"Confirm Action",
				confirmationMessage,
				expect.arrayContaining([ // Use expect.arrayContaining for buttons
					expect.objectContaining({ text: "No", style: "cancel" }),
					expect.objectContaining({ text: "Yes" }),
				]),
				{ cancelable: true } // Add the expected options object
			);
			expect(onSwipeAction).not.toHaveBeenCalled();
		});
	});
});
