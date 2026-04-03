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

import React, { useEffect } from "react";
import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { resetAll } from "./setup";

// Import from the .impl file to bypass the global mock of GlobalDropdownMenu.tsx
import GlobalDropdownMenu, { useMenu, MenuItem } from "../components/GlobalDropdownMenu.impl";

describe("GlobalDropdownMenu Integration", () => {
	beforeEach(() => {
		resetAll();
	});

	const TestScreen: React.FC<{ id: string; items: MenuItem[] }> = ({ id, items }) => {
		const { setMenuItems, onToggleDropdown } = useMenu();
		useEffect(() => {
			setMenuItems(items);
		}, [items, setMenuItems]);

		return (
			<View testID={`screen-${id}`}>
				<Text>{id} Screen</Text>
				<TouchableOpacity testID="toggleButton" onPress={onToggleDropdown}>
					<Text>Toggle Menu</Text>
				</TouchableOpacity>
			</View>
		);
	};

	it("should render the component and manage menu items correctly", async () => {
		const items: MenuItem[] = [
			{ label: "Real Item 1", onPress: () => {}, icon: "add" }
		];

		const { getByText, queryByText, getByTestId } = render(
			<GlobalDropdownMenu>
				<TestScreen id="A" items={items} />
			</GlobalDropdownMenu>
		);

		// Initially menu is closed
		expect(queryByText("Real Item 1")).toBeNull();

		// Open menu
		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(getByText("Real Item 1")).toBeTruthy());

		// Close menu
		// The real component renders a "close-sharp" icon text when mocked
		fireEvent.press(getByText("close-sharp"));
		await waitFor(() => expect(queryByText("Real Item 1")).toBeNull());
	});

	it("should handle screen transitions wholistically (Screen B overwrites A)", async () => {
		const itemsA: MenuItem[] = [{ label: "Item A", onPress: () => {}, icon: "add" }];
		const itemsB: MenuItem[] = [{ label: "Item B", onPress: () => {}, icon: "remove" }];

		const { getByText, queryByText, getByTestId, rerender } = render(
			<GlobalDropdownMenu>
				<TestScreen id="A" items={itemsA} />
			</GlobalDropdownMenu>
		);

		// Open and verify A
		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(getByText("Item A")).toBeTruthy());

		// Transition to B (Simulate navigation by swapping children)
		rerender(
			<GlobalDropdownMenu>
				<TestScreen id="B" items={itemsB} />
			</GlobalDropdownMenu>
		);

		// Items should be from B
		await waitFor(() => {
			expect(queryByText("Item A")).toBeNull();
			expect(getByText("Item B")).toBeTruthy();
		});
	});

	it("should ignore redundant updates with identical items (identity check)", async () => {
		const items: MenuItem[] = [{ label: "Stable Item", onPress: () => {}, icon: "star" }];
		
		const { getByText, getByTestId, rerender } = render(
			<GlobalDropdownMenu>
				<TestScreen id="A" items={items} />
			</GlobalDropdownMenu>
		);

		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(getByText("Stable Item")).toBeTruthy());

		// Rerender multiple times with the same items
		rerender(
			<GlobalDropdownMenu>
				<TestScreen id="A" items={[...items]} />
			</GlobalDropdownMenu>
		);

		// Menu should still be there and correct
		expect(getByText("Stable Item")).toBeTruthy();
	});

	it("should throw error if useMenu is not used within MenuProvider", () => {
		const BrokenComponent = () => {
			useMenu();
			return null;
		};
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(() => render(<BrokenComponent />)).toThrow("useMenu must be used within a MenuProvider");
		} finally {
			consoleError.mockRestore();
		}
	});
});
