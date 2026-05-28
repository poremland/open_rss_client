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
import * as cacheHelper from '../helpers/cache_helper';

export default function useCache() {
	const getCache = useCallback(<T>(url: string) => cacheHelper.getCache<T>(url), []);
	const setCache = useCallback((url: string, data: any) => cacheHelper.setCache(url, data), []);
	const clearCache = useCallback((url: string) => cacheHelper.clearCache(url), []);
	const markItemsReadInCache = useCallback((feedId: string | number, itemIds: (string | number)[]) => cacheHelper.markItemsReadInCache(feedId, itemIds), []);
	const markAllItemsReadInCache = useCallback((feedId: string | number) => cacheHelper.markAllItemsReadInCache(feedId), []);
	const getCacheStats = useCallback(() => cacheHelper.getCacheStats(), []);
	const clearAllCache = useCallback(() => cacheHelper.clearAllCache(), []);

	return {
		getCache,
		setCache,
		clearCache,
		markItemsReadInCache,
		markAllItemsReadInCache,
		getCacheStats,
		clearAllCache,
	};

}
