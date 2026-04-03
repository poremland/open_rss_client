# Specification: Bun Test Stabilization & Standard RNTL

## Objective
Migrate the project's UI/UX testing infrastructure to use the official `@testing-library/react-native` (RNTL) with Bun as the sole runner, ensuring reliable and standard testing patterns.

## Scope
- Realign the testing environment to use the official RNTL native rendering.
- Standardize module mocking to handle Bun's lack of hoisting.
- Fix all existing screen and hook tests to be reliable and passing.
- Document the standardized patterns for future testing.

## Success Criteria
- `bun test` runs all tests without environment-related failures.
- All screen tests correctly render and interact with native component mocks.
- No reliance on custom web-proxy mocks for native testing.
