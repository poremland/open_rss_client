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

import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useMemo,
} from "react";
import {
	View,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as styleHelper from "../../styles/commonStyles";

interface MenuItem {
	label: string;
	onPress: () => void;
	icon: keyof typeof Ionicons.glyphMap;
	testID?: string;
}

interface MenuContextType {
	setMenuItems: (items: MenuItem[]) => void;
	onToggleDropdown: () => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export const useMenu = () => {
	const context = useContext(MenuContext);
	if (!context) {
		throw new Error("useMenu must be used within a MenuProvider");
	}
	return context;
};

interface GlobalDropdownMenuProps {
	children: React.ReactNode;
}

const GlobalDropdownMenu: React.FC<GlobalDropdownMenuProps> = ({
	children,
}) => {
	const [isDropdownVisible, setIsDropdownVisible] = useState(false);
	const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

	const onToggleDropdown = useCallback(() => {
		setIsDropdownVisible((prev) => !prev);
	}, []);

	const onCloseDropdown = useCallback(() => {
		setIsDropdownVisible(false);
	}, []);

	const contextValue = useMemo(
		() => ({ setMenuItems, onToggleDropdown }),
		[setMenuItems, onToggleDropdown],
	);

	return (
		<MenuContext.Provider value={contextValue}>
			{children}
			{isDropdownVisible && (
				<TouchableWithoutFeedback testID="overlay" onPress={onCloseDropdown}>
					<View style={styleHelper.dropdownStyles.overlay}>
						<View
							style={styleHelper.dropdownStyles.dropdown}
							pointerEvents="auto"
						>
							<TouchableOpacity
								style={styleHelper.dropdownStyles.dropdownItem}
								onPress={onCloseDropdown}
							>
								<Ionicons name="close-sharp" size={24} color="black" />
							</TouchableOpacity>
							{menuItems.map((item, index) => (
								<TouchableOpacity
									key={index}
									testID={item.testID}
									style={styleHelper.dropdownStyles.dropdownItem}
									onPress={() => {
										onCloseDropdown();
										item.onPress();
									}}
								>
									<Ionicons name={item.icon} size={24} color="black" />
									<Text>{item.label}</Text>
								</TouchableOpacity>
							))}
						</View>
					</View>
				</TouchableWithoutFeedback>
			)}
		</MenuContext.Provider>
	);
};

export default GlobalDropdownMenu;
