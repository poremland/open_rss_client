# Specification: Offline Support Reliability & Proactive Caching

**Overview:**
The application has reliability issues with its "Occasionally Connected Mode" (Offline Support). Specifically, it fails to dynamically detect connectivity changes (online to offline and vice versa) and does not proactively cache feed items unless a specific feed is selected. Additionally, certain UI elements (Global Menu) do not consistently respect the offline state by disabling online-only actions.

**Functional Requirements:**
1.  **Automatic Connectivity Transition:**
    -   When the device transitions from offline (e.g., Airplane Mode) to online, the app must automatically detect the change and update its state without requiring a restart.
    -   When the device transitions from online to offline, the app must automatically detect the change and update its state.
2.  **Proactive Caching:**
    -   Upon initialization or while online, the app must proactively fetch and cache unread items for *all* feeds with unread counts, ensuring they are available for offline reading even if the user hasn't opened each feed individually.
3.  **Context-Aware Menu:**
    -   The `GlobalDropdownMenu` must dynamically disable or hide online-only actions (`Add Feed`, `Manage Feeds`, `Import/Export OPML`) when offline.

**Non-Functional Requirements:**
-   **Reliability:** Connectivity detection should be responsive and consistent across all platforms (Android, iOS, Web).
-   **Efficiency:** Proactive caching should not excessively consume data or battery.

**Acceptance Criteria:**
-   [ ] Toggling connectivity while the app is running triggers an immediate state change in the UI.
-   [ ] Opening the app online, then going offline without selecting a feed, still allows reading of all unread items for all feeds.
-   [ ] Online-only menu items are visually disabled and non-interactive when the app is in offline mode.
-   [ ] All tests pass across supported platforms.

**Out of Scope:**
-   Fixing server-side synchronization issues (unless directly caused by client-side state failures).
-   Redesigning the UI layout (beyond the menu state updates).