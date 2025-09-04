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
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import SelectableFlatList from "./components/SelectableFlatList";
import MultiSelectBar from "./components/MultiSelectBar";
import * as authHelper from "../helpers/auth";
import { getWithAuth } from "../helpers/api";
import * as styleHelper from "../styles/commonStyles";
import { Feed } from "../models/Feed";
import { useMenu } from "./components/GlobalDropdownMenu";

const ManageFeedsListScreen: React.FC = () => {
	const {
		data: feeds,
		loading,
		error,
		execute: fetchFeeds,
	} = useApi<Feed[]>("get", "/feeds/all.json");
	const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);
	const [isMultiSelectActive, setMultiSelectActive] =
		useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [multiSelectBarHeight, setMultiSelectBarHeight] = useState<number>(0);
	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchFeeds().finally(() => setRefreshing(false));
	}, [fetchFeeds]);

	const handleDeleteSelected = useCallback(async () => {
		for (const feedId of selectedFeeds) {
			await getWithAuth(`/feeds/remove/${feedId}`);
		}
		setMultiSelectActive(false);
		setSelectedFeeds([]);
		fetchFeeds();
	}, [selectedFeeds, fetchFeeds]);

	useFocusEffect(
		useCallback(() => {
			fetchFeeds();

			const menuItems = [
				{
					label: "Log-out",
					icon: "log-out-outline",
					onPress: () => authHelper.clearAuthData(router),
				},
			];
			setMenuItems(menuItems);
		}, [fetchFeeds, setMenuItems, router]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: "Manage Feeds",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [navigation, onToggleDropdown]);

	const renderItem = ({ item }: { item: Feed }) => (
		<View>
			<Text numberOfLines={2}>{item?.name || "No Name"}</Text>
			<Text numberOfLines={1} style={styleHelper.listStyles.link}>
				{item?.uri || "No Link"}
			</Text>
		</View>
	);

	const renderEmptyComponent = () => (
		<View style={styleHelper.containerStyles.emptyContainer}>
			<Ionicons name="skull-outline" size={240} color="black" />
			<Text style={styleHelper.containerStyles.emptyText}>
				No feeds to manage!
			</Text>
		</View>
	);

	if (loading && !refreshing) {
		return (
			<View style={styleHelper.containerStyles.loadingContainer}>
				<Text>Loading feeds...</Text>
			</View>
		);
	}

	return (
		<View style={styleHelper.containerStyles.container}>
			{error ? (
				<Text style={styleHelper.errorStyles.errorText}>{error}</Text>
			) : null}
			<SelectableFlatList
				data={feeds || []}
				renderItem={renderItem}
				onRefresh={onRefresh}
				refreshing={refreshing}
				multiSelectActive={isMultiSelectActive}
				onSelectionChange={(selected) => {
					setSelectedFeeds(selected);
					if (!isMultiSelectActive && selected.length > 0) {
						setMultiSelectActive(true);
					}
				}}
				selectedItems={selectedFeeds}
				ListEmptyComponent={renderEmptyComponent}
				onItemPress={() => {}}
				contentContainerStyle={
					isMultiSelectActive
						? { paddingTop: multiSelectBarHeight }
						: {}
				}
			/>
			{isMultiSelectActive && (
				<MultiSelectBar onHeightMeasured={setMultiSelectBarHeight}>
					<TouchableOpacity
						onPress={() =>
							setSelectedFeeds(feeds?.map((f) => f.id) || [])
						}
						style={styleHelper.multiSelectStyles.button}
					>
						<Text style={styleHelper.multiSelectStyles.buttonText}>
							Select All
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleDeleteSelected}
						style={styleHelper.multiSelectStyles.button}
					>
						<Text style={styleHelper.multiSelectStyles.buttonText}>
							Delete
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => setMultiSelectActive(false)}
						style={styleHelper.multiSelectStyles.button}
					>
						<Text style={styleHelper.multiSelectStyles.buttonText}>
							Done
						</Text>
					</TouchableOpacity>
				</MultiSelectBar>
			)}
		</View>
	);
};

export default ManageFeedsListScreen;