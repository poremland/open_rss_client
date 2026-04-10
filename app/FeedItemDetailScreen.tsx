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

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { View, Platform, Linking, Share, Alert } from "react-native";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { decode } from "he";
import useApi from "../components/useApi";
import HeaderRightMenu from "../components/HeaderRightMenu";
import * as authHelper from "../helpers/auth_helper";
import { FeedItem } from "../models/FeedItem";
import { useMenu, MenuItem } from "../components/GlobalDropdownMenu";
import * as Clipboard from "expo-clipboard";

import Screen from "../components/Screen";
import { styles } from "../styles/FeedItemDetailScreen.styles";

import useCache from "../components/useCache";

const FeedItemDetailScreen: React.FC = () => {
	const [webViewSource, setWebViewSource] = useState<string>("");
	const router = useRouter();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const { feedItemId } = useLocalSearchParams<{ feedItemId: string }>();
	const { getCache, setCache } = useCache();
	const {
		data: selectedFeedItem,
		loading,
		error,
		execute: fetchFeedItem,
	} = useApi<FeedItem>(
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
		{ shouldQueue: true },
	);

	const handleMarkAsRead = useCallback(async () => {
		const item = selectedFeedItem;
		if (!item) return;
		const response = await markItemAsRead();
		if (response && (response as any).queued) {
			const cachePath = `/feeds/${item.feed_id}.json`;
			const cachedItems = await getCache<FeedItem[]>(cachePath);
			if (cachedItems) {
				const newData = cachedItems.filter(i => i.id !== item.id);
				await setCache(cachePath, newData);
			}
		}
		router.back();
		if (item?.id) {
			router.setParams({ removedItemId: item.id.toString() });
		}
	}, [selectedFeedItem, markItemAsRead, router, getCache, setCache]);

	useEffect(() => {
		const item = selectedFeedItem;
		if (item && isFocused) {
			const autoMarkAsRead = async () => {
				const response = await markItemAsRead();
				if (response && (response as any).queued) {
					const cachePath = `/feeds/${item.feed_id}.json`;
					const cachedItems = await getCache<FeedItem[]>(cachePath);
					if (cachedItems) {
						const newData = cachedItems.filter(i => i.id !== item.id);
						await setCache(cachePath, newData);
					}
				}
			};
			autoMarkAsRead();
		}
	}, [selectedFeedItem, isFocused, markItemAsRead, getCache, setCache]);

	const handleShare = useCallback(async () => {
		if (selectedFeedItem) {
			try {
				await Share.share({
					message: `${selectedFeedItem.title}: ${selectedFeedItem.link}`,
				});
			} catch {
				await Clipboard.setStringAsync(selectedFeedItem.link);
				Alert.alert(
					"Link Copied",
					"The link has been copied to your clipboard.",
				);
			}
		}
	}, [selectedFeedItem]);

	const { setMenuItems, onToggleDropdown } = useMenu();

	useFocusEffect(
		useCallback(() => {
			if (!isFocused) return;

			const menuItems: MenuItem[] = [
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
						selectedFeedItem?.link && Linking.openURL(selectedFeedItem.link),
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
		}, [isFocused, handleMarkAsRead, handleShare, router, selectedFeedItem, setMenuItems]),
	);

	useEffect(() => {
		if (selectedFeedItem) {
			const decodedItem = { ...selectedFeedItem };
			decodedItem.title = decode(decodedItem.title || "");
			// The following styles are for the HTML content displayed in the WebView and cannot be moved to a React Native stylesheet.
			const staticHtml = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style> body { font-size: 18px; line-height: 1.5; padding: 20px; } img { max-width: 100%; height: auto; } </style></head><body>${decodedItem.description}<br/><br/>[<a href="${decodedItem.link}">View Full Article</a>]</body></html>`;
			if (Platform.OS === "web") {
				setWebViewSource(
					`data:text/html;charset=utf-8,${encodeURIComponent(staticHtml)}`,
				);
			} else {
				setWebViewSource(staticHtml);
			}
		} else if (!loading && !selectedFeedItem && !feedItemId) {
			navigation.goBack();
		}

		navigation.setOptions({
			headerTitle: selectedFeedItem?.title || "Feed Item",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [
		selectedFeedItem,
		loading,
		feedItemId,
		navigation,
		onToggleDropdown,
	]);

	return (
		<Screen loading={loading} error={error} style={styles.container}>
			<View testID="webViewContainer" style={styles.webViewContainer}>
				{Platform.OS === "web" ? (
					<iframe src={webViewSource} style={styles.iframe} title="Content" />
				) : (
					<WebView
						originWhitelist={["*"]}
						source={{ html: webViewSource }}
						style={styles.webview}
					/>
				)}
			</View>
		</Screen>
	);
};
export default FeedItemDetailScreen;
