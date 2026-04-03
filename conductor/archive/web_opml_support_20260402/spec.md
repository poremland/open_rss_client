# Track: Enable OPML import and export feature for the web

## Overview
Currently, the OPML import and export functionality is implemented using `expo-file-system`'s newer `File`, `Paths`, and `Directory` APIs, which are not supported on the web platform. This track aims to provide a platform-agnostic implementation for OPML handling, ensuring that both mobile and web platforms can successfully import and export feeds.

## Functional Requirements
- **OPML Export (Web):**
  - Implement export functionality using standard browser download mechanisms (e.g., using a temporary `<a>` element with a `download` attribute and a `Blob` URL).
  - This avoids the dependency on `expo-file-system` for temporary file creation on the web.
- **OPML Import (Web):**
  - Implement import functionality using standard Web APIs for file reading (e.g., `FileReader` or `File.text()`).
  - This avoids the dependency on `expo-file-system` for file reading on the web.
- **Shared Validation Logic:**
  - Update `validateOpmlFile` in `helpers/opml_helper.impl.ts` to be platform-agnostic.
  - Instead of passing a `fileUri` and using `new File(fileUri)`, consider passing the file content or an abstraction that works on both platforms.

## Non-Functional Requirements
- **Consistency:** The user interface for import/export should remain consistent across platforms.
- **Cross-Platform Compatibility:** Ensure the implementation doesn't break existing mobile support (Android/iOS).

## Acceptance Criteria
- [ ] User can successfully export their feed list to an OPML file from the web application.
- [ ] User can successfully import feeds from an OPML file into the web application.
- [ ] `validateOpmlFile` correctly validates OPML content on both mobile and web.
- [ ] No regression in mobile OPML functionality.

## Out of Scope
- Adding support for other file formats besides OPML.
- UI redesign of the Manage Feeds screen.
