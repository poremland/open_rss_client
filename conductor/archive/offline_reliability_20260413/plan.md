# Implementation Plan: Offline Support Reliability & Proactive Caching

## Phase 1: Connectivity Detection Reliability [checkpoint: d58c6a4]
This phase focuses on ensuring the app dynamically responds to network state changes.

- [x] Task: Audit and fix `ConnectionProvider` and `useConnectionStatus`. b0ed42b
    - [x] Create a test case to simulate network state transitions.
    - [x] Verify `expo-network` event listeners are correctly registered and triggering state updates in `ConnectionProvider`.
    - [x] Update `useConnectionStatus` to reliably consume the global connectivity state.

## Phase 2: Proactive Caching Implementation [checkpoint: 73562ce]
This phase ensures all unread content is available offline, even if the feed wasn't opened.

- [x] Task: Implement proactive caching for all feeds. 213ca7f
    - [x] Update the `backgroundSyncTask` or `useSync` to iterate through all feeds with unread items.
    - [x] Fetch and cache unread items for each feed upon initial load or when connectivity is restored.
    - [x] Create unit tests to verify that items for all feeds are stored in the local cache when online.

## Phase 3: Global Menu Offline State [checkpoint: b26df7f]
This phase ensures the UI correctly reflects the offline state by disabling restricted actions.

- [x] Task: Update `GlobalDropdownMenu` for offline support. 1885aa4
    - [x] Use `useConnectionStatus` in `GlobalDropdownMenu.impl.tsx`.
    - [x] Visually disable and prevent interactions for "Add Feed", "Manage Feeds", and "Import/Export OPML" when offline.
    - [x] Create component tests to verify the disabled state of these menu items when offline.

## Phase 4: Integration & Regression Testing
This phase ensures the fixes work together and haven't introduced regressions.

- [x] Task: Perform end-to-end verification. f28f2b0
    - [x] Verify that Airplane Mode transitions trigger immediate UI updates.
    - [x] Verify that all unread items are available offline without pre-selecting feeds.
    - [x] Verify that all menu actions are correctly enabled/disabled.
- [x] Task: Conductor - User Manual Verification 'Phase 4: Integration & Regression Testing' (Protocol in workflow.md) f28f2b0