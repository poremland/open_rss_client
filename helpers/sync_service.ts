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
import * as syncHelper from './sync_helper';
import { api } from './api_helper';
import { performProactiveFetch } from './background_sync';

export const syncService = {
	isSynchronizing: false,

	synchronize: async () => {
		if (syncService.isSynchronizing) return;
		syncService.isSynchronizing = true;
		console.log('Sync service: synchronization started');

		try {
			// 1. Process sync queue (actions taken while offline)
			const queue = await syncHelper.getQueue();
			if (queue.length > 0) {
				console.log(`Sync service: processing ${queue.length} actions`);
				const remainingQueue: syncHelper.SyncAction[] = [];

				for (const action of queue) {
					try {
						console.log(`Sync service: executing ${action.type} ${action.path}`);
						if (action.type === 'GET') {
							await api.getWithAuth(action.path);
						} else if (action.type === 'POST') {
							await api.postWithAuth(action.path, action.body);
						} else if (action.type === 'PUT') {
							await api.putWithAuth(action.path, action.body);
						}
						console.log(`Sync service: success ${action.type} ${action.path}`);
					} catch (e) {
						console.error(`Sync service: error synchronizing action ${action.type} ${action.path}:`, e);
						remainingQueue.push(action);
					}
				}

				await syncHelper.replaceQueue(remainingQueue);
				console.log(`Sync service: queue processed, ${remainingQueue.length} items remaining`);
			}

			// 2. Perform proactive fetch to warm the cache
			await performProactiveFetch();
		} finally {
			console.log('Sync service: synchronization finished');
			syncService.isSynchronizing = false;
		}
	}
};
