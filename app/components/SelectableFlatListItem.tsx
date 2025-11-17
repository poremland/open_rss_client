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

import React, { useCallback } from "react";
import {
	View,
	Alert,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	useAnimatedGestureHandler,
	withSpring,
	runOnJS,
} from "react-native-reanimated";

interface SelectableFlatListItemProps<T> {
	item: T;
	renderItem: ({
		item,
		onPress,
		onLongPress,
		isItemSelected,
	}: {
		item: T;
		onPress: () => void;
		onLongPress: () => void;
		isItemSelected: boolean;
	}) => React.ReactElement;
	onPress: () => void;
	onLongPress: () => void;
	isItemSelected: boolean;
	swipeEnabled: boolean;
	onSwipeAction?: (item: T) => void;
	swipeActionRequiresConfirmation: boolean;
	swipeConfirmationMessage: string;
}

const SWIPE_THRESHOLD = -100; // Pixels to swipe left to trigger action

const SelectableFlatListItem = <T extends { id: number }>({
	item,
	renderItem,
	onPress,
	onLongPress,
	isItemSelected,
	swipeEnabled,
	onSwipeAction,
	swipeActionRequiresConfirmation,
	swipeConfirmationMessage,
}: SelectableFlatListItemProps<T>) => {
	const translateX = useSharedValue(0);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [{ translateX: translateX.value }],
		};
	});

	const handleSwipeAction = useCallback(
		(swipedItem: T) => {
			if (swipeActionRequiresConfirmation) {
				Alert.alert(
					"Confirm Action",
					swipeConfirmationMessage,
					[
						{
							text: "No",
							style: "cancel",
							onPress: () => {
								// Reset swipe position if cancelled
								// This will be handled by the gesture handler's onEnd
							},
						},
						{
							text: "Yes",
							onPress: () => {
								onSwipeAction?.(swipedItem);
							},
						},
					],
					{ cancelable: true },
				);
			} else {
				onSwipeAction?.(swipedItem);
			}
		},
		[onSwipeAction, swipeActionRequiresConfirmation, swipeConfirmationMessage],
	);

	const gestureHandler = useAnimatedGestureHandler({
		onActive: (event) => {
			if (swipeEnabled && event.translationX < 0) {
				translateX.value = event.translationX;
			}
		},
		onEnd: (event) => {
			if (swipeEnabled && event.translationX <= SWIPE_THRESHOLD) {
				runOnJS(handleSwipeAction)(item);
			}
			translateX.value = withSpring(0); // Reset position
		},
		onFail: () => {
			translateX.value = withSpring(0); // Reset position
		},
		onCancel: () => {
			translateX.value = withSpring(0); // Reset position
		},
	});

	const itemContent = renderItem({
		item,
		onPress,
		onLongPress,
		isItemSelected,
	});

	if (swipeEnabled) {
		return (
			<PanGestureHandler onGestureEvent={gestureHandler} onHandlerStateChange={gestureHandler} item={item}>
				<Animated.View style={animatedStyle}>
					{itemContent}
				</Animated.View>
			</PanGestureHandler>
		);
	}

	return itemContent;
};

export default SelectableFlatListItem;
