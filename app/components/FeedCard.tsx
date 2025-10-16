import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Feed } from "../../models/Feed";
import { styles } from "../../styles/FeedCard.styles";

interface FeedCardProps {
	item: Feed;
	onPress: () => void;
	onLongPress: () => void;
}

const FeedCard: React.FC<FeedCardProps> = ({ item, onPress, onLongPress }) => {
	return (
		<TouchableOpacity
			style={styles.card}
			onPress={onPress}
			onLongPress={onLongPress}
		>
			<Text style={styles.feedName}>{item?.name || "No Name"}</Text>
			<Text style={styles.unreadCount}>{item?.count}</Text>
		</TouchableOpacity>
	);
};

export default FeedCard;
