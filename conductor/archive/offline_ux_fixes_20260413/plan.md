# Implementation Plan: Offline UX & Tree Pruning Bug Fixes (Revised)

## Phase 1: Fix Tree Pruning Corruption
The entire feed list disappears because of incorrect property access and aggressive filtering in `decrementUnreadCount`.

- [x] Task: Update `decrementUnreadCount` in `cache_helper.ts`. (Cleaned up and replaced with ID-based pruning) 3ec8dfa
    - [x] Use `entry.feed.count` instead of `entry.unread_count`. 3ec8dfa
    - [x] Fix the filter to allow entries where `feed.count` is undefined (though it should be a number). 3ec8dfa
    - [x] Add a unit test with multiple feeds to ensure only the target feed is pruned. 3ec8dfa

## Phase 2: Fix Ghost Error Messages
Error messages should not be displayed if data is successfully served from cache or initial data.

- [x] Task: Refactor error handling in `useApi.ts`. 3ec8dfa
    - [x] Only call `setError(errorMessage)` if cached data is NOT available. 3ec8dfa
    - [x] Ensure `setError(null)` is called when cache is successfully hit. 3ec8dfa
    - [x] Prevent flickering by delaying error state update until cache check is complete. 3ec8dfa

## Phase 3: Fix Offline Sync Issue
Marking items read offline does not sync when back online.

- [x] Task: Investigate and Fix Synchronization. 3ec8dfa
    - [x] Add logging to `sync_service.ts` to track queue processing. 3ec8dfa
    - [x] Verify `markItemsReadInCache` payload and endpoint compatibility during sync. 3ec8dfa
    - [x] Ensure `useSync` correctly triggers on all connectivity transitions. 3ec8dfa

## Phase 4: Verification
- [x] Task: Perform final verification. 3ec8dfa
    - [x] Verify clean UI offline (no ghost errors). 3ec8dfa
    - [x] Verify correct pruning behavior with multiple feeds. 3ec8dfa
    - [x] Verify offline actions are successfully replayed upon reconnection. 3ec8dfa
- [x] Task: Conductor - User Manual Verification 'Offline UX, Pruning & Sync Fixes' (Protocol in workflow.md) 3ec8dfa
