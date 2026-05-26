# Specification: Add Scrollbar and Title to Feed Item Detail

## Overview
This track adds a visible scrollbar to the feed item detail screen and displays the feed item's title at the top of the content area.

## Functional Requirements
- **Feed Item Title:**
  - Display the feed item title above the detail content.
  - The title should act as an "Inline Header" (it scrolls along with the content, not sticky).
  - If the title is long, it should be truncated to save space (e.g., maximum 2 lines with an ellipsis).
- **Scrollbar:**
  - Enable a visible scrollbar on the feed item detail screen's main content area.
  - The scrollbar should follow the default native behavior (visible only while scrolling).

## Non-Functional Requirements
- The title should be styled to be distinct from the body content (e.g., larger font, bolder weight), adhering to existing app typography.
- HTML entities in the title must be correctly decoded (per existing app behavior).

## Acceptance Criteria
- [ ] Navigating to a feed item detail screen displays the item's title at the top of the scrolling content.
- [ ] Long titles are truncated with an ellipsis and do not push content excessively down.
- [ ] Scrolling the content area reveals a native scrollbar.
- [ ] The title scrolls out of view as the user scrolls down the content.
- [ ] Unit/Component tests are written and pass for the new title rendering and truncation logic.
- [ ] Unit/Component tests are written and pass to verify the `ScrollView` (or equivalent component) is configured with `showsVerticalScrollIndicator={true}`.

## Out of Scope
- Making the title a sticky header.
- Forcing the scrollbar to be permanently visible.