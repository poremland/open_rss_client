# Implementation Plan: Enable OPML import and export feature for the web

## Phase 1: Platform-Agnostic OPML Helper
- [x] Task: Update `validateOpmlFile` in `helpers/opml_helper.impl.ts` to be platform-agnostic.
    - [x] Modify `validateOpmlFile` to accept the file content instead of a file URI.
    - [x] Ensure existing mobile code is updated to pass the content.
- [x] Task: Write tests for the platform-agnostic `validateOpmlFile`.
    - [x] Create a new test file `__tests__/helpers/opml.test.ts` (if not already there).
    - [x] Test with valid and invalid OPML content.
- [x] Task: Conductor - User Manual Verification 'Platform-Agnostic OPML Helper' (Protocol in workflow.md)

## Phase 2: Web-Specific OPML Export
- [x] Task: Update `exportOpml` in `helpers/api_helper.impl.ts` for the web.
    - [x] Detect `Platform.OS === 'web'`.
    - [x] Implement browser-specific download logic using a temporary `<a>` element and a `Blob`.
- [x] Task: Write tests for the web-specific `exportOpml`.
    - [x] Mock `Platform.OS` as `web`.
    - [x] Verify the export triggers the correct browser behavior (may require mocking DOM elements).
- [x] Task: Conductor - User Manual Verification 'Web-Specific OPML Export' (Protocol in workflow.md)

## Phase 3: Web-Specific OPML Import
- [x] Task: Update `importOpml` in `helpers/api_helper.impl.ts` for the web.
    - [x] Detect `Platform.OS === 'web'`.
    - [x] Implement file reading using standard Web APIs.
    - [x] Ensure `postFormDataWithAuth` handles the file correctly on the web.
- [x] Task: Write tests for the web-specific `importOpml`.
    - [x] Mock `Platform.OS` as `web`.
    - [x] Verify the import correctly reads the file and posts to the API.
- [x] Task: Conductor - User Manual Verification 'Web-Specific OPML Import' (Protocol in workflow.md)

## Phase 4: Final Integration and Mobile Verification
- [x] Task: Verify that mobile import/export still works as expected.
    - [x] Run existing tests and manual verification on mobile.
- [x] Task: Final regression testing and cleanup.
- [x] Task: Conductor - User Manual Verification 'Final Integration and Mobile Verification' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions d92bcc6
