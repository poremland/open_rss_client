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
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	Linking,
	Image,
	Alert,
	Platform,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import Screen from "../components/Screen";
import useCache from "../components/useCache";
import { styles } from "../styles/AboutScreen.styles";
import { useMenu, MenuItem } from "../components/GlobalDropdownMenu";
import HeaderRightMenu from "../components/HeaderRightMenu";
import * as authHelper from "../helpers/auth_helper";

const AboutScreen: React.FC = () => {
	const [serverUrl, setServerUrl] = useState<string | null>(null);
	const [username, setUsername] = useState<string | null>(null);
	const [stats, setStats] = useState<{
		cachedFeeds: number;
		cachedItems: number;
		totalSize: number;
		lastSyncTime: string | null;
	} | null>(null);
	const [loadingStats, setLoadingStats] = useState(true);

	const router = useRouter();
	const navigation = useNavigation();
	const { setMenuItems, onToggleDropdown } = useMenu();
	const { getCacheStats, clearAllCache } = useCache();

	const loadData = useCallback(async () => {
		try {
			setLoadingStats(true);
			const [url, user, cacheStats] = await Promise.all([
				AsyncStorage.getItem("serverUrl"),
				AsyncStorage.getItem("user"),
				getCacheStats(),
			]);
			setServerUrl(url);
			setUsername(user);
			setStats(cacheStats);
		} catch (e) {
			console.error("Error loading About data:", e);
		} finally {
			setLoadingStats(false);
		}
	}, [getCacheStats]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		const menuItems: MenuItem[] = [
			{
				label: "Log-out",
				icon: "log-out-outline",
				onPress: () => authHelper.clearAuthData(router),
			},
		];
		setMenuItems(menuItems);

		navigation.setOptions({
			headerTitle: "About",
			headerRight: () => (
				<HeaderRightMenu onToggleDropdown={onToggleDropdown} />
			),
		});
	}, [router, setMenuItems, onToggleDropdown, navigation]);

	const handleClearCache = useCallback(async () => {
		const clearAction = async () => {
			await clearAllCache();
			await loadData();
		};

		if (Platform.OS === 'web') {
			if (window.confirm("Are you sure you want to clear all locally cached feeds and items? You will need to re-download them.")) {
				await clearAction();
			}
		} else {
			Alert.alert(
				"Clear Cache",
				"Are you sure you want to clear all locally cached feeds and items? You will need to re-download them.",
				[
					{ text: "Cancel", style: "cancel" },
					{
						text: "Clear",
						style: "destructive",
						onPress: clearAction,
					},
				]
			);
		}
	}, [clearAllCache, loadData]);
	const formatSize = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDate = (isoString: string | null) => {
		if (!isoString) return "Never";
		try {
			return new Date(isoString).toLocaleString();
		} catch (e) {
			return "Unknown";
		}
	};

	const openGitHub = () => {
		Linking.openURL("https://github.com/poremland/open_rss_client/");
	};

	return (
		<Screen loading={loadingStats} style={styles.container}>
			<ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.header}>
					<Image
						source={require("../assets/images/icon.png")}
						style={styles.logo}
					/>
					<Text style={styles.title}>Open RSS Client</Text>
					<Text style={styles.version}>Version: {Constants.expoConfig?.version || Constants.manifest?.version || "Unknown"}</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>User Information</Text>
					<View style={styles.row}>
						<Text style={styles.label}>Server:</Text>
						<Text style={styles.value}>{serverUrl || "Not set"}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Username:</Text>
						<Text style={styles.value}>{username || "Guest"}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Synchronization</Text>
					<View style={styles.row}>
						<Text style={styles.label}>Last Sync:</Text>
						<Text style={styles.value}>{formatDate(stats?.lastSyncTime || null)}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Cached Feeds:</Text>
						<Text style={styles.value}>{stats?.cachedFeeds || 0}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Cached Items:</Text>
						<Text style={styles.value}>{stats?.cachedItems || 0}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Cache Size:</Text>
						<Text style={styles.value}>{formatSize(stats?.totalSize || 0)}</Text>
					</View>
					<View style={styles.buttonContainer}>
						<TouchableOpacity
							style={styles.clearButton}
							onPress={handleClearCache}
						>
							<Text style={styles.clearButtonText}>Clear Cache</Text>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Project Info</Text>
					<TouchableOpacity onPress={openGitHub} style={styles.row}>
						<Text style={styles.label}>GitHub:</Text>
						<Text style={[styles.value, styles.link]}>poremland/open_rss_client</Text>
					</TouchableOpacity>
					<View style={styles.row}>
						<Text style={styles.label}>License:</Text>
						<Text style={styles.value}>GNU AGPL v3.0</Text>
					</View>
				</View>

				<View style={styles.footer}>
					<Text style={styles.footerText}>
						Copyright © 2025 Paul Oremland{"\n"}
						All Rights Reserved.
					</Text>
				</View>
			</ScrollView>
		</Screen>
	);
};

export default AboutScreen;
