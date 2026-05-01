# Implementation Plan: OPML Import/Export Implementation

## Phase 1: Export OPML

- [x] Task: Implement `exportOpml` logic in `api_helper.ts` 44fd8d5
    - [x] Create tests for `exportOpml` using `bun test`
    - [x] Implement `exportOpml` to fetch the file and save it using `expo-file-system` and `expo-sharing` (to save to file)
- [x] Task: Add "Export OPML" menu item to `ManageFeedsListScreen` ee57c3f
    - [x] Add menu item that calls `exportOpml`
    - [x] Verify haptic feedback is triggered
- [x] Task: Conductor - User Manual Verification 'Phase 1: Export OPML' (Protocol in workflow.md)

## Phase 2: Import OPML

- [x] Task: Implement `importOpml` logic in `api_helper.ts` b75c35d
    - [x] Create tests for `importOpml` (mocking multipart/form-data)
    - [x] Implement `importOpml` to upload an OPML file
- [x] Task: Implement client-side OPML validation 3c21b99
    - [x] Create tests for `validateOpmlFile` helper
    - [x] Implement `validateOpmlFile` to check for basic XML/OPML structure
- [x] Task: Add "Import OPML" menu item to `ManageFeedsListScreen` 04c6360
    - [x] Integrate `expo-document-picker` to select the file
    - [x] Call `validateOpmlFile` before uploading
    - [x] Call `importOpml` and show an alert with the result
    - [x] Verify haptic feedback is triggered
- [x] Task: Conductor - User Manual Verification 'Phase 2: Import OPML' (Protocol in workflow.md)

## Phase 3: Version Bump

- [x] Task: Bump version to 1.5.0 in app.config.base.json 1f8cfbb
- [x] Task: Conductor - User Manual Verification 'Phase 3: Version Bump' (Protocol in workflow.md)
