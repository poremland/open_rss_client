# Specification: Resolve react-test-renderer Deprecation Warnings

## Overview
This track aims to eliminate the `react-test-renderer is deprecated` warnings that appear when running `bun test`. This noise obscures real test results and indicates that our testing stack is relying on legacy rendering paths incompatible with React 19 best practices.

## Functional Requirements
- **Research:** Identify why `react-test-renderer` is being loaded (likely by `@testing-library/react-native` v13).
- **Strategy Selection:** Determine if a stable upgrade path exists or if the warning should be suppressed/mitigated via environment configuration.
- **Implementation:** Apply the selected fix across the codebase.
- **Test Audit:** Perform a full audit of all component and screen tests to ensure they use modern `screen` queries and `act()` from React 19 where applicable.
- **Dependency Management:** Ensure no unstable/beta versions of testing libraries are introduced unless absolutely necessary and confirmed stable.

## Non-Functional Requirements
- **Stability:** Tests must remain 100% stable and reliable.
- **Clean Output:** The primary goal is a clean developer experience with high signal-to-noise ratio in test logs.

## Acceptance Criteria
- `bun test` output is free of `react-test-renderer` deprecation warnings.
- All 83+ tests pass successfully.
- No regressions in test reliability or performance.

## Out of Scope
- Migrating to a different test runner.
- Large-scale refactoring of application components.
- Upgrading to unstable beta versions of RNTL (v14+).
