# Track Specification: Occasionally Connected Mode (Offline Support)

## Overview
This track introduces "Occasionally Connected" support to the Open RSS Client. Users should be able to read cached unread feed items while offline, mark them as read, and have those changes synchronize back to the server once a connection is restored. The app will also periodically cache new unread items in the background while connected. Feed management actions (adding, deleting, importing, and exporting feeds) will be disabled when the device is offline to maintain data integrity.

## Functional Requirements
- **Offline Caching:**
    - The app MUST cache all unread feed items locally for all subscribed feeds when connected.
    - Cached items MUST include titles, descriptions, content (HTML), and metadata (pubDate, link, etc.).
- **Background Updates:**
    - The app SHOULD periodically download and cache new feed items in the background when a connection is available, ensuring the offline cache is up-to-date even if the app hasn't been opened recently.
- **Offline Reading:**
    - Users MUST be able to view the list of cached feeds and their unread items while offline.
    - Users MUST be able to navigate to the item detail screen and read the content of cached items while offline.
- **Offline State Management:**
    - Users MUST be able to mark items as read while offline (via swipe or batch action).
    - Offline "read" states MUST be persisted locally and queued for synchronization.
- **Synchronization:**
    - The app MUST attempt to sync queued offline changes (e.g., mark-as-read) back to the server in the background when a connection is restored.
    - The app MUST fetch new feed items from the server and update the local cache when a connection is available.
- **Connection-Aware UI:**
    - The app MUST detect the device's network connection status.
    - When offline, a "Sync Indicator" (e.g., an icon in the header) MUST show the offline state.
    - When offline, actions requiring a connection MUST be disabled or grayed out:
        - `AddFeedScreen` (Add Feed)
        - `ManageFeedsListScreen` (Delete Feed)
        - OPML Import/Export
        - Deleting a feed from any menu.
    - When offline, the app MUST provide feedback (e.g., a Toast or Snackbar) if a user attempts a restricted action.
- **Version Update:**
    - The app version MUST be bumped to `1.6.0`.

## Non-Functional Requirements
- **Performance:** Offline access to cached data should be near-instant.
- **Data Integrity:** Offline changes should be reliably queued and not lost if the app is closed.
- **User Privacy:** All cached data remains local to the device and is only synced with the authorized server.

## Acceptance Criteria
- [ ] App correctly detects offline/online transitions.
- [ ] Unread items are successfully cached when online.
- [ ] New items are cached in the background when connected.
- [ ] Cached items are visible and readable when the device is offline.
- [ ] Items marked as read offline are updated on the server when connection is restored.
- [ ] Feed management actions (add, delete, import, export) are disabled while offline.
- [ ] A sync indicator correctly reflects the connection/sync status.

## Out of Scope
- Full offline management of feeds (adding/deleting feeds while offline).
- Offline searching across all feed items (only cached items).
- Caching of external media (images, videos) not embedded in the feed content.
