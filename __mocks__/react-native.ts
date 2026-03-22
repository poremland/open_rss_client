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
import { mock } from "bun:test";

const mockComponent = (name: string) => (props: any) => React.createElement(name, props, props.children);

export const View = mockComponent("View");
export const Text = mockComponent("Text");
export const TouchableOpacity = mockComponent("TouchableOpacity");
export const TouchableWithoutFeedback = mockComponent("TouchableWithoutFeedback");
export const TouchableHighlight = mockComponent("TouchableHighlight");
export const Pressable = mockComponent("Pressable");
export const Button = mock(({ title, onPress, testID }: any) => {
	return React.createElement(Pressable, { onPress, testID, accessibilityRole: "button" }, 
		React.createElement(Text, {}, title)
	);
});
export const FlatList = mock(({ data, renderItem }: any) => {
	return React.createElement(View, {}, data?.map((item: any, index: number) => 
		React.createElement(View, { key: index }, renderItem({ item, index }))
	));
});
export const ScrollView = mockComponent("ScrollView");
export const Image = mockComponent("Image");
export const TextInput = mockComponent("TextInput");
export const ActivityIndicator = mockComponent("ActivityIndicator");
export const RefreshControl = mockComponent("RefreshControl");
export const KeyboardAvoidingView = mockComponent("KeyboardAvoidingView");
export const Modal = mockComponent("Modal");
export const StyleSheet = {
	create: (s: any) => s,
	flatten: (s: any) => Array.isArray(s) ? Object.assign({}, ...s) : s,
};
export const Platform = { OS: "ios", select: (o: any) => o.ios || o.default };
export const Alert = { 
	alert: (globalThis as any).__mocks?.alertMock || mock()
};
export const Dimensions = { get: () => ({ width: 375, height: 812 }) };
export const PixelRatio = { get: () => 1, roundToNearestPixel: (n: number) => n };
export const Linking = { openURL: mock(), canOpenURL: mock(), getInitialURL: mock() };
export const Share = { share: mock() };
export const I18nManager = { isRTL: false, allowRTL: mock(), forceRTL: mock(), getConstants: () => ({ isRTL: false }) };
export const Keyboard = { addListener: mock(() => ({ remove: mock() })), dismiss: mock() };
export const StatusBar = { setBarStyle: mock(), setHidden: mock() };
export const TurboModuleRegistry = { get: mock(), getEnforcing: mock() };
export const NativeEventEmitter = class {
	addListener = mock(() => ({ remove: mock() }));
	removeAllListeners = mock();
	emit = mock();
};
export const processColor = (c: any) => c;
export const NativeModules = {};

export default {
	View,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	TouchableHighlight,
	Pressable,
	Button,
	FlatList,
	ScrollView,
	Image,
	TextInput,
	ActivityIndicator,
	RefreshControl,
	KeyboardAvoidingView,
	Modal,
	StyleSheet,
	Platform,
	Alert,
	Dimensions,
	PixelRatio,
	Linking,
	Share,
	I18nManager,
	Keyboard,
	StatusBar,
	TurboModuleRegistry,
	NativeEventEmitter,
	processColor,
	NativeModules,
};
