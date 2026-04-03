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

import React, { useCallback } from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { mock, expect, describe, it, beforeEach } from "bun:test";
import { View, Text, TouchableOpacity } from "react-native";
import SelectableFlatListItem from "../../components/SelectableFlatListItem";
import { State, TapGestureHandler } from "react-native-gesture-handler";
import * as setup from "../setup";

describe("SelectableFlatListItem", () => {
	const mockItem = { id: 1, name: "Test Item" };
	const renderItem = ({ item, onPress, onLongPress }: any) => (
		<TouchableOpacity onPress={onPress} onLongPress={onLongPress}>
			<Text>{item.name}</Text>
		</TouchableOpacity>
	);

	beforeEach(() => {
		setup.resetAll();
	});

	it("should call onPress when tapped (via TapGestureHandler) when swipe is enabled", () => {
		const onPress = mock();
		const onLongPress = mock();
		const { getByTestId } = render(
			<SelectableFlatListItem
				item={mockItem}
				renderItem={renderItem}
				onPress={onPress}
				onLongPress={onLongPress}
				isItemSelected={false}
				swipeEnabled={true}
				swipeActionRequiresConfirmation={false}
				swipeConfirmationMessage=""
			/>
		);

		// Find the TapGestureHandler and trigger State.END
		const handler = getByTestId("tap-gesture-handler");
		fireEvent(handler, "onHandlerStateChange", {
			nativeEvent: { state: State.END },
		});

		expect(onPress).toHaveBeenCalled();
	});

	it("should call onPress directly when swipe is disabled", () => {
		const onPress = mock();
		const onLongPress = mock();
		const { getByText } = render(
			<SelectableFlatListItem
				item={mockItem}
				renderItem={renderItem}
				onPress={onPress}
				onLongPress={onLongPress}
				isItemSelected={false}
				swipeEnabled={false}
				swipeActionRequiresConfirmation={false}
				swipeConfirmationMessage=""
			/>
		);

		fireEvent.press(getByText("Test Item"));
		expect(onPress).toHaveBeenCalled();
	});

	it("should NOT call onPress from child when swipe is enabled (preventing double push)", () => {
		let childOnPressCalled = false;
		const onPress = mock();
		const renderItemWithSpy = ({ onPress: childOnPress }: any) => (
			<TouchableOpacity onPress={() => { childOnPress(); childOnPressCalled = true; }}>
				<Text>Test Item</Text>
			</TouchableOpacity>
		);

		const { getByText } = render(
			<SelectableFlatListItem
				item={mockItem}
				renderItem={renderItemWithSpy}
				onPress={onPress}
				onLongPress={mock()}
				isItemSelected={false}
				swipeEnabled={true}
				swipeActionRequiresConfirmation={false}
				swipeConfirmationMessage=""
			/>
		);

		fireEvent.press(getByText("Test Item"));
		expect(childOnPressCalled).toBe(true);
		expect(onPress).not.toHaveBeenCalled();
	});
});
