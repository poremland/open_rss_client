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

import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { styles, loadingIndicator } from "../../styles/Screen.styles";

interface ScreenProps {
	children: React.ReactNode;
	loading?: boolean;
	error?: string | null;
	style?: object;
}

const Screen: React.FC<ScreenProps> = ({
	children,
	loading = false,
	error = null,
	style,
}) => {
	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator size={loadingIndicator.size} color={loadingIndicator.color} />
				<Text>Loading...</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, style]}>
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
			{children}
		</View>
	);
};

export default Screen;
