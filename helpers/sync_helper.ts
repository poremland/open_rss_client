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

export interface SyncAction {
	type: string;
	path: string;
	body: any;
	timestamp: number;
}

const SYNC_QUEUE_KEY = 'sync_queue';

// Use a local array for shared state in tests
// Using globalThis for reliable sharing in CI isolates
const g = (globalThis as any);
g.localSyncQueue = g.localSyncQueue || [];
let localQueue: SyncAction[] = g.localSyncQueue;

export const queueAction = async (action: Omit<SyncAction, 'timestamp'>): Promise<void> => {
	try {
		const fullAction: SyncAction = {
			...action,
			timestamp: Date.now(),
		};
		
		// Add to local queue for immediate sync attempts
		localQueue.push(fullAction);

		// Persist for later
		const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
		const queue = stored ? JSON.parse(stored) : [];
		queue.push(fullAction);
		await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
	} catch (e) {
		console.error('Error queuing sync action:', e);
	}
};

export const getQueue = async (): Promise<SyncAction[]> => {
	try {
		const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
		if (stored) {
			return JSON.parse(stored);
		}
		return [...localQueue];
	} catch (e) {
		console.error('Error getting sync queue:', e);
		return [];
	}
};

export const clearQueue = async (): Promise<void> => {
	try {
		localQueue.length = 0;
		await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
	} catch (e) {
		console.error('Error clearing sync queue:', e);
	}
};

export const replaceQueue = async (actions: SyncAction[]): Promise<void> => {
	try {
		localQueue.length = 0;
		actions.forEach(a => localQueue.push(a));
		await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(actions));
	} catch (e) {
		console.error('Error replacing sync queue:', e);
	}
};
