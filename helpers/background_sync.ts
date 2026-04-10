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
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { api } from './api_helper';
import * as cacheHelper from './cache_helper';
import { Feed } from '../models/Feed';

const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_TASK';

export const backgroundSyncTask = async () => {
	try {
		console.log('Background sync task started');
		
		// 1. Fetch feeds
		const feeds = await api.getWithAuth<Feed[]>('/feeds.json');
		if (feeds) {
			await cacheHelper.setCache('/feeds.json', feeds);

			// 2. Fetch items for each feed
			for (const feed of feeds) {
				const path = `/feeds/${feed.id}.json`;
				const items = await api.getWithAuth(path);
				if (items) {
					await cacheHelper.setCache(path, items);
				}
			}
		}

		console.log('Background sync task finished successfully');
		return BackgroundFetch.BackgroundFetchResult.NewData;
	} catch (error) {
		console.error('Background sync task failed:', error);
		return BackgroundFetch.BackgroundFetchResult.Failed;
	}
};

export const registerBackgroundSync = async () => {
	try {
		if (TaskManager.isTaskDefined(BACKGROUND_SYNC_TASK)) {
			console.log(`Task ${BACKGROUND_SYNC_TASK} is already defined`);
		} else {
			TaskManager.defineTask(BACKGROUND_SYNC_TASK, backgroundSyncTask);
		}

		await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
			minimumInterval: 60 * 15, // 15 minutes
			stopOnTerminate: false,
			startOnBoot: true,
		});
		console.log(`Task ${BACKGROUND_SYNC_TASK} registered`);
	} catch (err) {
		console.error('Task registration failed:', err);
	}
};
