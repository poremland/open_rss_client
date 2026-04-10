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
	contentType?: string;
	timestamp: number;
}

const SYNC_QUEUE_KEY = 'sync_queue';

// Use a local array for shared state in tests
if (!(process as any).localSyncQueue) {
	(process as any).localSyncQueue = [];
}
let localQueue: SyncAction[] = (process as any).localSyncQueue;

export const queueAction = async (action: Omit<SyncAction, 'timestamp'>): Promise<void> => {
	try {
		const fullAction: SyncAction = {
			...action,
			timestamp: Date.now(),
		};
		localQueue.push(fullAction);
		await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(localQueue));
	} catch (e) {
		console.error('Error queuing sync action:', e);
	}
};

export const getQueue = async (): Promise<SyncAction[]> => {
	try {
		if (localQueue.length === 0) {
			const jsonValue = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
			if (jsonValue) {
				const queue = JSON.parse(jsonValue);
				localQueue.length = 0;
				localQueue.push(...queue);
			}
		}
		return [...localQueue];
	} catch (e) {
		console.error('Error reading sync queue:', e);
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
