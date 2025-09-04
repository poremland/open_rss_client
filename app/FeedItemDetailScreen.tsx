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

import React, { useState, useCallback } from "react";
import { View, Text, Platform, Linking, Share, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter, useNavigation } from "expo-router";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { decode } from "he";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import * as authHelper from "../helpers/auth";
import * as styleHelper from "../styles/commonStyles";
import { FeedItem } from "../models/FeedItem";
import { Feed } from "../models/Feed";
import { useMenu } from "./components/GlobalDropdownMenu";
import * as Clipboard from "expo-clipboard";

const FeedItemDetailScreen: React.FC = () => {
	const [selectedFeed, setSelectedFeed] = useState<Feed | null>(null);
	const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItem | null>(
		null,
	);
	const [webViewSource, setWebViewSource] = useState<string>("");
	const router = useRouter();
	const navigation = useNavigation();
	const { error, execute: markAsRead } = useApi(
		"get",
		selectedFeedItem
			? `/feed_items/mark_as_read/${selectedFeedItem.id}.json`
			: "",
	);
	const { setMenuItems, onToggleDropdown } = useMenu();

	const handleMarkAsRead = useCallback(async () => {
		if (selectedFeedItem) {
			await markAsRead();
			await AsyncStorage.setItem(
				"removedItemId",
				selectedFeedItem.id.toString(),
			);
			navigation.goBack();
		}
	}, [selectedFeedItem, markAsRead, navigation]);

	const handleShare = useCallback(async () => {
		if (selectedFeedItem) {
			try {
				await Share.share({
					message: `${selectedFeedItem.title}: ${selectedFeedItem.link}`,
				});
			} catch (error) {
				await Clipboard.setStringAsync(selectedFeedItem.link);
				Alert.alert(
					"Link Copied",
					"The link has been copied to your clipboard.",
				);
			}
		}
	}, [selectedFeedItem]);

	useFocusEffect(
		useCallback(() => {
			const loadData = async () => {
				const feedString = await AsyncStorage.getItem("feed");
				if (feedString) setSelectedFeed(JSON.parse(feedString));

				const itemString = await AsyncStorage.getItem("selectedItem");
				if (itemString) {
					const item = JSON.parse(itemString);
					const feedItem = item.feedItem;
					feedItem.title = decode(feedItem.title || "");
					setSelectedFeedItem(feedItem);
					const staticHtml = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style> body { font-size: 18px; line-height: 1.5; padding: 20px; } img { max-width: 100%; height: auto; } </style></head><body>${item.feedItem.description}<br/><br/>[<a href="${item.feedItem.link}">View Full Article</a>]</body></html>`;
					if (Platform.OS === "web") {
						setWebViewSource(
							`data:text/html;charset=utf-8,${encodeURIComponent(staticHtml)}`,
						);
					} else {
						setWebViewSource(staticHtml);
					}
				} else {
					navigation.goBack();
				}
			};
			loadData();
		}, [navigation]),
	);

	useFocusEffect(
		useCallback(() => {
			const menuItems = [
				{
					label: "Mark As Read",
					icon: "checkmark-sharp",
					onPress: handleMarkAsRead,
				},
				{
					label: "Open Full Site",
					icon: "open-outline",
					onPress: () =>
						selectedFeedItem?.link &&
						Linking.openURL(selectedFeedItem.link),
				},
				{
					label: "Share",
					icon: "share-social-outline",
					onPress: handleShare,
				},
				{
					label: "Log-out",
					icon: "log-out-outline",
					onPress: () => authHelper.clearAuthData(router),
				},
			];
			setMenuItems(menuItems);

			navigation.setOptions({
				headerTitle: selectedFeed?.name || "Feed Item",
				headerRight: () => (
					<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
				),
			});

			return () => {
				setMenuItems([]);
			};
		}, [
			handleMarkAsRead,
			navigation,
			onToggleDropdown,
			router,
			selectedFeed,
			selectedFeedItem,
			setMenuItems,
			handleShare,
		]),
	);

	return (
		<View style={{ flex: 1 }}>
			{error ? (
				<Text style={styleHelper.errorStyles.errorText}>{error}</Text>
			) : null}
			<Text>{selectedFeedItem?.title || "No Title"}</Text>
			{Platform.OS === "web" ? (
				<iframe
					src={webViewSource}
					style={{ width: "100%", height: "100%", border: "none" }}
					title="Content"
				/>
			) : (
				<WebView
					originWhitelist={["*"]}
					source={{ html: webViewSource }}
					style={{ flex: 1 }}
				/>
			)}
		</View>
	);
};

export default FeedItemDetailScreen;