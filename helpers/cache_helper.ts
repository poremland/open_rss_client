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
// Using globalThis for reliable sharing in CI isolates
const g = (globalThis as any);
g.localCacheMap = g.localCacheMap || new Map<string, string>();
const localCacheMap: Map<string, string> = g.localCacheMap;

export const clearLocalCache = () => {
	localCacheMap.clear();
};

export const getCache = async <T>(url: string): Promise<T | null> => {
	try {
		const key = getCacheKey(url);

		// Try local map first
		const localValue = localCacheMap.get(key);
		if (localValue) {
			return JSON.parse(localValue);
		}

		// Fallback to AsyncStorage
		const storedValue = await AsyncStorage.getItem(key);
		if (storedValue) {
			localCacheMap.set(key, storedValue);
			return JSON.parse(storedValue);
		}
	} catch (e) {
		console.error('Error getting cache:', e);
	}
	return null;
};

export const setCache = async (url: string, data: any): Promise<void> => {
	try {
		const key = getCacheKey(url);
		const value = JSON.stringify(data);
		localCacheMap.set(key, value);
		await AsyncStorage.setItem(key, value);
	} catch (e) {
		console.error('Error setting cache:', e);
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

export const markItemsReadInCache = async (feedId: string | number, itemIds: (string | number)[]): Promise<void> => {
	try {
		const path = `/feeds/${feedId}.json`;
		const cachedItems = await getCache<any[]>(path);
		if (cachedItems) {
			const updatedItems = cachedItems.filter(item => !itemIds.includes(item.id));
			if (updatedItems.length > 0) {
				await setCache(path, updatedItems);
			} else {
				await clearCache(path);
			}
		}

		// Clear individual item caches
		for (const itemId of itemIds) {
			await clearCache(`/feed_items/${itemId}.json`);
		}

		// Update feed tree if it exists
		const treePath = '/feeds/tree.json';
		const tree = await getCache<any[]>(treePath);
		if (tree) {
			const updatedTree = tree.map(entry => {
				if (entry.feed.id.toString() === feedId.toString()) {
					const currentCount = entry.feed.count !== undefined ? entry.feed.count : entry.unread_count;
					const newCount = currentCount !== undefined ? Math.max(0, currentCount - itemIds.length) : undefined;
					return {
						...entry,
						unread_count: newCount,
						feed: {
							...entry.feed,
							count: newCount
						}
					};
				}
				return entry;
			}).filter(entry => {
				const count = entry.feed.count !== undefined ? entry.feed.count : entry.unread_count;
				return count === undefined || count > 0;
			});
			await setCache(treePath, updatedTree);
		}
	} catch (e) {
		console.error('Error marking items read in cache:', e);
	}
};

export const markAllItemsReadInCache = async (feedId: string | number): Promise<void> => {
	try {
		const path = `/feeds/${feedId}.json`;
		await clearCache(path);

		// Update feed tree if it exists
		const treePath = '/feeds/tree.json';
		const tree = await getCache<any[]>(treePath);
		if (tree) {
			const updatedTree = tree.filter(entry => {
				if (entry.feed.id.toString() === feedId.toString()) {
					return false;
				}
				return true;
			});
			await setCache(treePath, updatedTree);
		}
	} catch (e) {
		console.error('Error marking all items read in cache:', e);
	}
};

export const clearAllCache = async () => {
	try {
		const allKeys = await AsyncStorage.getAllKeys();
		const cacheKeys = allKeys.filter(k => k.startsWith('cache:'));
		await AsyncStorage.multiRemove(cacheKeys);
		localCacheMap.clear();
	} catch (e) {
		console.error('Error clearing all cache:', e);
	}
};

export const getCacheStats = async () => {
	try {
		const allKeys = await AsyncStorage.getAllKeys();
		const cacheKeys = allKeys.filter(k => k.startsWith('cache:'));

		let cachedFeeds = 0;
		let cachedItems = 0;
		let totalSize = 0;

		const pairs = await AsyncStorage.multiGet(cacheKeys);
		for (const [key, value] of pairs) {
			if (value) {
				totalSize += value.length;
				if (key.includes('/feeds/') && key.endsWith('.json') && !key.includes('tree.json') && !key.includes('all.json')) {
					cachedFeeds++;
					try {
						const items = JSON.parse(value);
						if (Array.isArray(items)) {
							cachedItems += items.length;
						}
					} catch (e) {
						// Not a list, ignore
					}
				}
			}
		}

		const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');

		return {
			cachedFeeds,
			cachedItems,
			totalSize,
			lastSyncTime
		};
	} catch (e) {
		console.error('Error getting cache stats:', e);
		return {
			cachedFeeds: 0,
			cachedItems: 0,
			totalSize: 0,
			lastSyncTime: null
		};
	}
};
