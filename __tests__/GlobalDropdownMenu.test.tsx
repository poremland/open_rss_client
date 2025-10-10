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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import GlobalDropdownMenu, {
	useMenu,
} from "../app/components/GlobalDropdownMenu";
import { View, Text, TouchableOpacity } from "react-native";

jest.mock("@expo/vector-icons", () => {
	const { Text } = require("react-native");
	return {
		Ionicons: (props) => <Text>{props.name}</Text>,
	};
});

describe("GlobalDropdownMenu", () => {
	const TestComponent: React.FC<{ menuItemsProp?: any[] }> = ({ menuItemsProp }) => {
		const { setMenuItems, onToggleDropdown } = useMenu();

		useEffect(() => {
			if (menuItemsProp) {
				setMenuItems(menuItemsProp);
			}
		}, [menuItemsProp, setMenuItems]);

		return (
			<View>
				<TouchableOpacity onPress={onToggleDropdown}>
					<Text>Toggle Menu</Text>
				</TouchableOpacity>
			</View>
		);
	};

	it("should render children and toggle dropdown visibility", async () => {
		const { getByText, queryByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<TestComponent
						menuItemsProp={[
							{
								label: "Option 1",
								onPress: () => {},
								icon: "add",
							},
						]}
					/>
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await waitFor(() => expect(getByText("Toggle Menu")).toBeTruthy());

		expect(queryByText("Option 1")).toBeNull();

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});

		await waitFor(() => expect(getByText("Option 1")).toBeTruthy());

		        await act(async () => {
		            fireEvent.press(getByText("Toggle Menu"));
		        });
		
		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	}, 10000);	it("should call onPress handler and close dropdown when menu item is pressed", async () => {
		const mockOnPress = jest.fn();
		const { getByText, queryByText } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<TestComponent
						menuItemsProp={[
							{
								label: "Option 1",
								onPress: mockOnPress,
								icon: "add",
							},
						]}
					/>
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});

		await waitFor(() => expect(getByText("Option 1")).toBeTruthy());

		await act(async () => {
			fireEvent.press(getByText("Option 1"));
		});

		expect(mockOnPress).toHaveBeenCalledTimes(1);
		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	});

	it("should close dropdown when overlay is pressed", async () => {
		const { getByText, queryByText, getByTestId } = render(
			<NavigationContainer>
				<GlobalDropdownMenu>
					<TestComponent
						menuItemsProp={[
							{
								label: "Option 1",
								onPress: () => {},
								icon: "add",
							},
						]}
					/>
				</GlobalDropdownMenu>
			</NavigationContainer>,
		);

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});

		await waitFor(() => expect(getByText("Option 1")).toBeTruthy());

		await act(async () => {
			fireEvent.press(getByTestId("overlay"));
		});

		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	});

	it("should throw error if useMenu is not used within MenuProvider", () => {
		const TestComponentWithoutProvider = () => {
			useMenu();
			return <Text>Test</Text>;
		};

		const errorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => render(<TestComponentWithoutProvider />)).toThrow(
			"useMenu must be used within a MenuProvider",
		);

		errorSpy.mockRestore();
	});
});