# Implementation Plan: Bun Test Stabilization & Standard RNTL

## Phase 1: Infrastructure Alignment
- [x] Uninstall custom web-based testing mocks if any.
- [x] Ensure `react-test-renderer` matches React version.
- [x] Configure `setup.ts` to extend `expect` with standard RNTL matchers.
- [x] Validate environment with a basic native-rendering test.

## Phase 2: Helper & Hook Stabilization
- [x] Fix `useApi.test.ts` to use the new singleton helper mocks.
- [x] Ensure `api_helper` and `auth_helper` are correctly mocked across all tests.
- [x] Standardize the `mock.module` pattern to prevent cache pollution.

## Phase 3: Screen Test Migration
- [x] Fix `LoginScreen.test.tsx`.
- [x] Fix `FeedListScreen.test.tsx`.
- [x] Fix `FeedItemListScreen.test.tsx`.
- [x] Fix remaining component and helper tests.

## Phase 4: Final Validation
- [x] Run full test suite multiple times to ensure no race conditions.
- [x] Verify clean output (no act() warnings).

## Phase: Review Fixes
- [x] Task: Apply review suggestions 7744919
