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
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getCacheKey = (url: string) => `cache:${url}`;

// Module-level variable is shared among all importers in the same JS environment
const localCacheMap = new Map<string, string>();

export const clearLocalCache = () => {
	localCacheMap.clear();
};

export const getCache = async <T>(url: string): Promise<T | null> => {
	try {
		const key = getCacheKey(url);
		let jsonValue = localCacheMap.get(key);
		if (jsonValue === undefined) {
			jsonValue = await AsyncStorage.getItem(key) || undefined;
			if (jsonValue !== undefined) {
				localCacheMap.set(key, jsonValue);
			}
		}
		return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (e) {
		console.error('Error reading cache:', e);
		return null;
	}
};

export const setCache = async (url: string, value: any): Promise<void> => {
	try {
		const key = getCacheKey(url);
		const jsonValue = JSON.stringify(value);
		localCacheMap.set(key, jsonValue);
		// Persist to AsyncStorage
		await AsyncStorage.setItem(key, jsonValue);
	} catch (e) {
		console.error('Error saving cache:', e);
	}
};

export const clearCache = async (url: string): Promise<void> => {
	try {
		const key = getCacheKey(url);
		localCacheMap.delete(key);
		await AsyncStorage.removeItem(key);
	} catch (e) {
		console.error('Error clearing cache:', e);
	}
};

/**
 * Decrements the unread count for a specific feed in the tree cache.
 * 
 * @param feedId - The ID of the feed to update.
 * @param count - The number of items to decrement.
 */
export const decrementUnreadCount = async (feedId: number, count: number): Promise<void> => {
	try {
		const tree = await getCache<any[]>('/feeds/tree.json');
		if (Array.isArray(tree)) {
			const updatedTree = tree.map(entry => {
				if (entry && entry.feed && entry.feed.id === feedId) {
					const currentCount = entry.feed.count !== undefined ? entry.feed.count : entry.unread_count;
					const newCount = currentCount !== undefined ? Math.max(0, currentCount - count) : undefined;
					return { ...entry, feed: { ...entry.feed, count: newCount } };
				}
				return entry;
			}).filter(entry => {
				if (!entry || !entry.feed) return true;
				if (entry.feed.id === feedId) {
					return entry.feed.count === undefined || entry.feed.count > 0;
				}
				return true;
			});
			await setCache('/feeds/tree.json', updatedTree);
		}
	} catch (e) {
		console.error('Error decrementing unread count in cache:', e);
	}
};

/**
 * Marks items as read in the local cache and updates the unread count in the tree cache.
 * 
 * @param feedId - The ID of the feed the items belong to.
 * @param itemIds - The IDs of the items to mark as read.
 */
export const markItemsReadInCache = async (feedId: number, itemIds: number[]): Promise<void> => {
	try {
		const itemCachePath = `/feeds/${feedId}.json`;
		const cachedItems = await getCache<any[]>(itemCachePath);
		let preciseCount: number | undefined;

		if (cachedItems) {
			const newData = cachedItems.filter(item => item && item.id && !itemIds.includes(item.id));
			await setCache(itemCachePath, newData);
			preciseCount = newData.length;
		}

		const tree = await getCache<any[]>('/feeds/tree.json');
		if (Array.isArray(tree)) {
			const updatedTree = tree.map(entry => {
				if (entry && entry.feed && entry.feed.id === feedId) {
					const currentCount = entry.feed.count !== undefined ? entry.feed.count : entry.unread_count;
					const newCount = preciseCount !== undefined ? preciseCount : (currentCount !== undefined ? Math.max(0, currentCount - itemIds.length) : undefined);
					return { ...entry, feed: { ...entry.feed, count: newCount } };
				}
				return entry;
			}).filter(entry => {
				if (!entry || !entry.feed) return true;
				if (entry.feed.id === feedId) {
					return entry.feed.count === undefined || entry.feed.count > 0;
				}
				return true;
			});
			await setCache('/feeds/tree.json', updatedTree);
		}
	} catch (e) {
		console.error('Error marking items read in cache:', e);
	}
};
export const markAllItemsReadInCache = async (feedId: number): Promise<void> => {
	try {
		const itemCachePath = `/feeds/${feedId}.json`;
		await setCache(itemCachePath, []);
		
		const tree = await getCache<any[]>('/feeds/tree.json');
		if (Array.isArray(tree)) {
			const updatedTree = tree.filter(entry => {
				if (entry && entry.feed && entry.feed.id === feedId) {
					return false;
				}
				return true;
			});
			await setCache('/feeds/tree.json', updatedTree);
		}
	} catch (e) {
		console.error('Error marking all items read in cache:', e);
	}
};
