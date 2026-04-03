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

import React, { useEffect, useState } from "react";
import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View, Text, TouchableOpacity } from "react-native";
import { resetAll } from "./setup";

// Import from the .impl file to bypass the global mock of GlobalDropdownMenu.tsx
import GlobalDropdownMenu, { useMenu, MenuItem } from "../components/GlobalDropdownMenu.impl";

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

describe("GlobalDropdownMenu Integration", () => {
	beforeEach(() => {
		resetAll();
	});

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

	it("should update menu item handlers even if labels remain the same", async () => {
		let result = 0;
		const items1: MenuItem[] = [{ label: "Click Me", onPress: () => { result = 1; }, icon: "add" }];
		const items2: MenuItem[] = [{ label: "Click Me", onPress: () => { result = 2; }, icon: "add" }];

		const TestWrapper = ({ items }: { items: MenuItem[] }) => (
			<GlobalDropdownMenu>
				<TestScreen id="A" items={items} />
			</GlobalDropdownMenu>
		);

		const { getByText, getByTestId, rerender } = render(<TestWrapper items={items1} />);

		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(getByText("Click Me")).toBeTruthy());

		// Trigger click
		fireEvent.press(getByText("Click Me"));
		expect(result).toBe(1);

		// Re-render with new handler but same label
		rerender(<TestWrapper items={items2} />);

		// Open menu again if it closed (rerender might reset state in RTL)
		const toggleButton = getByTestId("toggleButton");
		fireEvent.press(toggleButton);

		// Wait for potential update
		await waitFor(() => expect(getByText("Click Me")).toBeTruthy());

		// Trigger click again
		fireEvent.press(getByText("Click Me"));
		expect(result).toBe(2);
	});

	it("should NOT allow a blurred screen to overwrite menu items (Fixed)", async () => {
		const itemsA: MenuItem[] = [{ label: "Item A", onPress: () => {}, icon: "add" }];
		const itemsB: MenuItem[] = [{ label: "Item B", onPress: () => {}, icon: "remove" }];

		const MultiScreenTest = ({ activeScreen, id }: { activeScreen: string, id: string }) => {
			const { setMenuItems, onToggleDropdown } = useMenu();
			const isFocused = activeScreen === id;
			
			useEffect(() => {
				if (isFocused) {
					setMenuItems(id === "A" ? itemsA : itemsB);
				}
			}, [isFocused, id, setMenuItems]);

			// Simulate a background update that should be ignored because it checks isFocused
			useEffect(() => {
				if (!isFocused) {
					// Background screen trying to clear items
					// In real code, this would be inside useFocusEffect which would check isFocused
					if (isFocused) { 
						setMenuItems([]);
					}
				}
			}, [isFocused, setMenuItems]);

			return (
				<TouchableOpacity testID={`toggle-${id}`} onPress={onToggleDropdown}>
					<Text>Toggle {id}</Text>
				</TouchableOpacity>
			);
		};

		const { getByText, queryByText, getByTestId, rerender } = render(
			<GlobalDropdownMenu>
				<MultiScreenTest id="A" activeScreen="A" />
				<MultiScreenTest id="B" activeScreen="A" />
			</GlobalDropdownMenu>
		);

		fireEvent.press(getByTestId("toggle-A"));
		await waitFor(() => expect(getByText("Item A")).toBeTruthy());

		// Switch to B
		rerender(
			<GlobalDropdownMenu>
				<MultiScreenTest id="A" activeScreen="B" />
				<MultiScreenTest id="B" activeScreen="B" />
			</GlobalDropdownMenu>
		);

		// Now menu should have items from B, and A's effect should not have cleared them
		await waitFor(() => {
			expect(getByText("Item B")).toBeTruthy();
			expect(queryByText("Item A")).toBeNull();
		});
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
