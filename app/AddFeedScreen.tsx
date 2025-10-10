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
	View,
	Text,
	TextInput,
	Button,
} from "react-native";
import { useNavigation } from "expo-router";
import useApi from "./components/useApi";
import * as authHelper from "../helpers/auth";
import { NewFeedResponse } from "../models/Feed";
import Screen from "./components/Screen";
import { styles } from "../styles/AddFeedScreen.styles";

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
		<Screen loading={loading} error={error}>
			<Text style={styles.title}>Add New Feed</Text>
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
			<Button title="Add Feed" onPress={handleAddFeed} />
		</Screen>
	);
};

export default AddFeedScreen;