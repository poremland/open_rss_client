import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	link: {
		color: "blue",
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
	listItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#A9A9A9",
	},
});
