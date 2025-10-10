import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		textAlign: "center",
	},
	emptyText: {
		fontSize: 18,
		color: "#555",
		textAlign: "center",
	},
	listItem: {
		paddingVertical: 15,
		paddingHorizontal: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#A9A9A9",
	},
});
