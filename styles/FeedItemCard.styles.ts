import { StyleSheet } from "react-native";
import { commonStyles } from "./commonStyles";

export const styles = StyleSheet.create({
	card: {
		...commonStyles.card,
		flexDirection: "row",
		padding: 10,
		marginVertical: 5,
		marginHorizontal: 10,
		alignItems: "center",
	},
	thumbnail: {
		width: 80,
		height: 80,
		borderRadius: 10,
		marginRight: 10,
	},
	textContainer: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
	},
	link: {
		fontSize: 12,
		color: "gray",
		marginBottom: 5,
	},
	description: {
		fontSize: 14,
	},
});
