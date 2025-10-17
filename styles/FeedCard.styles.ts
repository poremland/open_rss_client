import { StyleSheet } from "react-native";
import { commonStyles } from "./commonStyles";

export const styles = StyleSheet.create({
	card: {
		...commonStyles.card,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	feedName: {
		fontSize: 18,
		fontWeight: "normal",
	},
	unreadCount: {
		fontSize: 18,
		fontWeight: "bold",
	},
});
