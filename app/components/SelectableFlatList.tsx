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
import {
	FlatList,
	TouchableOpacity,
	View,
	RefreshControl,
	ViewStyle,
} from "react-native";
import * as styleHelper from "../../styles/commonStyles";

interface SelectableFlatListProps<T> {
	data: T[];
	renderItem: ({ item }: { item: T }) => React.ReactElement;
	onRefresh: () => void;
	refreshing: boolean;
	multiSelectActive: boolean;
	onSelectionChange: (selectedItems: number[]) => void;
	selectedItems: number[];
	onItemPress: (item: T) => void;
	ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
	contentContainerStyle?: ViewStyle;
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
			<TouchableOpacity
				style={[
					styleHelper.listStyles.listItem,
					styleHelper.listStyles.listItemContainer,
					isItemSelected && styleHelper.listStyles.selectedItem,
				]}
				onLongPress={() => {
					if (!multiSelectActive) onSelectionChange([item.id]);
				}}
				onPress={() => {
					if (multiSelectActive) {
						toggleSelection(item.id);
					} else {
						onItemPress(item);
					}
				}}
				activeOpacity={0.7}
			>
				{multiSelectActive && (
					<View style={styleHelper.listStyles.checkboxContainer}>
						<TouchableOpacity
							style={[
								styleHelper.listStyles.checkbox,
								isItemSelected &&
									styleHelper.listStyles.checkboxSelected,
							]}
							onPress={() => toggleSelection(item.id)}
						>
							{isItemSelected && (
								<View
									style={styleHelper.listStyles.checkmark}
								/>
							)}
						</TouchableOpacity>
					</View>
				)}
				<View style={styleHelper.listStyles.itemTextContainer}>
					{renderItem({ item })}
				</View>
			</TouchableOpacity>
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