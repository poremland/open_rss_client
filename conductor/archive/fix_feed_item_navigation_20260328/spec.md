# Track: Fix Feed Item Navigation and Version Bump

## Overview
Clicking a feed item in the feed item list no longer navigates to the detail screen. This track aims to fix this regression and bump the app version to 1.5.1.

## Functional Requirements
- Restore navigation from `FeedItemListScreen` to `FeedItemDetailScreen` on item click.
- Bump version to `1.5.1` in `app.config.base.json`.

## Non-Functional Requirements
- Maintain TDD workflow.
- Ensure all tests pass.

## Acceptance Criteria
- [ ] Clicking a feed item navigates to the detail screen.
- [ ] App version is updated to `1.5.1`.
- [ ] Tests pass, including a regression test for the navigation.
