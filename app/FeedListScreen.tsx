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
	TouchableOpacity,
	View,
	Text,
	FlatList,
	RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authHelper from "../helpers/auth";
import * as styleHelper from "../styles/commonStyles";
import { Feed, FeedItemFromAPI } from "../models/Feed";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import { useMenu } from "./components/GlobalDropdownMenu";

const FeedListScreen: React.FC = () => {
	const {
		data: feedsFromApi,
		loading,
		error,
		execute: fetchFeeds,
	} = useApi<FeedItemFromAPI[]>("get", "/feeds/tree.json");
	const [feeds, setFeeds] = useState<Feed[]>([]);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();

	useEffect(() => {
		if (feedsFromApi) {
			setFeeds(
				feedsFromApi.map((item) => item.feed).filter(Boolean) as Feed[],
			);
		}
	}, [feedsFromApi]);

	useEffect(() => {
		const loadUser = async () => {
			const user = await authHelper.getUser();
			setLoggedInUser(user);
		};
		loadUser();
	}, []);

	useFocusEffect(
		useCallback(() => {
			fetchFeeds();

			const menuItems = [
				{
					label: "Add Feed",
					icon: "duplicate-outline",
					onPress: () => router.push("/AddFeedScreen"),
				},
				{
					label: "Manage Feeds",
					icon: "settings-outline",
					onPress: () => router.push("/ManageFeedsListScreen"),
				},
				{
					label: "Log-out",
					icon: "log-out-outline",
					onPress: () => authHelper.clearAuthData(router),
				},
			];
			setMenuItems(menuItems);
		}, [fetchFeeds, router, setMenuItems]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: loggedInUser || "Feed List",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [loggedInUser, navigation, onToggleDropdown]);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		fetchFeeds().finally(() => setRefreshing(false));
	}, [fetchFeeds]);

	const displayFeedItems = useCallback(
		(feed: Feed) => {
			AsyncStorage.setItem("feed", JSON.stringify(feed));
			router.push("/FeedItemListScreen");
		},
		[router],
	);

	const renderEmptyComponent = () => (
		<View style={styleHelper.containerStyles.emptyContainer}>
			<Ionicons name="cloud-done-outline" size={240} color="black" />
			<Text style={styleHelper.containerStyles.emptyText}>
				Congratulations! No more feeds with unread items.
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
			<FlatList
				data={feeds || []}
				keyExtractor={(item) => item.id.toString()}
				renderItem={({ item }) => (
					<View style={styleHelper.listStyles.listItem}>
						<TouchableOpacity
							onPress={() => displayFeedItems(item)}
						>
							<Text>
								{item?.name || "No Name"} ({item?.count})
							</Text>
						</TouchableOpacity>
					</View>
				)}
				ListEmptyComponent={renderEmptyComponent}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}
			/>
		</View>
	);
};

export default FeedListScreen;