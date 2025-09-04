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

import React, { useState, useCallback, useEffect } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	Button,
	ActivityIndicator,
	Image,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { post } from "../helpers/api";
import * as authHelper from "../helpers/auth";
import { LoginCredentials, LoginResponse } from "../models/Login";

const Index: React.FC = () => {
	const [username, setUsername] = useState<string>("");
	const [otp, setOtp] = useState<string>("");
	const [serverUrl, setServerUrl] = useState<string>("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [otpRequested, setOtpRequested] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const loadServerUrl = async () => {
			try {
				const storedUrl = await AsyncStorage.getItem("serverUrl");
				if (storedUrl) {
					setServerUrl(storedUrl);
				}
			} catch (error) {
				console.error(
					"Failed to load server URL from AsyncStorage",
					error,
				);
			}
		};
		loadServerUrl();
	}, []);

	const handleRequestOtp = async () => {
		try {
			setLoading(true);
			setError("");
			await AsyncStorage.setItem("serverUrl", serverUrl);

			await post("/api/request_otp", { username });
			setOtpRequested(true);
		} catch (exception: any) {
			setError(`OTP Request Error: ${exception.message}`);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async () => {
		try {
			setLoading(true);
			setError("");

			const credentials = { username, otp };
			const response: LoginResponse = await post(
				"/api/login",
				credentials,
			);

			if (response?.token) {
				await authHelper.storeUser(username);
				await authHelper.storeAuthToken(response.token);
				router.replace("FeedListScreen");
			} else {
				setError(`Login Failed: Invalid token in response`);
			}
		} catch (exception: any) {
			setError(`Login Error: ${exception.message}`);
		} finally {
			setLoading(false);
		}
	};

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
			{error ? <Text style={styles.errorText}>{error}</Text> : null}
			<TextInput
				style={styles.input}
				placeholder="Server URL"
				value={serverUrl}
				onChangeText={setServerUrl}
				autoCapitalize="none"
				testID="serverUrlInput"
			/>
			<TextInput
				style={styles.input}
				placeholder="Username"
				value={username}
				onChangeText={setUsername}
				autoCapitalize="none"
				testID="usernameInput"
			/>
			{otpRequested && (
				<TextInput
					style={styles.input}
					placeholder="OTP"
					value={otp}
					onChangeText={setOtp}
					testID="otpInput"
				/>
			)}
			{loading ? (
				<ActivityIndicator size="large" color="#0000ff" />
			) : (
				<>
					{!otpRequested ? (
						<Button
							title="Request OTP"
							onPress={handleRequestOtp}
							testID="requestOtpButton"
						/>
					) : (
						<Button
							title="Login"
							onPress={handleLogin}
							testID="loginButton"
						/>
					)}
				</>
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
		backgroundColor: "#f5f5f5",
	},
	logo: {
		width: 100,
		height: 100,
		marginBottom: 30,
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
		color: "#333",
	},
	input: {
		width: "100%",
		padding: 10,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
		backgroundColor: "#fff",
		fontSize: 16,
	},
	errorText: {
		color: "red",
		marginTop: 10,
		textAlign: "center",
	},
});

export default Index;
