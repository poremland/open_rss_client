# Implementation Plan: Connectivity Detection & Offline Detail View Bug Fixes

## Phase 1: Robust Connectivity Detection
This phase ensures the connectivity listener remains functional across API errors.

- [x] Task: Audit `ConnectionProvider` and `useApi` for state side-effects. 10f371c
    - [x] Investigate if `useApi` or `ConnectionProvider` has unhandled exceptions that crash the listener effect.
    - [x] Add error boundaries or try-catch blocks to ensure `expo-network` listeners are not inadvertently detached.
    - [x] Create a test case that simulates a network error followed by a connectivity change to verify detection persistence.

## Phase 2: Offline Feed Item Detail View
This phase ensures feed item details are available offline.

- [x] Task: Update `FeedItemDetailScreen` to use passed-in data or cache. 10f371c
    - [x] Review how `FeedItemDetailScreen` receives and loads its data.
    - [x] Ensure the screen uses the `feedItem` data passed via router params if offline.
    - [x] Verify `useApi` correctly returns cached item data when the network request is skipped or fails while offline.
    - [x] Create a test case for `FeedItemDetailScreen` to verify offline rendering using cached/passed data.

## Phase 3: Verification
- [x] Task: Perform end-to-end verification of the fixes. 10f371c
    - [x] Verify Airplane Mode toggle during refresh.
    - [x] Verify offline detail view navigation.
- [x] Task: Conductor - User Manual Verification 'Connectivity & Detail View Fixes' (Protocol in workflow.md) 10f371c