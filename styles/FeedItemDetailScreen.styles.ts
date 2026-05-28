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
		backgroundColor: "white",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		backgroundColor: "white",
	},
	contentContainer: {
		flex: 1,
		width: "100%",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 10,
		color: "black",
		backgroundColor: "white",
	},
	webview: {
		width: "100%",
	},
	progressBarContainer: {
		height: 4,
		width: "100%",
		backgroundColor: "rgba(0, 0, 0, 0.05)",
		zIndex: 10,
	},
	progressBar: {
		height: "100%",
		backgroundColor: "#007AFF",
	},
	webContentWrapper: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	fullArticleLink: {
		color: "blue",
		marginTop: 20,
		fontSize: 16,
		textDecorationLine: "underline",
	},
});
