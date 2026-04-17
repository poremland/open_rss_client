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

type SyncEvent = 'syncStarted' | 'syncFinished';
type SyncListener = () => void;

export const syncService = {
	isSynchronizing: false,
	listeners: {
		syncStarted: [] as SyncListener[],
		syncFinished: [] as SyncListener[],
	},

	on: (event: SyncEvent, listener: SyncListener) => {
		syncService.listeners[event].push(listener);
	},

	off: (event: SyncEvent, listener: SyncListener) => {
		syncService.listeners[event] = syncService.listeners[event].filter(l => l !== listener);
	},

	emit: (event: SyncEvent) => {
		syncService.listeners[event].forEach(l => l());
	},

	synchronize: async () => {
		if (syncService.isSynchronizing) return;
		const syncPromise = (async () => {
			syncService.isSynchronizing = true;
			syncService.emit('syncStarted');
			console.log('Sync service: synchronization started');

			try {
				// 1. Process sync queue (actions taken while offline)
				const queue = await syncHelper.getQueue();
				if (queue.length > 0) {
					console.log(`Sync service: processing ${queue.length} actions`);
					
					// Group MARK_READ actions by feed
					const markReadActions: Record<number, number[]> = {};
					const otherActions: syncHelper.SyncAction[] = [];

					for (const action of queue) {
						if (action.type === 'MARK_READ') {
							// Path is /feeds/mark_items_as_read/:feedId
							const match = action.path.match(/\/feeds\/mark_items_as_read\/(\d+)/);
							if (match) {
								const feedId = parseInt(match[1]);
								const items = JSON.parse(action.body.items);
								if (!markReadActions[feedId]) markReadActions[feedId] = [];
								markReadActions[feedId].push(...items);
							} else {
								otherActions.push(action);
							}
						} else {
							otherActions.push(action);
						}
					}

					const remainingQueue: syncHelper.SyncAction[] = [];

					// Execute batched MARK_READ actions
					for (const [feedId, itemIds] of Object.entries(markReadActions)) {
						try {
							const uniqueIds = Array.from(new Set(itemIds));
							console.log(`Sync service: batch marking ${uniqueIds.length} items as read for feed ${feedId}`);
							await api.postWithAuth(`/feeds/mark_items_as_read/${feedId}`, {
								items: JSON.stringify(uniqueIds)
							});
						} catch (e) {
							console.error(`Sync service: error batch marking read for feed ${feedId}:`, e);
							// If batch fails, we could potentially re-queue individual items or the whole batch
							// For simplicity, we'll re-queue as individual actions to be safe
							remainingQueue.push({
								type: 'MARK_READ',
								path: `/feeds/mark_items_as_read/${feedId}`,
								body: { items: JSON.stringify(itemIds) },
								timestamp: Date.now()
							});
						}
					}

					// Execute other actions
					for (const action of otherActions) {
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
				syncService.emit('syncFinished');
			}
		})();
		return syncPromise;
	}
};
