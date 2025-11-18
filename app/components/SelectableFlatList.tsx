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
import { FlatList, View, RefreshControl, ViewStyle, Alert } from "react-native";

import SelectableFlatListItem from "./SelectableFlatListItem";

interface SelectableFlatListProps<T> {
	data: T[];
	renderItem: ({
		item,
		onPress,
		onLongPress,
		isItemSelected,
	}: {
		item: T;
		onPress: () => void;
		onLongPress: () => void;
		isItemSelected: boolean;
	}) => React.ReactElement;
	onRefresh: () => void;
	refreshing: boolean;
	multiSelectActive: boolean;
	onSelectionChange: (selectedItems: number[]) => void;
	selectedItems: number[];
	onItemPress: (item: T) => void;
	ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
	contentContainerStyle?: ViewStyle;
	swipeEnabled?: boolean;
	onSwipeAction?: (item: T) => void;
	swipeActionRequiresConfirmation?: boolean;
	swipeConfirmationMessage?: string;
}

const SelectableFlatList = <T extends { id: number }>({
	data,
	renderItem,
	onRefresh,
	refreshing,
	multiSelectActive,
	onSelectionChange,
	selectedItems,
	onItemPress,
	ListEmptyComponent,
	contentContainerStyle,
	swipeEnabled = false,
	onSwipeAction,
	swipeActionRequiresConfirmation = false,
	swipeConfirmationMessage = "Are you sure you want to perform this action?",
}: SelectableFlatListProps<T>) => {
	const toggleSelection = useCallback(
		(itemId: number) => {
			const isSelected = selectedItems.includes(itemId);
			if (isSelected) {
				onSelectionChange(selectedItems.filter((id) => id !== itemId));
			} else {
				onSelectionChange([...selectedItems, itemId]);
			}
		},
		[selectedItems, onSelectionChange],
	);

	const renderSelectableItem = ({ item }: { item: T }) => {
		const isItemSelected = selectedItems.includes(item.id);

		return (
			<SelectableFlatListItem
				item={item}
				renderItem={renderItem}
				onPress={() => {
					if (multiSelectActive) {
						toggleSelection(item.id);
					} else {
						onItemPress(item);
					}
				}}
				onLongPress={() => {
					if (!multiSelectActive) onSelectionChange([item.id]);
				}}
				isItemSelected={isItemSelected}
				swipeEnabled={swipeEnabled}
				onSwipeAction={onSwipeAction}
				swipeActionRequiresConfirmation={swipeActionRequiresConfirmation}
				swipeConfirmationMessage={swipeConfirmationMessage}
			/>
		);
	};

	return (
		<FlatList
			data={data}
			renderItem={renderSelectableItem}
			keyExtractor={(item) => item.id.toString()}
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}
			ListEmptyComponent={ListEmptyComponent}
			contentContainerStyle={contentContainerStyle}
		/>
	);
};

export default SelectableFlatList;
