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
let currentAsyncStorage: any = null;

const getAsyncStorage = () => {
	if (currentAsyncStorage) return currentAsyncStorage;
	if ((globalThis as any).AsyncStorage) return (globalThis as any).AsyncStorage;
	try {
		return require('@react-native-async-storage/async-storage').default;
	} catch (e) {
		return null;
	}
};

export const setAsyncStorage = (s: any) => {
	currentAsyncStorage = s;
};

export const getCacheKey = (url: string) => `cache:${url}`;

export const getCache = async <T>(url: string): Promise<T | null> => {
	try {
		const AsyncStorage = getAsyncStorage();
		if (!AsyncStorage) {
			return null;
		}
		const key = getCacheKey(url);
		const jsonValue = await AsyncStorage.getItem(key);
		return jsonValue != null ? JSON.parse(jsonValue) : null;
	} catch (e) {
		console.error('Error reading cache:', e);
		return null;
	}
};

export const setCache = async (url: string, value: any): Promise<void> => {
	try {
		const AsyncStorage = getAsyncStorage();
		if (!AsyncStorage) {
			return;
		}
		const key = getCacheKey(url);
		const jsonValue = JSON.stringify(value);
		await AsyncStorage.setItem(key, jsonValue);
	} catch (e) {
		console.error('Error saving cache:', e);
	}
};

export const clearCache = async (url: string): Promise<void> => {
	try {
		const AsyncStorage = getAsyncStorage();
		if (!AsyncStorage) return;
		await AsyncStorage.removeItem(getCacheKey(url));
	} catch (e) {
		console.error('Error clearing cache:', e);
	}
};
