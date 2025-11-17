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
import { View, Alert, Dimensions } from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
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

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.6;

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

	const handleSwipeAction = (swipedItem: T) => {
		if (swipeActionRequiresConfirmation) {
			Alert.alert(
				"Confirm Action",
				swipeConfirmationMessage,
				[
					{
						text: "No",
						style: "cancel",
						onPress: () => {
							translateX.value = withSpring(0);
						},
					},
					{
						text: "Yes",
						onPress: () => {
							onSwipeAction?.(swipedItem);
							translateX.value = withSpring(0);
						},
					},
				],
				{ cancelable: true, onDismiss: () => (translateX.value = withSpring(0)) },
			);
		} else {
			onSwipeAction?.(swipedItem);
			translateX.value = withSpring(0);
		}
	};

	const gestureHandler = useAnimatedGestureHandler({
		onStart: (_, ctx: { startX: number }) => {
			ctx.startX = translateX.value;
		},
		onActive: (event, ctx) => {
			const newTranslateX = ctx.startX + event.translationX;
			if (swipeEnabled && newTranslateX < 0) {
				translateX.value = newTranslateX;
			}
		},
		onEnd: () => {
			if (swipeEnabled && Math.abs(translateX.value) > SWIPE_THRESHOLD) {
				runOnJS(handleSwipeAction)(item);
			} else {
				translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
			}
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
			<PanGestureHandler
				onGestureEvent={gestureHandler}
				activeOffsetX={[-20, 20]}
				failOffsetY={[-10, 10]}
				{...(process.env.NODE_ENV === "test" && { item })}
			>
				<Animated.View style={animatedStyle}>{itemContent}</Animated.View>
			</PanGestureHandler>
		);
	}

	return itemContent;
};

export default SelectableFlatListItem;
