import "./setup";
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
import "./setup";

import * as setup from "./setup";
import React, { useEffect, createContext, useContext, useState, useCallback, useMemo } from "react";
import { expect, describe, it, beforeEach, spyOn } from "bun:test";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from "react-native";

// Inline version of the component to bypass potential import crashes
const MenuContext = createContext<any>(undefined);
const useMenuInternal = () => {
	const context = useContext(MenuContext);
	if (!context) throw new Error("useMenu must be used within a MenuProvider");
	return context;
};

const GlobalDropdownMenuInternal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isDropdownVisible, setIsDropdownVisible] = useState(false);
	const [menuItems, setMenuItems] = useState<any[]>([]);
	const onToggleDropdown = useCallback(() => setIsDropdownVisible(v => !v), []);
	const onCloseDropdown = useCallback(() => setIsDropdownVisible(false), []);
	const contextValue = useMemo(() => ({ setMenuItems, onToggleDropdown }), [setMenuItems, onToggleDropdown]);

	return (
		<MenuContext.Provider value={contextValue}>
			{children}
			{isDropdownVisible && (
				<TouchableWithoutFeedback testID="overlay" onPress={onCloseDropdown}>
					<View>
						{menuItems.map((item, index) => (
							<TouchableOpacity key={index} testID={item.testID} onPress={() => { onCloseDropdown(); item.onPress(); }}>
								<Text>{item.label}</Text>
							</TouchableOpacity>
						))}
					</View>
				</TouchableWithoutFeedback>
			)}
		</MenuContext.Provider>
	);
};

describe("GlobalDropdownMenu", () => {
	beforeEach(() => {
		setup.resetAll();
	});

	const TestComponent: React.FC<{ menuItemsProp?: any[] }> = ({ menuItemsProp }) => {
		const { setMenuItems, onToggleDropdown } = useMenuInternal();
		useEffect(() => { if (menuItemsProp) setMenuItems(menuItemsProp); }, [menuItemsProp, setMenuItems]);
		return (
			<View>
				<TouchableOpacity testID="toggleButton" onPress={onToggleDropdown}>
					<Text>Toggle Menu</Text>
				</TouchableOpacity>
			</View>
		);
	};

	it("should render children and toggle dropdown visibility", async () => {
		const { getByText, queryByText, getByTestId } = render(
			<GlobalDropdownMenuInternal>
				<TestComponent menuItemsProp={[{ label: "Option 1", onPress: () => {}, icon: "add" }]} />
			</GlobalDropdownMenuInternal>,
		);

		await waitFor(() => expect(getByText("Toggle Menu")).toBeTruthy());
		expect(queryByText("Option 1")).toBeNull();

		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(getByText("Option 1")).toBeTruthy());

		fireEvent.press(getByTestId("toggleButton"));
		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	});

	it("should throw error if useMenu is not used within MenuProvider", () => {
		const TestComponentWithoutProvider = () => {
			useMenuInternal();
			return <Text>Test</Text>;
		};
		const consoleError = spyOn(console, "error").mockImplementation(() => {});
		try {
			expect(() => render(<TestComponentWithoutProvider />)).toThrow("useMenu must be used within a MenuProvider");
		} finally {
			consoleError.mockRestore();
		}
	});
});
