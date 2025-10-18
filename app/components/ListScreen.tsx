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

import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	RefreshControl,
	TouchableOpacity,
	ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import useApi from "./useApi";
import Screen from "./Screen";
import MultiSelectBar from "./MultiSelectBar";
import SelectableFlatList from "./SelectableFlatList";
import { styles } from "../../styles/ListScreen.styles";

interface ListScreenProps<T, U = T> {
	fetchUrl: string;
	renderItem: ({
		item,
		onPress,
		onLongPress,
		isItemSelected,
	}: {
		item: U;
		onPress: () => void;
		onLongPress: () => void;
		isItemSelected: boolean;
	}) => React.ReactElement;
	keyExtractor: (item: U) => string;
	onItemPress: (item: U) => void;
	emptyComponent?: React.ReactElement;
	multiSelectActions?: {
		label: string;
		onPress: (selectedIds: number[]) => void;
	}[];
	onSelectionChange?: (selectedIds: number[]) => void;
	selectedItems?: number[];
	multiSelectActive?: boolean;
	transformData?: (data: T[]) => U[];
	// Additional props for customization
	headerTitle?: string;
	// ... other props as needed
}

const ListScreen = React.forwardRef(
	<T, U extends { id: number }>(
		props: ListScreenProps<T, U>,
		ref: React.Ref<{
			handleRefresh: () => Promise<U[] | undefined>;
			getData: () => U[];
			setData: (data: U[]) => void;
		}>,
	) => {
		const {
			fetchUrl,
			renderItem,
			keyExtractor,
			onItemPress,
			emptyComponent,
			multiSelectActions,
			onSelectionChange,
			selectedItems: controlledSelectedItems,
			multiSelectActive: controlledMultiSelectActive,
			transformData,
			useApi: useApiFromProps,
			headerTitle,
		} = props;

		const {
			data: rawData,
			loading,
			error,
			execute: fetchData,
			setData,
		} = useApi<T[]>("get", fetchUrl);
		const transformedData = React.useMemo(() => {
			if (!rawData) {
				return [];
			}
			const dataToTransform = rawData || [];
			return transformData
				? transformData(dataToTransform)
				: (dataToTransform as unknown as U[]);
		}, [rawData, transformData]);
		const [refreshing, setRefreshing] = useState<boolean>(false);
		const [internalSelectedItems, setInternalSelectedItems] = useState<
			number[]
		>([]);
		const [internalMultiSelectActive, setInternalMultiSelectActive] =
			useState<boolean>(false);

		const isMultiSelectActive =
			controlledMultiSelectActive !== undefined
				? controlledMultiSelectActive
				: internalMultiSelectActive;
		const selectedItems =
			controlledSelectedItems !== undefined
				? controlledSelectedItems
				: internalSelectedItems;

		const handleRefresh = useCallback(async () => {
			setRefreshing(true);
			try {
				const refreshedRawData = await fetchData();
				const dataToTransform = refreshedRawData || [];
				const refreshedTransformedData = transformData
					? transformData(dataToTransform)
					: (dataToTransform as unknown as U[]);
				return refreshedTransformedData;
			} finally {
				setRefreshing(false);
			}
		}, [fetchData, transformData]);

		React.useImperativeHandle(ref, () => ({
			handleRefresh,
			getData: () => transformedData,
			setData,
		}));

		const handleSelectionChange = useCallback(
			(newSelectedItems: number[]) => {
				if (onSelectionChange) {
					onSelectionChange(newSelectedItems);
				} else {
					setInternalSelectedItems(newSelectedItems);
					setInternalMultiSelectActive(newSelectedItems.length > 0);
				}
			},
			[onSelectionChange],
		);

		const handleSelectAll = useCallback(() => {
			if (transformedData) {
				handleSelectionChange(transformedData.map((item) => item.id));
			}
		}, [transformedData, handleSelectionChange]);

		const handleDoneMultiSelect = useCallback(() => {
			if (onSelectionChange) {
				// If controlled, let parent handle deactivation
				onSelectionChange([]);
			} else {
				setInternalMultiSelectActive(false);
				setInternalSelectedItems([]);
			}
		}, [onSelectionChange]);

		const defaultEmptyComponent = (
			<View style={styles.emptyContainer}>
				<Ionicons name="information-circle-outline" size={styles.emptyIcon.fontSize} color={styles.emptyIcon.color} />
				<Text style={styles.emptyText}>No items to display.</Text>
			</View>
		);

		return (
			<Screen loading={loading && !refreshing} error={error} style={styles.container}>
				<View style={styles.contentContainer}>
					{isMultiSelectActive && multiSelectActions && (
						<MultiSelectBar>
							<TouchableOpacity
								onPress={handleSelectAll}
								style={styles.multiSelectButton}
							>
								<Text style={styles.multiSelectButtonText}>Select All</Text>
							</TouchableOpacity>
							{multiSelectActions.map((action, index) => (
								<TouchableOpacity
									key={index}
									onPress={() => action.onPress(selectedItems)}
									style={styles.multiSelectButton}
								>
									<Text style={styles.multiSelectButtonText}>
										{action.label}
									</Text>
								</TouchableOpacity>
							))}
							<TouchableOpacity
								onPress={handleDoneMultiSelect}
								style={styles.multiSelectButton}
							>
								<Text style={styles.multiSelectButtonText}>Done</Text>
							</TouchableOpacity>
						</MultiSelectBar>
					)}
					<SelectableFlatList
						data={transformedData || []}
						renderItem={renderItem}
						keyExtractor={keyExtractor}
						onRefresh={handleRefresh}
						refreshing={refreshing}
						multiSelectActive={isMultiSelectActive}
						onSelectionChange={handleSelectionChange}
						selectedItems={selectedItems}
						onItemPress={onItemPress}
						ListEmptyComponent={emptyComponent || defaultEmptyComponent}
					/>
				</View>
			</Screen>
		);
	},
);

export default ListScreen;