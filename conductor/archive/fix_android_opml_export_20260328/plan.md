# Implementation Plan: Fix Android OPML Export Error

## Phase 1: Fix Export Logic

- [x] Task: Update `exportOpml` to use a compatible way to read text 6537dd4
    - [x] Update tests to reflect the change if necessary
    - [x] Implement reading the response as text directly or using `FileReader`
- [x] Task: Conductor - User Manual Verification 'Phase 1: Fix Export Logic' (Protocol in workflow.md)

## Phase 2: Fix handleResponse 'Already read' Error

- [x] Task: Update `handleResponse` to safely handle non-JSON responses 701136e
    - [x] Create tests to reproduce "Already read" error
    - [x] Implement safe response handling (e.g., by checking Content-Type or cloning the response)
- [x] Task: Conductor - User Manual Verification 'Phase 2: Fix handleResponse' (Protocol in workflow.md)

## Phase 3: Migrate to New expo-file-system API

- [x] Task: Update `Api` and `opml_helper` to use `File` and `Paths` classes 93be7cf
    - [x] Research and update `ApiDeps` interface to accommodate the new API
    - [x] Update `exportOpml` implementation
    - [x] Update `validateOpmlFile` implementation
    - [x] Update mocks in `mocks.ts` and `setup.ts`
- [x] Task: Conductor - User Manual Verification 'Phase 3: New FileSystem API' (Protocol in workflow.md)

## Phase 4: Platform-Specific Export (Download) Behavior

- [x] Task: Implement "Save to Folder" for Android OPML export 4077aa3
    - [x] Update `ApiDeps` to include `Platform` detection
    - [x] Use `Directory.pickDirectoryAsync` on Android to let user choose destination
    - [x] Keep `shareAsync` for iOS
- [x] Task: Conductor - User Manual Verification 'Phase 4: Android Download' (Protocol in workflow.md)

## Phase 5: Fix Android Import 'Network Request Failed'

- [x] Task: Update `importOpml` to ensure compatible file URI and stable upload bd5438d
    - [x] Update `importOpml` to copy the file to a standard cache location using the new `File` API
    - [x] If `fetch` continues to fail, implement `XMLHttpRequest` fallback for multipart uploads
- [x] Task: Conductor - User Manual Verification 'Phase 5: Android Import' (Protocol in workflow.md)
