import { StyleSheet } from "react-native";
import { cardStyles } from "./commonStyles";

export const styles = StyleSheet.create({
	webViewContainer: {
		...cardStyles.card,
		flex: 1,
	},
	title: {
		...cardStyles.card,
		fontSize: 18,
		fontWeight: "bold",
		padding: 10,
		marginVertical: 0,
	},
});
