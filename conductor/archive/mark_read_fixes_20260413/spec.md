# Specification: Mark-as-Read Logic Fixes (Offline & Detail View)

**Overview:**
This track addresses two critical issues related to the "Mark As Read" functionality:
1.  **Unexpected Automatic Mark-as-Read:** Items are being marked as read automatically upon viewing the detail screen.
2.  **Stale Offline Feed List:** When the last unread item of a feed is marked as read while offline, the feed remains in the `FeedListScreen` until an online refresh occurs.

**Functional Requirements:**
1.  **Disable Automatic Mark-as-Read:**
    -   Remove automatic `mark_as_read` triggers in `FeedItemDetailScreen`. Items must only be marked read via explicit actions.
2.  **Correct Offline Feed List Pruning:**
    -   When an item is marked as read offline (via any method), the app must update the local cache for both the item list *and* the feed list (`/feeds/tree.json`).
    -   If a feed no longer has unread items in the local cache, it must be removed from the `FeedListScreen` immediately, even when offline.

**Non-Functional Requirements:**
-   **Consistency:** The UI should immediately reflect local state changes made while offline.

**Acceptance Criteria:**
-   [ ] Viewing an item's details does not mark it as read.
-   [ ] Marking the final unread item of a feed as read while offline immediately removes that feed from the `FeedListScreen`.
-   [ ] Manual "Mark As Read" actions continue to work correctly online and offline.

**Out of Scope:**
-   Redesigning the feed list or detail screen.
-   Implementing automated background pruning (focus is on user-triggered actions).