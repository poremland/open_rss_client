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