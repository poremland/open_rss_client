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

// Use a local Map for the actual storage to avoid AsyncStorage issues in tests
// In production, we'll synchronize this with AsyncStorage
const getLocalMap = (): Map<string, string> => {
	if (!(process as any).localCacheMap) {
		(process as any).localCacheMap = new Map<string, string>();
	}
	return (process as any).localCacheMap;
};

export const clearLocalCache = () => {
	getLocalMap().clear();
};

export const getCache = async <T>(url: string): Promise<T | null> => {
	try {
		const key = getCacheKey(url);
		let jsonValue = getLocalMap().get(key);
		if (jsonValue === undefined) {
			jsonValue = await AsyncStorage.getItem(key) || undefined;
			if (jsonValue !== undefined) {
				getLocalMap().set(key, jsonValue);
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
		getLocalMap().set(key, jsonValue);
		// Persist to AsyncStorage
		await AsyncStorage.setItem(key, jsonValue);
	} catch (e) {
		console.error('Error saving cache:', e);
	}
};

export const clearCache = async (url: string): Promise<void> => {
	try {
		const key = getCacheKey(url);
		getLocalMap().delete(key);
		await AsyncStorage.removeItem(key);
	} catch (e) {
		console.error('Error clearing cache:', e);
	}
};

export const decrementUnreadCount = async (feedId: number, count: number = 1): Promise<void> => {
	try {
		const tree = await getCache<any[]>('/feeds/tree.json');
		if (tree) {
			const updatedTree = tree.map(entry => {
				if (entry.feed.id === feedId) {
					return { ...entry, unread_count: Math.max(0, entry.unread_count - count) };
				}
				return entry;
			}).filter(entry => entry.unread_count > 0);
			await setCache('/feeds/tree.json', updatedTree);
		}
	} catch (e) {
		console.error('Error decrementing unread count in cache:', e);
	}
};
