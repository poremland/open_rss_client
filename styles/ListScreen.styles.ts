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
	multiSelectTopBar: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		backgroundColor: "white",
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		zIndex: 1000,
	},
	multiSelectButtonText: {
		color: "blue",
		fontSize: 16,
	},
	multiSelectButton: {
		paddingHorizontal: 10,
	},
});
