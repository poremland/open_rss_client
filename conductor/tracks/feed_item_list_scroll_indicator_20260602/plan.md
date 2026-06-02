# Implementation Plan: Feed Item List Scroll Indicator

## Phase 1: Add Scroll Indicator to Feed Item List
- [ ] Task: Write Tests for Feed Item List Scroll Indicator
    - [ ] Create or update unit tests to assert that a custom progress bar is rendered on mobile platforms.
    - [ ] Write a test asserting that scroll progress calculations are correct and that scroll events update the progress bar width style.
    - [ ] Write a test ensuring that the custom progress bar is NOT rendered on Web and that the native vertical scrollbar is enabled on Web.
    - [ ] Write a test ensuring that on mobile platforms, the native vertical scrollbar is disabled for the list.
- [ ] Task: Implement Scroll Indicator Support in List Components
    - [ ] Add an optional `showScrollIndicator?: boolean` prop to `ListScreenProps` and `SelectableFlatListProps`.
    - [ ] Update `components/ListScreen.tsx` to handle scroll progress tracking:
        - Maintain a `scrollProgress` state (defaulting to 0).
        - If `Platform.OS !== 'web' && showScrollIndicator` is true, render the custom progress bar (`progressBarContainer` and `progressBar`) at the top of the list view.
        - Calculate `scrollProgress` on scroll inside FlatList/ScrollView using `contentOffset.y / (contentSize.height - layoutMeasurement.height)`.
    - [ ] Update `components/SelectableFlatList.tsx` to accept `onScroll`, `scrollEventThrottle`, and `showsVerticalScrollIndicator` props and forward them to the underlying `FlatList`.
    - [ ] Update the styles in `styles/ListScreen.styles.ts` to include `progressBarContainer` and `progressBar` styling matching `FeedItemDetailScreen.styles.ts`.
- [ ] Task: Enable Scroll Indicator on Feed Item List Screen
    - [ ] Update `app/FeedItemListScreen.tsx` to pass `showScrollIndicator={true}` to the `ListScreen` component.
- [ ] Task: Conductor - User Manual Verification 'Phase 1: Add Scroll Indicator to Feed Item List' (Protocol in workflow.md)
