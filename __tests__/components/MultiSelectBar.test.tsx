import "../setup";
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
import "../setup";

import * as setup from "../setup";
import React from "react";
import { expect, describe, it, beforeEach } from "bun:test";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import MultiSelectBar from "../../components/MultiSelectBar";

describe("MultiSelectBar", () => {
	beforeEach(() => {
		setup.resetAll();
	});

	it("should render children", () => {
		const { getByText } = render(
			<MultiSelectBar>
				<Text>Child Component</Text>
			</MultiSelectBar>,
		);

		expect(getByText("Child Component")).toBeTruthy();
	});
});
