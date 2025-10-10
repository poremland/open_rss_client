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

import React, { useCallback } from "react";
import {
	View,
	Text,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import * as authHelper from "../helpers/auth";
import LoginForm from "./components/LoginForm";
import { styles } from "../styles/LoginScreen.styles";

const Index: React.FC = () => {
	const router = useRouter();

	useFocusEffect(
		useCallback(() => {
			authHelper.checkLoggedIn(router);
		}, [router]),
	);

	return (
		<View style={styles.container}>
			<Image
				source={require("../assets/images/icon.png")}
				style={styles.logo}
			/>
			<Text style={styles.title}>Open RSS Client</Text>
			<LoginForm />
		</View>
	);
};

export default Index;
