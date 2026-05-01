# Implementation Plan: Offline/Online Transition Bug Fixes

## Phase 1: Implementation of Bug Fixes
- [x] Task: Review and update `useConnectionStatus` to ensure robust network state change detection (e.g., using `NetInfo.addEventListener`). 6b4847e
- [x] Task: Update or add tests in `useConnectionStatus.test.tsx` to verify reliable updates on network transitions. 6b4847e
- [x] Task: Modify API calling logic (likely in `useApi` or `api_helper`) to fallback to offline queueing if a network request fails due to no connectivity, regardless of the `isConnected` state hook. 6b4847e
- [x] Task: Add tests to verify that actions (like marking as read) are queued when a `fetch` throws a network error, even if the app believes it is online. 6b4847e
- [x] Task: Investigate the race condition between background sync queue processing and the initial feed list fetch upon reconnection. 6b4847e
- [x] Task: Implement a solution to preserve local unread count decrements until the server fetch reflects the synchronized state (e.g., process queue before fetching, or apply pending queue optimistically to fetch results). 6b4847e
- [x] Task: Update `FeedListScreen` or `useSync` tests to verify unread counts remain stable when transitioning from offline to online. 6b4847e
- [x] Task: Implement batch MARK_READ processing in `syncService` to group multiple individual offline actions by feed. f3a1d9b
- [x] Task: Coordinate FeedListScreen and FeedItemListScreen refreshes with `syncService` events to prevent premature UI updates before server synchronization. f3a1d9b
- [x] Task: Optimize `useApi` to proactively re-verify network state before requests and force status updates on network-related failures to ensure eventual reconnection detection even if system listeners fail. f3a1d9b
- [x] Task: Conductor - User Manual Verification 'Phase 1: Implementation of Bug Fixes' (Protocol in workflow.md)