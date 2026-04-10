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

export const syncService = {
	isSynchronizing: false,

	synchronize: async () => {
		if (syncService.isSynchronizing) return;
		syncService.isSynchronizing = true;

		try {
			const queue = await syncHelper.getQueue();
			if (queue.length === 0) return;

			const remainingQueue: syncHelper.SyncAction[] = [];

			for (const action of queue) {
				try {
					if (action.type === 'GET') {
						await api.getWithAuth(action.path);
					} else if (action.type === 'POST') {
						await api.postWithAuth(action.path, action.body, action.contentType);
					} else if (action.type === 'PUT') {
						await api.putWithAuth(action.path, action.body, action.contentType);
					}
					// If success, we don't add to remainingQueue
				} catch (e) {
					console.error(`Error synchronizing action ${action.type} ${action.path}:`, e);
					remainingQueue.push(action);
				}
			}

			// Clear the old queue and add remaining
			await syncHelper.clearQueue();
			for (const action of remainingQueue) {
				await syncHelper.queueAction(action);
			}
		} finally {
			syncService.isSynchronizing = false;
		}
	}
};
