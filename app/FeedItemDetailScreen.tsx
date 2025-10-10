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

import React, { useState, useCallback, useEffect } from "react";
import { View, Text, Platform, Linking, Share, Alert } from "react-native";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { useFocusEffect } from "@react-navigation/native";
import { decode } from "he";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import * as authHelper from "../helpers/auth";
import * as styleHelper from "../styles/commonStyles";
import { FeedItem } from "../models/FeedItem";
import { useMenu } from "./components/GlobalDropdownMenu";
import * as Clipboard from "expo-clipboard";

import Screen from "./components/Screen";

const FeedItemDetailScreen: React.FC = () => {
	const [webViewSource, setWebViewSource] = useState<string>("");
	const router = useRouter();
	const navigation = useNavigation();
	const { feedItemId } = useLocalSearchParams<{ feedItemId: string }>();
	const { data: selectedFeedItem, loading, error, execute: fetchFeedItem } = useApi<FeedItem>(
		"get",
		feedItemId ? `/feed_items/${feedItemId}.json` : "",
	);

	useEffect(() => {
		fetchFeedItem();
	}, [fetchFeedItem]);

	const { execute: markItemAsRead } = useApi(
		"get",
		selectedFeedItem
			? `/feed_items/mark_as_read/${selectedFeedItem.id}.json`
			: "",
	);

	const { setMenuItems, onToggleDropdown } = useMenu();

	const handleMarkAsRead = useCallback(async () => {
		if (selectedFeedItem) {
			await markItemAsRead();
			router.back();
			router.setParams({ removedItemId: selectedFeedItem.id.toString() });
		}
	}, [selectedFeedItem, markItemAsRead, router]);

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

	useEffect(() => {
		if (selectedFeedItem) {
			const decodedItem = { ...selectedFeedItem };
			decodedItem.title = decode(decodedItem.title || "");
			const staticHtml = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style> body { font-size: 18px; line-height: 1.5; padding: 20px; } img { max-width: 100%; height: auto; } </style></head><body>${decodedItem.description}<br/><br/>[<a href="${decodedItem.link}">View Full Article</a>]</body></html>`;
			if (Platform.OS === "web") {
				setWebViewSource(
					`data:text/html;charset=utf-8,${encodeURIComponent(staticHtml)}`,
				);
			} else {
				setWebViewSource(staticHtml);
			}
		} else if (error) {
			navigation.goBack();
		}

		const menuItems = [
			{
				label: "Mark As Read",
				icon: "checkmark-sharp",
				onPress: handleMarkAsRead,
				testID: "mark-as-read-button",
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
			headerTitle: selectedFeedItem?.title || "Feed Item",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});

		return () => {
			setMenuItems([]);
		};
	}, [selectedFeedItem, navigation, handleMarkAsRead, handleShare, error]);

	return (
		<Screen loading={loading} error={error}>
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
		</Screen>
	);
};
export default FeedItemDetailScreen;