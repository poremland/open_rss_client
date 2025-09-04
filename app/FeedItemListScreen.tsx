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
import AsyncStorage from "@react-native-async-storage/async-storage";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import SelectableFlatList from "./components/SelectableFlatList";
import MultiSelectBar from "./components/MultiSelectBar";
import * as authHelper from "../helpers/auth";
import * as styleHelper from "../styles/commonStyles";
import { FeedItem } from "../models/FeedItem";
import { Feed } from "../models/Feed";
import { useMenu } from "./components/GlobalDropdownMenu";
import { decode } from "he";

const FeedItemListScreen: React.FC = () => {
	const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
	const {
		data: feedItems,
		loading,
		error,
		execute: fetchFeedItems,
		setData: setFeedItems,
	} = useApi<FeedItem[]>(
		"get",
		selectedFeed ? `/feeds/${selectedFeed.id}.json` : "",
	);

	const { execute: markItemsAsRead } = useApi(
		"post",
		selectedFeed ? `/feeds/mark_items_as_read/${selectedFeed.id}` : "",
	);
	const { execute: deleteFeed } = useApi(
		"get",
		selectedFeed ? `/feeds/remove/${selectedFeed.id}` : "",
	);
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [isMultiSelectActive, setMultiSelectActive] =
		useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [initialLoadComplete, setInitialLoadComplete] = useState(false);
	const [multiSelectBarHeight, setMultiSelectBarHeight] = useState<number>(0);
	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();

	useFocusEffect(
		useCallback(() => {
			const loadFeedData = async () => {
				const feedString = await AsyncStorage.getItem("feed");
				if (feedString) {
					setSelectedFeed(JSON.parse(feedString));
				}
			};
			loadFeedData();
		}, []),
	);

	useEffect(() => {
		if (!isMultiSelectActive && selectedFeed) {
			fetchFeedItems().finally(() => setInitialLoadComplete(true));
		}
	}, [selectedFeed, isMultiSelectActive, fetchFeedItems]);

	useEffect(() => {
		const checkRemovedItem = async () => {
			const removedItemId = await AsyncStorage.getItem("removedItemId");
			if (removedItemId) {
				setFeedItems(
					(currentItems) =>
						currentItems?.filter(
							(item) => item.id.toString() !== removedItemId,
						) || [],
				);
				await AsyncStorage.removeItem("removedItemId");
			}
		};
		checkRemovedItem();
	}, [setFeedItems]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchFeedItems().finally(() => setRefreshing(false));
	}, [fetchFeedItems]);

	useEffect(() => {
		if (
			initialLoadComplete &&
			feedItems &&
			feedItems.length === 0 &&
			!loading
		) {
			navigation.goBack();
		}
	}, [feedItems, loading, navigation, initialLoadComplete]);

	const handleMarkSelectedAsRead = useCallback(async () => {
		await markItemsAsRead({ items: JSON.stringify(selectedItems) });
		setMultiSelectActive(false);
		setSelectedItems([]);
		fetchFeedItems();
	}, [markItemsAsRead, selectedItems, fetchFeedItems]);

	const handleMarkAllAsRead = useCallback(async () => {
		await markItemsAsRead({
			items: JSON.stringify(feedItems?.map((item) => item.id)),
		});
		navigation.goBack();
	}, [markItemsAsRead, feedItems, navigation]);

	const handleDeleteFeed = useCallback(async () => {
		await deleteFeed();
		navigation.goBack();
	}, [deleteFeed, navigation]);

	const displayFeedItemDetails = useCallback(
		async (item: { feedItem: FeedItem }) => {
			await AsyncStorage.setItem("selectedItem", JSON.stringify(item));
			router.push("/FeedItemDetailScreen");
		},
		[router],
	);

	useFocusEffect(
		useCallback(() => {
			const menuItems = [
				{
					label: "Mark All As Read",
					icon: "checkmark-done",
					onPress: handleMarkAllAsRead,
				},
				{
					label: "Delete Feed",
					icon: "trash-outline",
					onPress: handleDeleteFeed,
				},
				{
					label: "Log-out",
					icon: "log-out-outline",
					onPress: () => authHelper.clearAuthData(router),
				},
			];
			setMenuItems(menuItems);

			navigation.setOptions({
				headerTitle: selectedFeed?.name || "Feed Items",
					headerRight: () => (
					<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
				),
			});

			return () => {
				setMenuItems([]);
			};
		}, [
			selectedFeed,
			navigation,
			router,
			handleMarkAllAsRead,
			handleDeleteFeed,
			setMenuItems,
			onToggleDropdown,
		]),
	);

	const renderItem = ({ item }: { item: FeedItem }) => (
		<View>
			<Text numberOfLines={2}>{decode(item?.title || "")}</Text>
			<Text numberOfLines={1} style={styleHelper.listStyles.link}>
				{item?.link || "No Link"}
			</Text>
			<Text numberOfLines={1}>
				{item?.description.replace(/<[^>]*>/g, "") || "No Description"}
			</Text>
		</View>
	);

	if (loading && !refreshing && (!feedItems || feedItems.length === 0)) {
		return (
			<View style={styleHelper.containerStyles.loadingContainer}>
				<Text>Loading feed items...</Text>
			</View>
		);
	}

	return (
		<View style={styleHelper.containerStyles.container}>
			{error ? (
				<Text style={styleHelper.errorStyles.errorText}>{error}</Text>
			) : null}
			<SelectableFlatList
				data={feedItems || []}
				renderItem={renderItem}
				onRefresh={onRefresh}
				refreshing={refreshing}
				multiSelectActive={isMultiSelectActive}
				onSelectionChange={(selected) => {
					setSelectedItems(selected);
					if (!isMultiSelectActive && selected.length > 0) {
						setMultiSelectActive(true);
					}
				}}
				selectedItems={selectedItems}
				onItemPress={(item) =>
					displayFeedItemDetails({ feedItem: item })
				}
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
							setSelectedItems(feedItems?.map((i) => i.id) || [])
						}
						style={styleHelper.multiSelectStyles.button}
					>
						<Text style={styleHelper.multiSelectStyles.buttonText}>
							Select All
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={handleMarkSelectedAsRead}
						style={styleHelper.multiSelectStyles.button}
					>
						<Text style={styleHelper.multiSelectStyles.buttonText}>
							Mark Read
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

export default FeedItemListScreen;