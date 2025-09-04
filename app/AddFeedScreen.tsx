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

import React, { useState } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	Button,
	ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import useApi from "./components/useApi";
import * as authHelper from "../helpers/auth";
import { NewFeedResponse } from "../models/Feed";

const AddFeedScreen: React.FC = () => {
	const [feedName, setFeedName] = useState<string>("");
	const [feedUri, setFeedUri] = useState<string>("");
	const navigation = useNavigation();
	const {
		loading,
		error,
		execute: addFeed,
	} = useApi<NewFeedResponse>("post", "/feeds/create");

	const handleAddFeed = async () => {
		const user = await authHelper.getUser();
		const body = {
			"feed[uri]": `${feedUri}`,
			"feed[name]": `${feedName}`,
			"feed[user]": `${user}`,
		};
		const response = await addFeed(body);

		if (response?.id && response.id > 0) {
			navigation.goBack();
		}
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Add New Feed</Text>
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
			<TextInput
				style={styles.input}
				placeholder="FeedName"
				value={feedName}
				onChangeText={setFeedName}
			/>
			<TextInput
				style={styles.input}
				placeholder="FeedUri"
				value={feedUri}
				onChangeText={setFeedUri}
			/>
			{loading ? (
				<ActivityIndicator
					testID="activity-indicator"
					size="large"
					color="#0000ff"
				/>
			) : (
				<Button title="Add Feed" onPress={handleAddFeed} />
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
	},
	input: {
		width: "100%",
		padding: 10,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
	},
	errorText: {
		color: "red",
		marginTop: 10,
	},
});

export default AddFeedScreen;