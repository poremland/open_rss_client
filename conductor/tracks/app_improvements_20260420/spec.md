# Specification: App Improvements

## Overview
This track focuses on several quality-of-life and performance improvements for the Open RSS Client. The goal is to enhance caching behavior, ensure application resilience when local data is cleared, improve the initial load experience by leveraging cached data, and provide users with transparency regarding app and synchronization status via a new "About" screen.

## Functional Requirements
1.  **Cache Management - Read Items:**
    *   The application must automatically clear cached feed items once they have been marked as read.
    *   *Important Caveat:* This clearing should only happen **after** the item has been successfully marked as read on the server.
    *   *Verification:* Comprehensive automated tests must be written to verify this behavior.
2.  **Cache Resilience:**
    *   The application must gracefully handle scenarios where the user manually clears the device's app cache or storage (e.g., via OS settings). It should not crash or enter an unrecoverable state, gracefully falling back to network requests or an empty state as appropriate.
    *   *Verification:* Comprehensive automated tests must be written to verify this resilience.
3.  **Initial Load - Cached Feed List:**
    *   Upon application startup, if cached feed list items exist, they must be immediately displayed in the Feed List screen without requiring the user to manually refresh or wait for a network request to complete.
    *   *Verification:* Comprehensive automated tests must be written to verify this behavior.
4.  **"About" Screen & Menu Item:**
    *   A new "About" menu item must be added to the global dropdown menu (accessible from all screens, similar to the "Logout" option).
    *   Selecting "About" navigates to a new screen displaying:
        *   **App Information:** App Name, Version (Bump to 1.6.1), Copyright/License info, and a link to the Open Source Project (https://github.com/poremland/open_rss_client/).
        *   **User Information:** Currently connected Server URL and Logged-in Username.
        *   **Sync Status:** Last sync time, number of cached feeds, number of cached feed items, and total cached size.
        *   **Actions:** A manual "Clear Cache" button to clear all locally cached feeds and items.
    *   *Verification:* Comprehensive automated tests must be written to verify the presence of the menu item, the screen rendering, the accuracy of the displayed information, and the clear cache functionality.

## Non-Functional Requirements
*   **Performance:** The changes must align with the track's primary goal of "Increased Performance", ensuring that cache management and initial loads are fast and non-blocking.
*   **Testing:** All new features and modifications must follow Test-Driven Development (TDD) as per the project workflow, heavily emphasizing robust test coverage.

## Out of Scope
*   Major UI redesigns unrelated to the "About" screen or initial load states.
*   Changes to the backend RSS Aggregator API.
