# Specification: Offline/Online Transition Bug Fixes

## Overview
This track addresses a series of bugs related to the application's behavior when transitioning between offline and online states. Specifically, it targets issues with the unread count calculation after syncing offline actions, the reliability of the offline state notifier, and the capture of offline actions when the network state is not correctly detected.

## Functional Requirements
- **Bug 1: Unread Count Fluctuation:** The application must maintain an accurate unread count for feeds when transitioning from offline to online. The unread count should not temporarily revert to its pre-offline state during the background sync process before a full refresh.
- **Bug 2: Unreliable Offline Notifier:** The application must reliably and consistently detect when network connectivity is lost (e.g., entering airplane mode) and display the offline notifier UI element without fail.
- **Bug 3: Lost Offline Actions:** The application must ensure that any items marked as read while offline are successfully added to the sync queue, regardless of whether the offline notifier UI is currently visible. These actions must be synchronized with the server upon reconnection, preventing items from reappearing as unread.

## Out of Scope
- Adding new offline capabilities beyond fixing the mentioned bugs.
- General UI redesigns of the Feed List or offline notifier outside of ensuring consistent display.

## Acceptance Criteria
- [ ] Transitioning from offline to online after marking items as read does not cause the unread count on the Feed List to temporarily increase before settling.
- [ ] Entering airplane mode reliably triggers the offline notifier UI every time.
- [ ] Items marked as read while the device is in airplane mode (even if the notifier failed to display previously) are successfully queued and synced to the server upon reconnection, and do not reappear as unread.