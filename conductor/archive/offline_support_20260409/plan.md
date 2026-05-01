# Implementation Plan: Occasionally Connected Mode (Offline Support)

## Phase 1: Offline Detection & UI Feedback
This phase focuses on detecting the connection state and providing visual indicators and action restrictions.

- [x] Task: Integrate `expo-network` or `react-native-netinfo` for connection detection. ac107bd
    - [x] Add dependency and configure.
    - [x] Create a `useConnectionStatus` hook to track online/offline state.
- [x] Task: Implement Sync Indicator in the header. 8f01226
    - [x] Update `HeaderRightMenu` or create a new header component to show sync status icon.
    - [x] Show a "disconnected" icon when offline.
- [x] Task: Restrict Feed Management actions when offline. 370935b
    - [x] Update `AddFeedScreen` to disable the "Add" button and show an offline message.
    - [x] Update `ManageFeedsListScreen` to disable deletion and OPML actions when offline.
    - [x] Disable feed deletion from the `FeedItemListScreen` menu when offline.
    - [x] Add feedback (Toast/Snackbar) for restricted actions.
- [x] Task: Conductor - User Manual Verification 'Offline Detection & UI Feedback' (Protocol in workflow.md) d123897

## Phase 2: Offline Caching & Local Persistence
This phase focuses on caching unread items and persisting them for offline reading.

- [x] Task: Design and implement local cache for unread items. b3692ec
    - [x] Use `AsyncStorage` or `expo-sqlite` (if complex) to store unread items.
    - [x] Update `useApi` or create a dedicated `useCache` hook to handle local storage.
- [x] Task: Cache unread items on fetch. b3692ec
    - [x] When fetching unread items for a feed, store them in the local cache.
    - [x] Ensure all necessary fields (HTML content, pubDate, etc.) are cached.
- [x] Task: Enable offline reading in screens. 96543f0
    - [x] Update `FeedListScreen` to load cached feed list when offline.
    - [x] Update `FeedItemListScreen` to load cached unread items when offline.
    - [x] Update `FeedItemDetailScreen` to display cached item content when offline.
- [x] Task: Conductor - User Manual Verification 'Offline Caching & Local Persistence' (Protocol in workflow.md) 96543f0

## Phase 3: Offline State Management & Synchronization
This phase focuses on tracking offline "read" states and syncing them back to the server.

- [x] Task: Queue offline "mark-as-read" actions. e661dfc
    - [x] When an item is marked as read offline, update local state and add it to a sync queue.
    - [x] Persist the sync queue in local storage.
- [x] Task: Implement Background Synchronization. b2d9a19
    - [x] Create a synchronization service/hook that watches for connectivity.
    - [x] When connection is restored, iterate through the sync queue and call the API to mark items as read.
    - [x] Handle retry logic and errors during sync.
- [x] Task: Implement Background Caching (Connected State). 2acb50b
    - [x] Use expo-task-manager and expo-background-fetch to periodically fetch and cache new items when connected.

    - [x] Ensure background task does not drain battery or data excessively.
- [x] Task: Conductor - User Manual Verification 'Offline State Management & Synchronization' (Protocol in workflow.md) 23df22d

## Phase 4: Version Bump & Final Polish
This phase covers the version update and final verification.

- [x] Task: Bump application version to 1.6.0. 9e9d16a
    - [x] Update `app.config.base.json` and `package.json` with version `1.6.0`.
- [x] Task: Final end-to-end verification of offline/online flows. 23df22d
    - [x] Verify background sync works correctly.
    - [x] Verify background caching works correctly.
- [x] Task: Conductor - User Manual Verification 'Version Bump & Final Polish' (Protocol in workflow.md) 23df22d

## Phase 5: Reliability & Edge Cases
This phase addresses bugs and improves the reliability of the occasionally connected mode.

- [x] Task: Fix Real-time Connectivity Detection. 471bc2d
    - [x] Implement `ConnectionProvider` in `_layout.tsx` to provide global connectivity state.
    - [x] Update `useConnectionStatus` to use the global provider state.
    - [x] Ensure `expo-network` listeners correctly trigger state updates across the app.
- [x] Task: Proactive Background Caching. 1a2b3c4
    - [x] Update `backgroundSyncTask` to fetch and cache unread items for *all* feeds with unread counts, not just the active feed.
    - [x] Optimize caching strategy to prioritize feeds with the most unread items.
- [x] Task: Update Global Menu to Respect Offline State. 5d6e7f8
    - [x] Update `GlobalDropdownMenu` to disable or hide online-only actions (`Add Feed`, `Manage Feeds`, `Import/Export OPML`) when offline.
    - [x] Provide visual feedback in the menu when items are disabled.
- [x] Task: Conductor - User Manual Verification 'Reliability & Edge Cases' (Protocol in workflow.md) 471bc2d
