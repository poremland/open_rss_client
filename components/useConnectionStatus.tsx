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
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Network from 'expo-network';

interface ConnectionContextType {
	isConnected: boolean;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isConnected, setIsConnected] = useState<boolean>(true);

	useEffect(() => {
		let isMounted = true;
		let subscription: { remove: () => void } | undefined;

		async function setup() {
			try {
				const state = await Network.getNetworkStateAsync();
				if (isMounted && state.isConnected !== undefined) {
					setIsConnected(state.isConnected);
				}
			} catch (error) {
				console.error('Error setting up initial connection status:', error);
			}
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
	}, []);

	return (
		<ConnectionContext.Provider value={{ isConnected }}>
			{children}
		</ConnectionContext.Provider>
	);
};

export default function useConnectionStatus() {
	const context = useContext(ConnectionContext);
	const [mockState, setMockState] = useState({ isConnected: true });

	useEffect(() => {
		if (context !== undefined) return;
		const g = (globalThis as any);
		if (g.__useConnectionStatusMock) {
			const listener = (s: any) => setMockState(s);
			g.__useConnectionStatusMock.listeners.push(listener);
			setMockState({ isConnected: g.__useConnectionStatusMock.isConnected });
			return () => {
				g.__useConnectionStatusMock.listeners = g.__useConnectionStatusMock.listeners.filter((l: any) => l !== listener);
			};
		}
	}, [context]);

	if (context !== undefined) {
		return context;
	}

	const g = (globalThis as any);
	if (g.__useConnectionStatusMock) {
		return mockState;
	}
	return { isConnected: true };
}
