# Implementation Plan: Mark-as-Read Logic Fixes (Offline & Detail View)

## Phase 1: Disable Automatic Mark-as-Read
Remove the regression where items are marked read automatically.

- [x] Task: Update `FeedItemDetailScreen.tsx`. 5afaa18
    - [x] Remove the `useEffect` that calls `markItemAsRead` on focus.
    - [x] Verify that viewing an item no longer triggers an API call or cache update for "mark as read".
    - [x] Create/Update test case to ensure no automatic call occurs.

## Phase 2: Offline Feed List Pruning [checkpoint: 04c84a6]
Ensure the feed list is updated when items are marked read offline.

- [x] Task: Update offline action handlers in `FeedItemListScreen.tsx` and `FeedItemDetailScreen.tsx`. e24aab7
    - [x] Implement a shared helper or logic to update the `/feeds/tree.json` cache when an item is marked read offline.
    - [x] Ensure that if an item is marked read, the corresponding feed's `unread_count` is decremented in the cached tree.
    - [x] If `unread_count` reaches zero, remove the feed from the cached tree.
    - [x] Create unit tests to verify tree cache updates when marking items as read offline.

## Phase 3: Verification
- [ ] Task: Perform end-to-end verification.
    - [ ] Verify viewing item doesn't mark read.
    - [ ] Verify offline pruning of feed list.
- [ ] Task: Conductor - User Manual Verification 'Mark-as-Read Fixes' (Protocol in workflow.md)
## Phase: Review Fixes
- [x] Task: Apply review suggestions e776c34
