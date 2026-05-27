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

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { View, Platform, Linking, Share, Alert, ScrollView, Text } from "react-native";
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
	const router = useRouter();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const [webViewHeight, setWebViewHeight] = useState(1);
	const { feedItemId, feedItem: feedItemParam, feedName } = useLocalSearchParams<{
		feedItemId: string;
		feedItem?: string;
		feedName?: string;
	}>();
	const initialData = useMemo(() => {
		try {
			return feedItemParam ? JSON.parse(feedItemParam) as FeedItem : undefined;
		} catch (e) {
			console.error("Error parsing feedItem param:", e);
			return undefined;
		}
	}, [feedItemParam]);

	const { getCache, setCache, markItemsReadInCache } = useCache();
	const {
		data: selectedFeedItem,
		loading,
		error,
		execute: fetchFeedItem,
	} = useApi<FeedItem>(
		"get",
		feedItemId ? `/feed_items/${feedItemId}.json` : "",
		{ useCache: true, initialData },
	);

	useEffect(() => {
		fetchFeedItem();
	}, [fetchFeedItem]);

	const { execute: markItemAsRead } = useApi(
		"get",
		selectedFeedItem?.id
			? `/feed_items/mark_as_read/${selectedFeedItem.id}.json`
			: "",
		{ shouldQueue: true },
	);

	const handleMarkAsRead = useCallback(async () => {
		const item = selectedFeedItem;
		if (!item?.id) return;

		const response = await markItemAsRead();
		if (response) {
			await markItemsReadInCache(item.feed_id!, [item.id]);
		}
		router.back();
		if (item?.id) {
			router.setParams({ removedItemId: item.id.toString() });
		}
	}, [selectedFeedItem, markItemAsRead, router, markItemsReadInCache]);

	const markAsReadHandlerRef = useRef(handleMarkAsRead);
	useEffect(() => {
		markAsReadHandlerRef.current = handleMarkAsRead;
	}, [handleMarkAsRead]);

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

	const shareHandlerRef = useRef(handleShare);
	useEffect(() => {
		shareHandlerRef.current = handleShare;
	}, [handleShare]);

	const { setMenuItems, onToggleDropdown } = useMenu();

	useEffect(() => {
		if (!isFocused) return;

		const menuItems: MenuItem[] = [
			{
				label: "Mark As Read",
				icon: "checkmark-sharp",
				onPress: () => markAsReadHandlerRef.current(),
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
				onPress: () => shareHandlerRef.current(),
			},
			{
				label: "About",
				icon: "information-circle-outline",
				onPress: () => router.push("/AboutScreen"),
			},
			{
				label: "Log-out",
				icon: "log-out-outline",
				onPress: () => authHelper.clearAuthData(router),
			},
		];
		setMenuItems(menuItems);
	}, [isFocused, router, selectedFeedItem?.id, selectedFeedItem?.link, setMenuItems]);

	const onWebViewMessage = useCallback((event: any) => {
		const height = Number(event.nativeEvent.data);
		if (height > 0) {
			setWebViewHeight(height);
		}
	}, []);

	const heightInformer = `
		(function() {
			var lastHeight = 0;
			function reportHeight() {
				var height = document.body.scrollHeight;
				if (height !== lastHeight && height > 0) {
					lastHeight = height;
					window.ReactNativeWebView.postMessage(height.toString());
				}
			}
			reportHeight();
			window.addEventListener('load', reportHeight);
			window.addEventListener('resize', reportHeight);
			var observer = new MutationObserver(reportHeight);
			observer.observe(document.body, { attributes: true, childList: true, subtree: true });
			// Periodically check in case of dynamic content loading without mutation
			var interval = setInterval(reportHeight, 500);
			setTimeout(function() { clearInterval(interval); }, 5000);
		})();
		true;
	`;

	const webViewSource = useMemo(() => {
		if (!selectedFeedItem) return "";
		const decodedItem = { ...selectedFeedItem };
		decodedItem.title = decode(decodedItem.title || "");
		const staticHtml = `
			<html>
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
					<style>
						body {
							font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, "Helvetica Neue", sans-serif;
							font-size: 18px;
							line-height: 1.6;
							padding: 0;
							margin: 0;
							color: #333;
						}
						img {
							max-width: 100%;
							height: auto;
						}
						p {
							margin-bottom: 1em;
						}
					</style>
				</head>
				<body>
					${decodedItem.description}
					<br/><br/>
					[<a href="${decodedItem.link}">View Full Article</a>]
				</body>
			</html>
		`;
		return staticHtml;
	}, [selectedFeedItem?.id]);

	useEffect(() => {
		if (!selectedFeedItem && !loading && !feedItemId) {
			navigation.goBack();
		}

		navigation.setOptions({
			headerTitle: feedName ? `Back to ${feedName}` : "Feed Item",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [
		selectedFeedItem?.id,
		loading,
		feedItemId,
		navigation,
		onToggleDropdown,
		feedName,
	]);

	return (
		<Screen loading={loading} error={error} style={styles.container}>
			<ScrollView
				showsVerticalScrollIndicator={true}
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.contentContainer}>
					{selectedFeedItem?.title && (
						<Text style={styles.title} numberOfLines={2}>
							{decode(selectedFeedItem.title)}
						</Text>
					)}
					{Platform.OS === "web" ? (
						<View style={styles.webContentWrapper}>
							<div
								style={{
									fontSize: 18,
									lineHeight: 1.6,
									color: "#333",
									fontFamily: '-apple-system, system-ui, sans-serif'
								}}
								dangerouslySetInnerHTML={{ __html: selectedFeedItem?.description || "" }}
							/>
							<Text
								style={styles.fullArticleLink}
								onPress={() => selectedFeedItem?.link && Linking.openURL(selectedFeedItem.link)}
							>
								[View Full Article]
							</Text>
						</View>
					) : (
						<View style={{ height: webViewHeight, width: "100%", paddingHorizontal: 20, paddingBottom: 20 }}>
							<WebView
								originWhitelist={["*"]}
								source={{ html: webViewSource }}
								style={styles.webview}
								scrollEnabled={false}
								onMessage={onWebViewMessage}
								injectedJavaScript={heightInformer}
								javaScriptEnabled={true}
								domStorageEnabled={true}
								scalesPageToFit={false}
								overScrollMode="never"
							/>
						</View>
					)}
				</View>
			</ScrollView>
		</Screen>
	);
};
export default FeedItemDetailScreen;
