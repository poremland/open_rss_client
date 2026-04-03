# Specification: Migrate from react-test-renderer to @testing-library/react-native

## Overview
The goal of this track is to replace all instances of the deprecated `react-test-renderer` with `@testing-library/react-native` across the entire test suite. This will resolve the numerous deprecation warnings currently produced during `bun test` and align the project with modern React testing best practices.

## Functional Requirements
- Identify all test files currently importing and using `react-test-renderer`.
- Replace `react-test-renderer` with `@testing-library/react-native` (RNTL).
- Update test cases to use RNTL's `render`, `screen`, and query methods (e.g., `getByText`, `getByTestId`).
- Ensure all tests continue to pass and provide accurate verification of component behavior.
- Ensure all tests are compatible with the Bun test runner.

## Non-Functional Requirements
- **Stability:** Prioritize long-term stability and adherence to RNTL best practices.
- **Maintainability:** Improve test readability and ease of future maintenance by using more descriptive queries.
- **Performance:** Ensure the test suite remains fast and efficient under the Bun test runner.

## Acceptance Criteria
- `bun test` runs without any `react-test-renderer` deprecation warnings.
- All 83 tests (across 16 files) pass successfully.
- `react-test-renderer` is removed from `package.json` and `bun.lock`.
- No new regressions are introduced into the codebase.

## Out of Scope
- Major refactoring of the application code itself.
- Adding new features or significantly changing existing functionality.
- Migrating to a different test runner other than Bun.
