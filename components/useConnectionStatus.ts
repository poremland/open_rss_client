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
import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export default function useConnectionStatus() {
	const [isConnected, setIsConnected] = useState<boolean>(true);

	useEffect(() => {
		let isMounted = true;
		let listener: { remove: () => void } | undefined;

		async function setup() {
			try {
				const state = await Network.getNetworkStateAsync();
				if (isMounted && state.isConnected !== undefined && state.isConnected !== isConnected) {
					setIsConnected(state.isConnected);
				}

				const l = await Network.addNetworkStateListenerAsync((state) => {
					if (isMounted && state.isConnected !== undefined) {
						setIsConnected(state.isConnected);
					}
				});

				if (isMounted) {
					listener = l;
				} else {
					l.remove();
				}
			} catch (error) {
				console.error('Error setting up connection status:', error);
			}
		}

		setup();

		return () => {
			isMounted = false;
			if (listener) {
				listener.remove();
			}
		};
	}, []);

	return {
		isConnected,
	};
}
