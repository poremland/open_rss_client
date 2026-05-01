# Track: OPML Import/Export Implementation

## Overview
Implement the ability for users to import and export their feed subscriptions using the OPML format. This feature will integrate with the server's `/feeds/import` and `/feeds/export` endpoints.

## Functional Requirements
- **Export OPML:**
  - Add "Export OPML" to the dropdown menu on the `ManageFeedsListScreen`.
  - Fetch the OPML file from `GET /feeds/export` using authentication.
  - Download the file to a temporary location on the device.
  - Allow the user to save the file to their device's storage (e.g., Downloads folder).
- **Import OPML:**
  - Add "Import OPML" to the dropdown menu on the `ManageFeedsListScreen`.
  - Use `expo-document-picker` to allow the user to select an `.opml` file.
  - Upload the selected file to `POST /feeds/import` using `multipart/form-data`.
  - Display a simple alert to inform the user that the import has started and how many feeds were found (based on the server's 202 response).
  - Refresh the feed list on the `ManageFeedsListScreen` after a successful import initiation (though the server process is asynchronous).
- **Version Bump:**
  - Bump the application version to `1.5.0` in `app.config.base.json`.

## Non-Functional Requirements
- **Feedback:** Use `Alert.alert` for success/error messages.
- **Haptics:** Provide haptic feedback on successful export/import initiation (as per `tech-stack.md`).
- **TDD:** Implement following the project's TDD workflow.

## Acceptance Criteria
- [ ] Users can trigger an OPML export from the Manage Feeds screen.
- [ ] The exported OPML file is correctly downloaded and saved to the device.
- [ ] Users can trigger an OPML import by selecting a file from their device.
- [ ] The app correctly handles the multipart upload to the server.
- [ ] The app displays a success message upon starting the import.
- [ ] Errors (e.g., network failure, invalid file) are communicated to the user via alerts.
- [ ] The application version is updated to `1.5.0`.

## Out of Scope
- **Real-time Progress:** Progress bars or real-time polling for import completion.
- **Background Fetch:** Polling for updates after the import is complete.
