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
import useCache from "../components/useCache";
import { syncService } from "../helpers/sync_service";

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

	const { markItemsReadInCache, markAllItemsReadInCache } = useCache();

	const handleMarkSelectedAsRead = useCallback(
		async (ids: number[]) => {
			const response = await markItemsAsRead({ items: JSON.stringify(ids) });
			setMultiSelectActive(false);
			setSelectedItems([]);

			if (response && (response as any).queued) {
				const currentData = listRef.current?.getData() || [];
				const newData = currentData.filter((item) => !ids.includes(item.id));
				listRef.current?.setData(newData);
				if (selectedFeed) {
					await markItemsReadInCache(selectedFeed.id, ids);
				}
				if (newData.length === 0) {
					navigation.goBack();
				}
				return;
			}

			const refreshedData = await listRef.current?.handleRefresh();
			if (refreshedData?.length === 0) {
				navigation.goBack();
			}
		},
		[markItemsAsRead, navigation, selectedFeed, markItemsReadInCache],
	);

	const handleSwipeMarkAsRead = useCallback(
		async (item: FeedItem) => {
			const response = await markItemsAsRead({ items: JSON.stringify([item.id]) });

			if (response && (response as any).queued) {
				const currentData = listRef.current?.getData() || [];
				const newData = currentData.filter((i) => i.id !== item.id);
				listRef.current?.setData(newData);
				if (selectedFeed) {
					await markItemsReadInCache(selectedFeed.id, [item.id]);
				}
				if (newData.length === 0) {
					navigation.goBack();
				}
				return;
			}

			const refreshedData = await listRef.current?.handleRefresh();
			if (refreshedData?.length === 0) {
				navigation.goBack();
			}
		},
		[markItemsAsRead, navigation, selectedFeed, markItemsReadInCache],
	);

	const handleMarkAllAsRead = useCallback(async () => {
		const currentData = listRef.current?.getData() || [];
		const allItemIds = currentData.map((item) => item.id) || [];
		const response = await markItemsAsRead({ items: JSON.stringify(allItemIds) });

		if (response && (response as any).queued) {
			listRef.current?.setData([]);
			if (selectedFeed) {
				await markAllItemsReadInCache(selectedFeed.id);
			}
			navigation.goBack();
			return;
		}

		navigation.goBack();
	}, [markItemsAsRead, navigation, selectedFeed, markAllItemsReadInCache]);

	const markAllAsReadRef = useRef(handleMarkAllAsRead);
	useEffect(() => {
		markAllAsReadRef.current = handleMarkAllAsRead;
	}, [handleMarkAllAsRead]);

	const handleDeleteFeed = useCallback(async () => {
		if (!isConnected) {
			Alert.alert("Offline", "Deleting feeds is disabled while offline.");
			return;
		}
		await deleteFeed();
		navigation.goBack();
	}, [deleteFeed, navigation, isConnected]);

	const deleteFeedRef = useRef(handleDeleteFeed);
	useEffect(() => {
		deleteFeedRef.current = handleDeleteFeed;
	}, [handleDeleteFeed]);

	const displayFeedItemDetails = useCallback(
		(item: FeedItem) => {
			router.push({
				pathname: "/FeedItemDetailScreen",
				params: { 
					feedItemId: item.id.toString(),
					feedItem: JSON.stringify(item),
				},
			});
		},
		[router],
	);

	useEffect(() => {
		if (removedItemId) {
			listRef.current?.handleRefresh();
			router.setParams({ removedItemId: undefined }); // Clear the param after processing
		}
	}, [removedItemId, router]);

	useFocusEffect(
		useCallback(() => {
			if (!isFocused) return;

			const refreshAndCheck = async () => {
				const refreshedData = await listRef.current?.handleRefresh();
				if (refreshedData?.length === 0) {
					navigation.goBack();
				}
			};

			const performRefresh = () => {
				if (syncService.isSynchronizing) {
					console.log("FeedItemListScreen: Sync in progress, waiting for syncFinished to refresh");
					const onSyncFinished = () => {
						console.log("FeedItemListScreen: Sync finished, refreshing now");
						refreshAndCheck();
						syncService.off('syncFinished', onSyncFinished);
					};
					syncService.on('syncFinished', onSyncFinished);
				} else {
					refreshAndCheck();
				}
			};

			performRefresh();

			const menuItems: MenuItem[] = [
				{
					label: "Mark All As Read",
					icon: "checkmark-done",
					onPress: () => markAllAsReadRef.current(),
				},
				{
					label: "Delete Feed",
					icon: "trash-outline",
					onPress: () => deleteFeedRef.current(),
					disabled: !isConnected,
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
