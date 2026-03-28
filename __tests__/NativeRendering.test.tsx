/*
 * RSS Reader: A mobile application for consuming RSS feeds.
 * Copyright (C) 2025 Paul Oremland
 *
 * This program is free software: a copy of the license should have been included.
 */

import { mock, expect, describe, it } from "bun:test";
import React from "react";
import "./setup";
const { View, Text } = require("react-native");
import { render } from "@testing-library/react-native";

describe("Native Rendering Baseline", () => {
	it("renders basic components correctly", () => {
		const { getByText } = render(
			<View testID="container">
				<Text>Hello World</Text>
			</View>
		);

		expect(getByText("Hello World")).toBeTruthy();
	});

	it("uses jest-native matchers (toBeVisible)", () => {
		const { getByText } = render(
			<View>
				<Text>Visible Text</Text>
			</View>
		);

		const text = getByText("Visible Text");
		// toBeVisible is a jest-native matcher
		expect(text).toBeVisible();
	});
});
