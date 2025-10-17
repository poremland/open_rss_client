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

const containerStyles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 10,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
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
});

const listStyles = StyleSheet.create({
	listItem: {
		padding: 15,
	},
	link: {
		color: "blue",
	},
	selectedItem: {
		backgroundColor: "lightblue",
	},
	listItemContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	checkboxContainer: {
		paddingRight: 10,
	},
	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1,
		borderColor: "gray",
		borderRadius: 3,
		justifyContent: "center",
		alignItems: "center",
	},
	checkboxSelected: {
		backgroundColor: "lightblue", // Optional: style when the checkbox itself is visually selected
	},
	checkmark: {
		width: 12,
		height: 12,
		backgroundColor: "blue",
		borderRadius: 1,
	},
	libraryCheckboxContainer: {
		padding: 0,
		marginRight: 10,
	},
	itemTextContainer: {
		flex: 1, // Allow text to take remaining space
	},
});

const dropdownStyles = StyleSheet.create({
	overlay: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: "rgba(0, 0, 0, 0)",
		zIndex: 999, // Very high zIndex to be above most content
	},
	dropdown: {
		position: "absolute",
		top: 60,
		right: 10,
		backgroundColor: "white",
		borderRadius: 5,
		elevation: 5,
		zIndex: 1000, // Even higher zIndex to be above the overlay
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		minWidth: 150,
		pointerEvents: "auto",
	},
	dropdownItem: {
		flexDirection: "row",
		alignItems: "right",
		paddingVertical: 15,
		paddingHorizontal: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		pointerEvents: "auto",
	},
});

const errorStyles = StyleSheet.create({
	errorText: {
		color: "red",
		marginTop: 10,
	},
});

const swipeStyles = StyleSheet.create({
	leftAction: {
		backgroundColor: "lightblue",
		justifyContent: "center",
		width: 100,
	},
});

const multiSelectStyles = StyleSheet.create({
	topBar: {
		backgroundColor: "white",
		flexDirection: "row",
		justifyContent: "space-around",
		paddingVertical: 10,
		borderBottomWidth: 1,
		borderBottomColor: "#eee",
		zIndex: 1000,
	},
	buttonText: {
		color: "blue",
		fontSize: 16,
	},
	button: {
		paddingHorizontal: 10,
	},
});

const cardStyles = StyleSheet.create({
	card: {
		backgroundColor: "white",
		borderRadius: 10,
		padding: 15,
		marginVertical: 8,
		marginHorizontal: 16,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
});

export const commonStyles = {
	...containerStyles,
	...listStyles,
	...dropdownStyles,
	...errorStyles,
	...swipeStyles,
	...multiSelectStyles,
	...cardStyles,
};