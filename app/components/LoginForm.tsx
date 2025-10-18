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

import React, { useState, useEffect } from "react";
import {
	StyleSheet,
	View,
	Text,
	TextInput,
	Button,
	ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { post } from "../../helpers/api";
import * as authHelper from "../../helpers/auth";
import { LoginResponse } from "../../models/Login";

import { styles, loadingIndicator } from "../../styles/LoginForm.styles";

const LoginForm: React.FC = () => {
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
				console.error("Failed to load server URL from AsyncStorage", error);
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
			const response: LoginResponse = await post("/api/login", credentials);

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

	return (
		<View style={styles.container}>
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
				<ActivityIndicator size={loadingIndicator.size} color={loadingIndicator.color} />
			) : (
				<>
					{!otpRequested ? (
						<Button
							title="Request OTP"
							onPress={handleRequestOtp}
							testID="requestOtpButton"
						/>
					) : (
						<Button title="Login" onPress={handleLogin} testID="loginButton" />
					)}
				</>
			)}
		</View>
	);
};

export default LoginForm;