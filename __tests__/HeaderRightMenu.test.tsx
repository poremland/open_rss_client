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

import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HeaderRightMenu from "../app/components/HeaderRightMenu";

jest.mock("@expo/vector-icons", () => ({
	Ionicons: "Ionicons",
}));

describe("HeaderRightMenu", () => {
	it("renders correctly and calls onToggleDropdown when pressed", () => {
		const mockToggleDropdown = jest.fn();
		const { getByTestId } = render(
			<HeaderRightMenu onToggleDropdown={mockToggleDropdown} />,
		);

		const menuButton = getByTestId("menu");
		fireEvent(menuButton, "pressOut");

		expect(mockToggleDropdown).toHaveBeenCalledTimes(1);
	});
});