import React, { useState, useEffect, useCallback } from "react";
import {
	TouchableOpacity,
	View,
	Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as authHelper from "../helpers/auth";
import { Feed, FeedItemFromAPI } from "../models/Feed";
import HeaderRightMenu from "./components/HeaderRightMenu";
import { useMenu } from "./components/GlobalDropdownMenu";
import { styles } from "../styles/FeedListScreen.styles";
import ListScreen from "./components/ListScreen";

interface ListScreenHandle {
	handleRefresh: () => void;
}

const FeedListScreen: React.FC = () => {
	const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();
	const listRef = React.useRef<ListScreenHandle>(null);

	useEffect(() => {
		const loadUser = async () => {
			const user = await authHelper.getUser();
			setLoggedInUser(user);
		};
		loadUser();
	}, []);

	useFocusEffect(
		useCallback(() => {
			listRef.current?.handleRefresh();
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
		}, [router, setMenuItems]),
	);

	useEffect(() => {
		navigation.setOptions({
			headerTitle: loggedInUser || "Feed List",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [loggedInUser, navigation, onToggleDropdown]);

	const displayFeedItems = useCallback(
		(feed: Feed) => {
			router.push({
				pathname: "/FeedItemListScreen",
				params: { feed: JSON.stringify(feed) },
			});
		},
		[router],
	);

	const renderFeedItem = ({ item, onPress, onLongPress }: { item: Feed, onPress: () => void, onLongPress: () => void }) => (
		<TouchableOpacity style={styles.listItem} onPress={onPress} onLongPress={onLongPress}>
				<Text>
					{item?.name || "No Name"} ({item?.count})
				</Text>
		</TouchableOpacity>
	);

	const renderEmptyFeedsComponent = () => (
		<View style={styles.emptyContainer}>
			<Ionicons name="cloud-done-outline" size={240} color="black" />
			<Text style={styles.emptyText}>
				Congratulations! No more feeds with unread items.
			</Text>
		</View>
	);

	const transformData = (data: FeedItemFromAPI[]) => {
		return data.map((item) => item.feed).filter(Boolean) as Feed[];
	};

	return (
		<ListScreen<FeedItemFromAPI, Feed>
			ref={listRef}
			fetchUrl="/feeds/tree.json"
			renderItem={renderFeedItem}
			keyExtractor={(item) => item.id.toString()}
			emptyComponent={renderEmptyFeedsComponent()}
			transformData={transformData}
			onItemPress={displayFeedItems}
		/>
	);
};

export default FeedListScreen;