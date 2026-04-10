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

import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import HeaderRightMenu from "../components/HeaderRightMenu";
import * as authHelper from "../helpers/auth_helper";
import { getWithAuth, exportOpml, importOpml, readTextFile } from "../helpers/api_helper";
import { validateOpmlFile } from "../helpers/opml_helper";
import * as DocumentPicker from "expo-document-picker";
import { Feed } from "../models/Feed";
import { useMenu, MenuItem } from "../components/GlobalDropdownMenu";
import { styles } from "../styles/ManageFeedsListScreen.styles";
import { styles as listScreenStyles } from "../styles/ListScreen.styles";
import { commonStyles } from "../styles/commonStyles";
import ListScreen from "../components/ListScreen";
import useConnectionStatus from "../components/useConnectionStatus";

const ManageFeedsListScreen: React.FC = () => {
        const listRef = useRef<{ handleRefresh: () => void }>(null);
        const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);
        const [isMultiSelectActive, setMultiSelectActive] = useState<boolean>(false);
        const router = useRouter();
        const navigation = useNavigation();
        const isFocused = useIsFocused();
        const { setMenuItems, onToggleDropdown } = useMenu();
        const { isConnected } = useConnectionStatus();

        const handleSelectionChange = useCallback((selectedIds: number[]) => {
                if (!isConnected) {
                        return;
                }
                setSelectedFeeds(selectedIds);
                if (selectedIds.length > 0) {
                        setMultiSelectActive(true);
                } else {
                        setMultiSelectActive(false);
                }
        }, [isConnected]);

        const handleDeleteSelected = useCallback(async (ids: number[]) => {
                if (!isConnected) {
                        Alert.alert("Offline", "Deleting feeds is disabled while offline.");
                        return;
                }
                for (const feedId of ids) {
                        await getWithAuth(`/feeds/remove/${feedId}`);
                }
                setMultiSelectActive(false);
                setSelectedFeeds([]);
                listRef.current?.handleRefresh();
        }, [isConnected]);

        const handleSwipeDelete = useCallback(async (feed: Feed) => {
                if (!isConnected) {
                        Alert.alert("Offline", "Deleting feeds is disabled while offline.");
                        return;
                }
                await getWithAuth(`/feeds/remove/${feed.id}`);
                listRef.current?.handleRefresh();
        }, [isConnected]);

        const handleItemPress = (item: Feed) => {
                Clipboard.setStringAsync(item.uri);
        };

        const handleExportOpml = useCallback(async () => {
                if (!isConnected) {
                        Alert.alert("Offline", "Exporting feeds is disabled while offline.");
                        return;
                }
                try {
                        await exportOpml();
                } catch (error: any) {
                        Alert.alert("Export Failed", error.message || "An unknown error occurred");
                }
        }, [isConnected]);

        const handleImportOpml = useCallback(async () => {
                if (!isConnected) {
                        Alert.alert("Offline", "Importing feeds is disabled while offline.");
                        return;
                }
                try {
                        const result = await DocumentPicker.getDocumentAsync({
                                type: ["text/x-opml", "application/xml", "text/xml", "*/*"],
                                copyToCacheDirectory: true,
                        });

                        if (result.canceled || !result.assets || result.assets.length === 0) {
                                return;
                        }

                        const fileUri = result.assets[0].uri;
                        const content = await readTextFile(fileUri);
                        await validateOpmlFile(content);
                        const response = await importOpml<{ message: string; count: number }>(fileUri);
                        Alert.alert(
                                "Import Started",
                                `Importing ${response.count} feeds in the background. Your feed list will be updated shortly.`
                        );
                        listRef.current?.handleRefresh();
                } catch (error: any) {
                        Alert.alert("Import Failed", error.message || "An unknown error occurred");
                }
        }, [isConnected]);

        useFocusEffect(
                useCallback(() => {
                        if (!isFocused) return;

                        listRef.current?.handleRefresh();
                        const menuItems: MenuItem[] = [
                                {
                                        label: "Import OPML",
                                        icon: "upload-outline",
                                        onPress: handleImportOpml,
                                        testID: "import-opml-button",
                                },
                                {
                                        label: "Export OPML",
                                        icon: "download-outline",
                                        onPress: handleExportOpml,
                                        testID: "export-opml-button",
                                },
                                {
                                        label: "Log-out",
                                        icon: "log-out-outline",
                                        onPress: () => authHelper.clearAuthData(router),
                                        testID: "logout-button",
                                },
                        ];
                        setMenuItems(menuItems);
                }, [isFocused, setMenuItems, router, handleExportOpml, handleImportOpml, isConnected]),
        );

        useEffect(() => {
                navigation.setOptions({
                        headerTitle: "Manage Feeds",
                        headerRight: () => (
                                <HeaderRightMenu onToggleDropdown={onToggleDropdown} />
                        ),
                });
        }, [navigation, onToggleDropdown]);

        const renderItem = ({
                item,
                onPress,
                onLongPress,
                isItemSelected,
        }: {
                item: Feed;
                onPress: () => void;
                onLongPress: () => void;
                isItemSelected: boolean;
        }) => (
                <TouchableOpacity
                        testID={`feed-item-${item.id}`}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={[styles.card, isItemSelected && commonStyles.selectedItem]}
                >
                        <View style={styles.cardContent}>
                                <Text style={styles.feedName}>{item.name}</Text>
                                <Text style={styles.feedUrl}>{item.uri}</Text>
                        </View>
                </TouchableOpacity>
        );

        const renderEmptyComponent = () => (
                <View style={listScreenStyles.emptyContainer}>
                        <Text style={styles.emptyText}>No feeds to manage!</Text>
                </View>
        );

        const multiSelectActions = isConnected ? [
                {
                        label: "Delete",
                        onPress: handleDeleteSelected,
                },
        ] : [];

        return (
                <ListScreen<Feed>
                        style={listScreenStyles.container}
                        ref={listRef}
                        fetchUrl="/feeds/all.json"
                        renderItem={renderItem}
                        keyExtractor={(item) => item.id.toString()}
                        onItemPress={handleItemPress}
                        emptyComponent={renderEmptyComponent()}
                        multiSelectActions={multiSelectActions}
                        onSelectionChange={handleSelectionChange}
                        selectedItems={selectedFeeds}
                        multiSelectActive={isMultiSelectActive}
                        swipeEnabled={isConnected}
                        onSwipeAction={handleSwipeDelete}
                        swipeActionRequiresConfirmation={true}
                        swipeConfirmationMessage="Are you sure you want to delete this feed?"
                />
        );
};
export default ManageFeedsListScreen;
