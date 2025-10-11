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

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import * as authHelper from "../helpers/auth";
import { getWithAuth } from "../helpers/api";
import { Feed } from "../models/Feed";
import { useMenu } from "./components/GlobalDropdownMenu";
import Screen from "./components/Screen";
import { styles } from "../styles/ManageFeedsListScreen.styles";
import ListScreen from "./components/ListScreen";
import { listStyles } from "../styles/commonStyles";

const ManageFeedsListScreen: React.FC = () => {
	const listRef = useRef<{ handleRefresh: () => void }>(null);
	const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);
	const [isMultiSelectActive, setMultiSelectActive] = useState<boolean>(false);
	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();

	const handleSelectionChange = useCallback((selectedIds: number[]) => {
		setSelectedFeeds(selectedIds);
		if (selectedIds.length > 0) {
			setMultiSelectActive(true);
		} else {
			setMultiSelectActive(false);
		}
	}, []);

	const handleDeleteSelected = useCallback(async (ids: number[]) => {
		for (const feedId of ids) {
			await getWithAuth(`/feeds/remove/${feedId}`);
		}
		setMultiSelectActive(false);
		setSelectedFeeds([]);
		listRef.current?.handleRefresh();
	}, []);

	useFocusEffect(
		useCallback(() => {
			listRef.current?.handleRefresh();
			const menuItems = [
				{
					label: "Log-out",
					icon: "log-out-outline",
					onPress: () => authHelper.clearAuthData(router),
				},
			];
			setMenuItems(menuItems);
		}, [setMenuItems, router]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: "Manage Feeds",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [navigation, onToggleDropdown]);

	const renderItem = ({ item, onPress, onLongPress, isItemSelected }: { item: Feed, onPress: () => void, onLongPress: () => void, isItemSelected: boolean }) => (
		<TouchableOpacity testID={`feed-item-${item.id}`} style={[styles.listItem, isItemSelected && listStyles.selectedItem]} onPress={onPress} onLongPress={onLongPress}>
			<Text numberOfLines={2}>{item?.name || "No Name"}</Text>
			<Text numberOfLines={1} style={styles.link}>
				{item?.uri || "No Link"}
			</Text>
		</TouchableOpacity>
	);

	const renderEmptyComponent = () => (
		<View style={styles.emptyContainer}>
			<Ionicons name="skull-outline" size={240} color="black" />
			<Text style={styles.emptyText}>
				No feeds to manage!
			</Text>
		</View>
	);

	const multiSelectActions = [
		{
			label: "Delete",
			onPress: handleDeleteSelected,
		},
	];

	return (
		<ListScreen<Feed>
			ref={listRef}
			fetchUrl="/feeds/all.json"
			renderItem={renderItem}
			keyExtractor={(item) => item.id.toString()}
			onItemPress={() => {}}
			emptyComponent={renderEmptyComponent()}
			multiSelectActions={multiSelectActions}
			onSelectionChange={handleSelectionChange}
			selectedItems={selectedFeeds}
			multiSelectActive={isMultiSelectActive}
		/>
	);
};

export default ManageFeedsListScreen;