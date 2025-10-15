import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { decode } from "he";
import { FeedItem } from "../../models/FeedItem";
import { styles } from "../../styles/FeedItemCard.styles";
import { listStyles } from "../../styles/commonStyles";

interface FeedItemCardProps {
	item: FeedItem;
	onPress: () => void;
	onLongPress: () => void;
	isItemSelected: boolean;
}

const extractImage = (html: string) => {
	const imgRegex = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/;
	const match = html.match(imgRegex);
	if (match) {
		return match[1];
	}
	return null;
};

const FeedItemCard: React.FC<FeedItemCardProps> = ({ item, onPress, onLongPress, isItemSelected }) => {
	const imageUrl = extractImage(item.description);

	return (
		<TouchableOpacity
			testID={`feed-item-${item.id}`}
			style={[styles.card, isItemSelected && listStyles.selectedItem]}
			onPress={onPress}
			onLongPress={onLongPress}
		>
			{imageUrl && <Image source={{ uri: imageUrl }} style={styles.thumbnail} testID="feed-item-image" />}
			<View style={styles.textContainer}>
				<Text numberOfLines={2} style={styles.title}>{decode(item?.title || "")}</Text>
				<Text numberOfLines={1} style={styles.link}>
					{item?.link || "No Link"}
				</Text>
				<Text numberOfLines={3} style={styles.description}>
					{item?.description.replace(/<[^>]*>/g, "") || "No Description"}
				</Text>
			</View>
		</TouchableOpacity>
	);
};

export default FeedItemCard;
