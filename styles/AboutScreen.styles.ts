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
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
	},
	scrollContent: {
		padding: 20,
	},
	header: {
		alignItems: "center",
		marginBottom: 30,
	},
	logo: {
		width: 80,
		height: 80,
		marginBottom: 10,
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
	},
	version: {
		fontSize: 16,
		color: "#666",
		marginTop: 5,
	},
	section: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 15,
		marginBottom: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#444",
		marginBottom: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		paddingBottom: 5,
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 8,
	},
	label: {
		fontSize: 14,
		color: "#666",
		fontWeight: "500",
	},
	value: {
		fontSize: 14,
		color: "#333",
		fontWeight: "bold",
	},
	link: {
		color: "#007AFF",
		textDecorationLine: "underline",
	},
	buttonContainer: {
		marginTop: 10,
		alignItems: "center",
	},
	clearButton: {
		backgroundColor: "#FF3B30",
		paddingVertical: 12,
		paddingHorizontal: 30,
		borderRadius: 8,
	},
	clearButtonText: {
		color: "white",
		fontSize: 16,
		fontWeight: "bold",
	},
	footer: {
		alignItems: "center",
		marginTop: 10,
		marginBottom: 30,
	},
	footerText: {
		fontSize: 12,
		color: "#999",
		textAlign: "center",
	},
});
