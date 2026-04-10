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

import React, { useEffect } from "react";
import { StatusBar } from "react-native";
import { Stack } from "expo-router";
import GlobalDropdownMenu from "../components/GlobalDropdownMenu";
import { refreshTokenOnLoad } from "../helpers/auth_helper";
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Import GestureHandlerRootView
import useSync from "../components/useSync";

const RootLayout = () => {
	useSync();

	useEffect(() => {
		refreshTokenOnLoad();
	}, []);

	return (
	        <GlobalDropdownMenu>
	                <GestureHandlerRootView style={{ flex: 1 }}>
	                        {/* Wrap content with GestureHandlerRootView */}
	                        <StatusBar hidden={false} barStyle="dark-content" />
	                        <Stack />
	                </GestureHandlerRootView>
	        </GlobalDropdownMenu>
	);};

export default RootLayout;
