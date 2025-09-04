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
import { render, fireEvent, waitFor, act } from "@testing-library/react-native";
import GlobalDropdownMenu, {
	useMenu,
} from "../app/components/GlobalDropdownMenu";
import { Text, Button } from "react-native";
import { Ionicons } from "@expo/vector-icons";

jest.mock("@expo/vector-icons", () => ({
	Ionicons: "Ionicons",
}));

describe("GlobalDropdownMenu", () => {
	// A simple component to use the useMenu hook for testing
	const TestComponent = ({ menuItemsProp, onToggleDropdownProp }) => {
		const { setMenuItems, onToggleDropdown } = useMenu();

		React.useEffect(() => {
			if (menuItemsProp) {
				setMenuItems(menuItemsProp);
			}
		}, [menuItemsProp, setMenuItems]);

		return (
			<Button
				title="Toggle Menu"
				onPress={onToggleDropdownProp || onToggleDropdown}
			/>
		);
	};

	it("should render children and toggle dropdown visibility", async () => {
		const { getByText, queryByText } = render(
			<GlobalDropdownMenu>
				<TestComponent
					menuItemsProp={[
						{
							label: "Option 1",
							icon: "settings",
							onPress: jest.fn(),
						},
						{
							label: "Option 2",
							icon: "log-out",
							onPress: jest.fn(),
						},
					]}
				/>
			</GlobalDropdownMenu>,
		);

		expect(queryByText("Option 1")).toBeNull();

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});

		await waitFor(() => expect(getByText(/Option 1/)).toBeVisible());
		expect(getByText(/Option 2/)).toBeVisible();

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});

		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	}, 10000);

	it("should call onPress handler and close dropdown when menu item is pressed", async () => {
		const mockOnPress1 = jest.fn();
		const mockOnPress2 = jest.fn();

		const { getByText, queryByText } = render(
			<GlobalDropdownMenu>
				<TestComponent
					menuItemsProp={[
						{
							label: "Option 1",
							icon: "settings",
							onPress: mockOnPress1,
						},
						{
							label: "Option 2",
							icon: "log-out",
							onPress: mockOnPress2,
						},
					]}
				/>
			</GlobalDropdownMenu>,
		);

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});
		await waitFor(() => expect(getByText(/Option 1/)).toBeVisible());

		await act(async () => {
			fireEvent.press(getByText(/Option 1/));
		});

		expect(mockOnPress1).toHaveBeenCalledTimes(1);
		expect(mockOnPress2).not.toHaveBeenCalled();
		await waitFor(() => expect(queryByText("Option 1")).toBeNull());
	});

	it("should close dropdown when overlay is pressed", async () => {
		const { getByText, queryByText, getByTestId } = render(
			<GlobalDropdownMenu>
				<TestComponent
					menuItemsProp={[
						{
							label: "Option 1",
							icon: "settings",
							onPress: jest.fn(),
						},
						{
							label: "Option 2",
							icon: "log-out",
							onPress: jest.fn(),
						},
					]}
				/>
			</GlobalDropdownMenu>,
		);

		await act(async () => {
			fireEvent.press(getByText("Toggle Menu"));
		});
		await waitFor(() => expect(getByText(/Option 1/)).toBeVisible());

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

		// Suppress console.error for this test as it's expected to throw
		const errorSpy = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		expect(() => render(<TestComponentWithoutProvider />)).toThrow(
			"useMenu must be used within a MenuProvider",
		);

		errorSpy.mockRestore();
	});
});