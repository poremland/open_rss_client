import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	title: {
		fontSize: 24,
		marginBottom: 20,
	},
	input: {
		width: "100%",
		padding: 10,
		marginBottom: 15,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 5,
	},
	errorText: {
		color: "red",
		marginTop: 10,
	},
});
