import React, {
	useState,
	useCallback,
	useRef,
	useEffect,
	useMemo,
} from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import useApi from "./components/useApi";
import HeaderRightMenu from "./components/HeaderRightMenu";
import * as authHelper from "../helpers/auth";
import { styles } from "../styles/FeedItemListScreen.styles";
import { listStyles } from "../styles/commonStyles";
import { FeedItem } from "../models/FeedItem";
import { useMenu } from "./components/GlobalDropdownMenu";
import { decode } from "he";
import ListScreen from "./components/ListScreen";

const FeedItemListScreen: React.FC = () => {
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [isMultiSelectActive, setMultiSelectActive] = useState<boolean>(false);
	const router = useRouter();
	const navigation = useNavigation();
	const listRef = useRef<{
		handleRefresh: () => void;
		setData: (data: FeedItem[]) => void;
		getData: () => FeedItem[];
	}>(null);
	const { setMenuItems, onToggleDropdown } = useMenu();
	const { feed, removedItemId } = useLocalSearchParams<{
		feed: string;
		removedItemId?: string;
	}>();
	const selectedFeed = useMemo(() => (feed ? JSON.parse(feed) : null), [feed]);

	const handleSelectionChange = (selectedIds: number[]) => {
		setSelectedItems(selectedIds);
		if (selectedIds.length !== 0 && !isMultiSelectActive) {
			setMultiSelectActive(true);
		} else if (selectedIds.length === 0 && isMultiSelectActive) {
			setMultiSelectActive(false);
		}
	};

	const { execute: markItemsAsRead } = useApi(
		"post",
		selectedFeed ? `/feeds/mark_items_as_read/${selectedFeed.id}` : "",
	);
	const { execute: deleteFeed } = useApi(
		"get",
		selectedFeed ? `/feeds/remove/${selectedFeed.id}` : "",
	);

	const handleMarkSelectedAsRead = useCallback(
		async (ids: number[]) => {
			await markItemsAsRead({ items: JSON.stringify(ids) });
			setMultiSelectActive(false);
			setSelectedItems([]);
			listRef.current?.handleRefresh();
		},
		[markItemsAsRead],
	);

	const handleMarkAllAsRead = useCallback(async () => {
		const allItemIds = listRef.current?.getData()?.map((item) => item.id) || [];
		await markItemsAsRead({ items: JSON.stringify(allItemIds) });
		navigation.goBack();
	}, [markItemsAsRead, navigation]);

	const handleDeleteFeed = useCallback(async () => {
		await deleteFeed();
		navigation.goBack();
	}, [deleteFeed, navigation]);

	const displayFeedItemDetails = useCallback(
		(item: FeedItem) => {
			router.push({
				pathname: "/FeedItemDetailScreen",
				params: { feedItemId: item.id.toString() },
			});
		},
		[router],
	);

	useEffect(() => {
		if (removedItemId) {
			listRef.current?.handleRefresh();
			router.setParams({ removedItemId: undefined }); // Clear the param after processing
		}
	}, [removedItemId]);

	useFocusEffect(
		useCallback(() => {
			const refreshAndCheck = async () => {
				const refreshedData = await listRef.current?.handleRefresh();
				if (refreshedData?.length === 0) {
					navigation.goBack();
				}
			};
			refreshAndCheck();

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
			listRef,
		]),
	);

	const renderItem = ({
		item,
		onPress,
		onLongPress,
		isItemSelected,
	}: {
		item: FeedItem;
		onPress: () => void;
		onLongPress: () => void;
		isItemSelected: boolean;
	}) => (
		<TouchableOpacity
			testID={`feed-item-${item.id}`}
			style={[styles.listItem, isItemSelected && listStyles.selectedItem]}
			onPress={onPress}
			onLongPress={onLongPress}
		>
			<View>
				<Text numberOfLines={2}>{decode(item?.title || "")}</Text>
				<Text numberOfLines={1} style={styles.link}>
					{item?.link || "No Link"}
				</Text>
				<Text numberOfLines={1}>
					{item?.description.replace(/<[^>]*>/g, "") || "No Description"}
				</Text>
			</View>
		</TouchableOpacity>
	);
	const multiSelectActions = [
		{
			label: "Mark Read",
			onPress: handleMarkSelectedAsRead,
		},
	];

	return (
		<ListScreen<FeedItem>
			ref={listRef}
			fetchUrl={selectedFeed ? `/feeds/${selectedFeed.id}.json` : ""}
			renderItem={renderItem}
			keyExtractor={(item) => item.id.toString()}
			onItemPress={displayFeedItemDetails}
			multiSelectActions={multiSelectActions}
			onSelectionChange={handleSelectionChange}
			selectedItems={selectedItems}
			multiSelectActive={isMultiSelectActive}
		/>
	);
};

export default FeedItemListScreen;
