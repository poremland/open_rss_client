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
import { mocks } from "./setup";
import { mock, expect, describe, it, beforeEach } from "bun:test";
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import HeaderRightMenu from "../components/HeaderRightMenu";
import { useConnectionStatusConfig } from "./setup";

describe("HeaderRightMenu", () => {
        beforeEach(() => {
                mocks.resetAll();
        });

        it("renders correctly and calls onToggleDropdown when pressed", () => {
                const onToggleDropdown = mock();
                const { getByTestId } = render(<HeaderRightMenu onToggleDropdown={onToggleDropdown} />);
                const button = getByTestId("menu");
                expect(button).toBeTruthy();

                fireEvent.press(button);
                expect(onToggleDropdown).toHaveBeenCalled();
        });

        it("renders the cloud-offline icon when disconnected", () => {
                useConnectionStatusConfig.isConnected = false;
                const onToggleDropdown = mock();
                const { getByText } = render(<HeaderRightMenu onToggleDropdown={onToggleDropdown} />);

                expect(getByText("cloud-offline")).toBeTruthy();
        });

        it("renders the ellipsis-vertical icon when connected", () => {
                useConnectionStatusConfig.isConnected = true;
                const onToggleDropdown = mock();
                const { getByText } = render(<HeaderRightMenu onToggleDropdown={onToggleDropdown} />);

                expect(getByText("ellipsis-vertical")).toBeTruthy();
        });
});
