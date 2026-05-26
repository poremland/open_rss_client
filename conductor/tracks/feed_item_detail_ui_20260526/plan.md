# Implementation Plan: Add Scrollbar and Title to Feed Item Detail

## Phase 1: Update Feed Item Detail Screen
- [ ] Task: Write Tests for Feed Item Detail Title and Scrollbar
    - [ ] Update or create tests in `__tests__/FeedItemDetailScreen.test.tsx` to verify that the feed item title is rendered correctly when provided.
    - [ ] Update or create tests to verify that the title text is truncated correctly (e.g., `numberOfLines={2}`).
    - [ ] Update or create tests to ensure the main content `ScrollView` has `showsVerticalScrollIndicator={true}`.
- [ ] Task: Implement Title and Scrollbar on Feed Item Detail Screen
    - [ ] Modify `app/FeedItemDetailScreen.tsx` (and/or its styles) to include a `Text` component for the title at the top of the content area.
    - [ ] Apply styles to the title for distinct typography (larger font, bold) and truncation (`numberOfLines={2}`).
    - [ ] Ensure HTML entities in the title are decoded using the `he` library.
    - [ ] Update the main `ScrollView` in the screen to include `showsVerticalScrollIndicator={true}`.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Update Feed Item Detail Screen' (Protocol in workflow.md)