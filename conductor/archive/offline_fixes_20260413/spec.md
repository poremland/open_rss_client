# Specification: Connectivity Detection & Offline Detail View Bug Fixes

**Overview:**
This track addresses two regressions identified in the Android application related to offline support:
1.  **Connectivity State Corruption:** Network errors (e.g., "Network request failed") occurring during active refreshes cause the `ConnectionProvider` to lose its ability to track future connectivity changes.
2.  **Detail View Offline Failure:** The `FeedItemDetailScreen` fails to display item content when offline, despite the item data being available from the preceding list view.

**Functional Requirements:**
1.  **Resilient Connectivity Tracking:**
    -   The `ConnectionProvider` must remain active and functional even if an API request fails with a "Network request failed" or other network-related exception.
    -   Connectivity transitions (online <-> offline) must continue to be detected and propagated globally regardless of preceding request failures.
2.  **Offline Detail View Availability:**
    -   `FeedItemDetailScreen` must prioritize using the data passed from the `FeedItemListScreen` (or cached data) when offline.
    -   The detail view should display content immediately if available in the local state/cache, rather than attempting a network request that is known to fail while offline.

**Non-Functional Requirements:**
-   **Robustness:** Error handling in `useApi` and `ConnectionProvider` must prevent state lockups.
-   **UX:** Offline reading should be seamless when the content has already been fetched/cached.

**Acceptance Criteria:**
-   [ ] Toggling Airplane Mode during a feed refresh does not prevent the app from detecting future connectivity changes.
-   [ ] Selecting a feed item while offline displays the item's details (title, content, etc.) instead of a network error.
-   [ ] Turning connectivity back on while on the detail screen successfully refreshes the content if needed.

**Out of Scope:**
-   Changing the visual design of the detail screen.
-   Implementing new caching strategies (beyond fixing the existing ones).