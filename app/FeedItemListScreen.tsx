import React, {
	useState,
	useCallback,
	useRef,
	useEffect,
	useMemo,
} from "react";
import { View, Alert } from "react-native";
import { useRouter, useNavigation, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import useApi from "../components/useApi";
import HeaderRightMenu from "../components/HeaderRightMenu";
import * as authHelper from "../helpers/auth_helper";
import { styles } from "../styles/FeedItemListScreen.styles";
import { FeedItem } from "../models/FeedItem";
import { useMenu, MenuItem } from "../components/GlobalDropdownMenu";
import ListScreen from "../components/ListScreen";
import FeedItemCard from "../components/FeedItemCard";
import useConnectionStatus from "../components/useConnectionStatus";

const FeedItemListScreen: React.FC = () => {
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [isMultiSelectActive, setMultiSelectActive] = useState<boolean>(false);
	const router = useRouter();
	const navigation = useNavigation();
	const isFocused = useIsFocused();
	const { isConnected } = useConnectionStatus();
	const listRef = useRef<{
		handleRefresh: () => Promise<FeedItem[] | undefined>;
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
			const refreshedData = await listRef.current?.handleRefresh();
			if (refreshedData?.length === 0) {
				navigation.goBack();
			}
		},
		[markItemsAsRead, navigation],
	);

	const handleSwipeMarkAsRead = useCallback(
		async (item: FeedItem) => {
			await markItemsAsRead({ items: JSON.stringify([item.id]) });
			const refreshedData = await listRef.current?.handleRefresh();
			if (refreshedData?.length === 0) {
				navigation.goBack();
			}
		},
		[markItemsAsRead, navigation],
	);

	const handleMarkAllAsRead = useCallback(async () => {
		const allItemIds = listRef.current?.getData()?.map((item) => item.id) || [];
		await markItemsAsRead({ items: JSON.stringify(allItemIds) });
		navigation.goBack();
	}, [markItemsAsRead, navigation]);

	const handleDeleteFeed = useCallback(async () => {
		if (!isConnected) {
			Alert.alert("Offline", "Deleting feeds is disabled while offline.");
			return;
		}
		await deleteFeed();
		navigation.goBack();
	}, [deleteFeed, navigation, isConnected]);

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
			if (isConnected) {
				listRef.current?.handleRefresh();
			}
			router.setParams({ removedItemId: undefined }); // Clear the param after processing
		}
	}, [removedItemId, router, isConnected]);

	useFocusEffect(
		useCallback(() => {
			if (!isFocused) return;

			const refreshAndCheck = async () => {
				if (isConnected) {
					const refreshedData = await listRef.current?.handleRefresh();
					if (refreshedData?.length === 0) {
						navigation.goBack();
					}
				}
			};
			refreshAndCheck();

			const menuItems: MenuItem[] = [
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
		}, [
			isFocused,
			selectedFeed,
			navigation,
			router,
			handleMarkAllAsRead,
			handleDeleteFeed,
			setMenuItems,
			onToggleDropdown,
			isConnected,
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
		<FeedItemCard
			item={item}
			onPress={onPress}
			onLongPress={onLongPress}
			isItemSelected={isItemSelected}
		/>
	);
	const multiSelectActions = [
		{
			label: "Mark Read",
			onPress: handleMarkSelectedAsRead,
		},
	];

	const renderEmptyFeedsComponent = () => (
		<View style={styles.emptyContainer}></View>
	);

	return (
		<ListScreen<FeedItem>
			ref={listRef}
			fetchUrl={selectedFeed ? `/feeds/${selectedFeed.id}.json` : ""}
			renderItem={renderItem}
			keyExtractor={(item) => item.id.toString()}
			emptyComponent={renderEmptyFeedsComponent()}
			onItemPress={displayFeedItemDetails}
			multiSelectActions={multiSelectActions}
			onSelectionChange={handleSelectionChange}
			selectedItems={selectedItems}
			multiSelectActive={isMultiSelectActive}
			swipeEnabled={true}
			onSwipeAction={handleSwipeMarkAsRead}
			swipeActionRequiresConfirmation={false}
			swipeConfirmationMessage=""
		/>
	);
};

export default FeedItemListScreen;
