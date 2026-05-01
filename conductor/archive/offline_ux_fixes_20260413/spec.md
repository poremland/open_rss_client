# Specification: Offline UX & Tree Pruning Bug Fixes

**Overview:**
This track addresses UI/UX regressions and a critical data corruption bug in the offline mode:
1.  **Ghost Error Messages:** Screens display network errors even when successfully serving cached content.
2.  **Tree Pruning Corruption:** Marking items as read offline causes the entire feed list to disappear until the app goes online.

**Functional Requirements:**
1.  **Clean Offline UI:**
    -   In `useApi`, if a network request fails but cached data is successfully retrieved and displayed, the error state should be cleared to avoid confusing the user.
    -   Specifically address \"Network request failed\" in list views and \"No cached data available offline\" in the detail view when `initialData` or cache is present.
2.  **Robust Offline Tree Pruning:**
    -   Fix the logic in `decrementUnreadCount` (or its usage) that causes the `/feeds/tree.json` cache to be corrupted or emptied prematurely when marking items as read offline.
    -   Ensure that marking one feed's items as read does not affect the visibility of other feeds in the tree.

**Non-Functional Requirements:**
-   **Data Integrity:** Local cache updates must be atomic and preserve unrelated data.
-   **UI Clarity:** Error messages should only be shown if the app is unable to provide any content (live or cached).

**Acceptance Criteria:**
-   [ ] Refreshing feeds while offline shows the cached list WITHOUT a \"Network request failed\" message.
-   [ ] Viewing a cached feed item detail while offline does NOT show \"No cached data available offline\".
-   [ ] Marking the last item of a feed as read while offline correctly removes that feed but KEEPS other feeds with unread items in the list.

**Out of Scope:**
-   Adding new offline features.
-   Modifying the server-side API.