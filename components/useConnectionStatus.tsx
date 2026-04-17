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
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Network from 'expo-network';

interface ConnectionContextType {
	isConnected: boolean;
	updateConnectionStatus: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isConnected, setIsConnected] = useState<boolean>(true);

	const updateConnectionStatus = useCallback(async () => {
		try {
			const state = await Network.getNetworkStateAsync();
			if (state.isConnected !== undefined) {
				setIsConnected(state.isConnected);
			}
		} catch (error) {
			console.error('Error updating connection status:', error);
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		let subscription: { remove: () => void } | undefined;

		async function setup() {
			await updateConnectionStatus();
		}

		setup();

		try {
			subscription = Network.addNetworkStateListener((state) => {
				if (isMounted && state.isConnected !== undefined) {
					setIsConnected(state.isConnected);
				}
			});
		} catch (error) {
			console.error('Error adding network state listener:', error);
		}

		return () => {
			isMounted = false;
			if (subscription) {
				subscription.remove();
			}
		};
	}, [updateConnectionStatus]);

	return (
		<ConnectionContext.Provider value={{ isConnected, updateConnectionStatus }}>
			{children}
		</ConnectionContext.Provider>
	);
};

export default function useConnectionStatus() {
	const context = useContext(ConnectionContext);
	const g = (globalThis as any);
	const [mockState, setMockState] = useState({ 
		isConnected: g.__useConnectionStatusMock ? g.__useConnectionStatusMock.isConnected : true,
		updateConnectionStatus: g.__useConnectionStatusMock ? g.__useConnectionStatusMock.updateConnectionStatus : async () => {},
	});

	useEffect(() => {
		if (context !== undefined) return;
		if (g.__useConnectionStatusMock) {
			const listener = (s: any) => {
				setMockState(prev => ({ ...prev, ...s }));
			};
			g.__useConnectionStatusMock.listeners.push(listener);
			return () => {
				const index = g.__useConnectionStatusMock.listeners.indexOf(listener);
				if (index > -1) {
					g.__useConnectionStatusMock.listeners.splice(index, 1);
				}
			};
		}
	}, [context]);

	if (context !== undefined) {
		return context;
	}

	if (g.__useConnectionStatusMock) {
		return mockState;
	}
	return { 
		isConnected: true,
		updateConnectionStatus: async () => {},
	};
}
