import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { styles } from "../../styles/Screen.styles";

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
				<ActivityIndicator size="large" color="#0000ff" />
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
