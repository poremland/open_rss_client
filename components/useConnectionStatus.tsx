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

interface ConnectionStatus {
	isConnected: boolean;
	updateConnectionStatus: () => Promise<void>;
}

const ConnectionStatusContext = createContext<ConnectionStatus | undefined>(undefined);

export const ConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [isConnected, setIsConnected] = useState(true);

	const updateConnectionStatus = useCallback(async () => {
		const status = await Network.getNetworkStateAsync();
		setIsConnected(status.isConnected ?? false);
	}, []);

	useEffect(() => {
		updateConnectionStatus();

		const subscription = Network.addNetworkStateListener((status) => {
			setIsConnected(status.isConnected ?? false);
		});

		return () => {
			subscription.remove();
		};
	}, [updateConnectionStatus]);

	return (
		<ConnectionStatusContext.Provider value={{ isConnected, updateConnectionStatus }}>
			{children}
		</ConnectionStatusContext.Provider>
	);
};

/**
 * useConnectionStatus - Custom hook to manage and provide network connection status.
 *
 * This hook offers an abstraction for checking the current network state
 * and responding to changes. It supports a mock bypass for tests, allowing
 * unit tests to verify the actual implementation while component tests
 * can use a global mock state.
 */
export default function useConnectionStatus() {
	const g = (globalThis as any);
	const context = useContext(ConnectionStatusContext);
	
	// Check for mock bypass flag
	if (g.__useConnectionStatusMock && !g.__disableConnectionMock) {
		return {
			isConnected: g.__useConnectionStatusMock.isConnected,
			updateConnectionStatus: g.__useConnectionStatusMock.updateConnectionStatus,
		};
	}

	if (context === undefined) {
		// Fallback for when not inside a provider (e.g., simple unit tests)
		// but only if we are in a testing environment
		if (g.__DEV__) {
			return {
				isConnected: g.__useConnectionStatusMock ? g.__useConnectionStatusMock.isConnected : true,
				updateConnectionStatus: g.__useConnectionStatusMock ? g.__useConnectionStatusMock.updateConnectionStatus : async () => {},
			};
		}
		throw new Error('useConnectionStatus must be used within a ConnectionProvider');
	}
	return context;
}
