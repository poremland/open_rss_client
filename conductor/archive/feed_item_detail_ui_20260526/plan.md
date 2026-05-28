# Implementation Plan: Add Scrollbar and Title to Feed Item Detail

## Phase 1: Update Feed Item Detail Screen [checkpoint: 0b847b3]
- [x] Task: Write Tests for Feed Item Detail Title and Scrollbar 112cd3c
    - [x] Update or create tests in `__tests__/FeedItemDetailScreen.test.tsx` to verify that the feed item title is rendered correctly when provided.
    - [x] Update or create tests to verify that the title text is truncated correctly (e.g., `numberOfLines={2}`).
    - [x] Update or create tests to ensure the main content `ScrollView` has `showsVerticalScrollIndicator={true}`.
- [x] Task: Implement Title and Scrollbar on Feed Item Detail Screen 112cd3c
    - [x] Modify `app/FeedItemDetailScreen.tsx` (and/or its styles) to include a `Text` component for the title at the top of the content area.
    - [x] Apply styles to the title for distinct typography (larger font, bold) and truncation (`numberOfLines={2}`).
    - [x] Ensure HTML entities in the title are decoded using the `he` library.
    - [x] Update the main `ScrollView` in the screen to include `showsVerticalScrollIndicator={true}`.
- [x] Task: Conductor - User Manual Verification 'Phase 1: Update Feed Item Detail Screen' (Protocol in workflow.md) 112cd3c

## Phase 2: Fix Scrollbar Visibility on Android
- [x] Task: Update Scrollbar Style
    - [x] Modify `app/FeedItemDetailScreen.tsx` or its styles to use `indicatorStyle="black"` (or appropriate contrast) for the `ScrollView` so it's visible against the white background.
- [x] Task: Verify Scrollbar Visibility