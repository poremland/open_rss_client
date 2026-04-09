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

import React, { useState, useCallback } from "react";
import {
	View,
	Text,
	TextInput,
	Button,
	Image,
	KeyboardAvoidingView,
	ScrollView,
	Platform,
} from "react-native";
import { useNavigation } from "expo-router";
import useApi from "../components/useApi";
import { auth } from "../helpers/auth_helper";
import { NewFeedResponse } from "../models/Feed";
import Screen from "../components/Screen";
import { styles } from "../styles/AddFeedScreen.styles";
import useConnectionStatus from "../components/useConnectionStatus";

const AddFeedScreen: React.FC = () => {
        const [feedName, setFeedName] = useState<string>("");
        const [feedUri, setFeedUri] = useState<string>("");
        const navigation = useNavigation();
        const { isConnected } = useConnectionStatus();
        const {
                loading,
                error,
                execute: addFeed,
        } = useApi<NewFeedResponse>("post", "/feeds/create");

        const handleAddFeed = useCallback(async () => {
                if (!isConnected) {
                        return;
                }

                const user = await auth.getUser();
                const body = {
                        "feed[uri]": String(feedUri),
                        "feed[name]": String(feedName),
                        "feed[user]": String(user),
                };
                const response = await addFeed(body);

                if (response?.id && response.id > 0) {
                        navigation.goBack();
                }
        }, [feedUri, feedName, addFeed, navigation, isConnected]);

        return (
                <Screen loading={loading} error={error}>
                        <KeyboardAvoidingView
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                style={{ flex: 1 }}
                                keyboardVerticalOffset={100}
                        >
                                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                                        <View style={styles.container}>
                                                <Image
                                                        source={require("../assets/images/icon.png")}
                                                        style={styles.logo}
                                                />
                                                <Text style={styles.title}>Open RSS Client</Text>
                                                {!isConnected && (
                                                        <Text style={{ color: '#FF3B30', textAlign: 'center', marginBottom: 10 }}>
                                                                You are offline. Adding feeds is disabled.
                                                        </Text>
                                                )}
                                                <TextInput
                                                        style={styles.input}
                                                        placeholder="FeedName"
                                                        testID="feedNameInput"
                                                        value={feedName}
                                                        onChangeText={setFeedName}
                                                        editable={isConnected}
                                                />
                                                <TextInput
                                                        style={styles.input}
                                                        placeholder="FeedUri"
                                                        testID="feedUriInput"
                                                        value={feedUri}
                                                        onChangeText={setFeedUri}
                                                        editable={isConnected}
                                                />
                                                <Button
                                                        title="Add Feed"
                                                        testID="addFeedButton"
                                                        onPress={handleAddFeed}
                                                        disabled={!isConnected}
                                                />
                                        </View>
                                </ScrollView>
                        </KeyboardAvoidingView>
                </Screen>
        );
};
export default AddFeedScreen;
