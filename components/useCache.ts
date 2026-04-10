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
import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useCache() {
	const getCacheKey = (url: string) => `cache:${url}`;

	const getCache = useCallback(async <T>(url: string): Promise<T | null> => {
		try {
			const jsonValue = await AsyncStorage.getItem(getCacheKey(url));
			return jsonValue != null ? JSON.parse(jsonValue) : null;
		} catch (e) {
			console.error('Error reading cache:', e);
			return null;
		}
	}, []);

	const setCache = useCallback(async (url: string, value: any): Promise<void> => {
		try {
			const jsonValue = JSON.stringify(value);
			await AsyncStorage.setItem(getCacheKey(url), jsonValue);
		} catch (e) {
			console.error('Error saving cache:', e);
		}
	}, []);

	const clearCache = useCallback(async (url: string): Promise<void> => {
		try {
			await AsyncStorage.removeItem(getCacheKey(url));
		} catch (e) {
			console.error('Error clearing cache:', e);
		}
	}, []);

	return {
		getCache,
		setCache,
		clearCache,
	};
}
