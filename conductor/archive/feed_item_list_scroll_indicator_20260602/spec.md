# Specification: Scroll Indicator for Feed Item List

## Overview
This specification details the addition of a scroll progress indicator to the Feed Item List screen (`FeedItemListScreen.tsx`). The indicator will provide real-time visual feedback to users showing how far they have scrolled through the list of feed items. The implementation will mirror the design and behavior of the existing scroll progress indicator found on the Feed Item Detail screen (`FeedItemDetailScreen.tsx`).

## Functional Requirements
1. **Visual Indicator:**
   - On mobile platforms (iOS/Android), a horizontal scroll progress bar will be displayed at the very top of the `FeedItemListScreen` (pinned just below the screen header and above the scrollable list).
   - The scroll progress bar will dynamically fill from 0% (at the very top of the list) to 100% (when scrolled to the very bottom of the list).
   - The bar will have a height of 4dp and use a sleek high-contrast blue color (`#007AFF`), sitting inside a light grey background track (`rgba(0, 0, 0, 0.05)`).
   - The native vertical scroll indicator for the list itself will be hidden on mobile platforms.

2. **Web Compatibility:**
   - On Web, the custom horizontal progress bar will NOT be displayed.
   - On Web, the native vertical scroll indicator of the list will remain visible.

3. **Performance:**
   - The scroll events will be throttled at `16ms` (approx. 60fps) to ensure responsive and smooth progress updates without impacting rendering performance.
   - Calculations will correctly handle edge cases (e.g., empty lists, single-item lists that do not scroll, division by zero/NaN).

## Non-Functional Requirements
- **Maintainability:** Ensure the scroll logic is reusable or cleanly integrated into existing list components (`ListScreen` and `SelectableFlatList`).
- **Tests:** Add unit tests using `bun test` to verify calculations and correct rendering of the progress bar across platforms.

## Acceptance Criteria
- [ ] On iOS and Android, the custom progress bar is visible at the top of the feed item list.
- [ ] The custom progress bar updates dynamically as the user scrolls.
- [ ] The native vertical scrollbar is hidden on iOS/Android for the feed item list.
- [ ] On Web, the native scrollbar is visible, and the custom progress bar is NOT rendered.
- [ ] Unit tests are written and all tests pass with clean test execution and coverage.
