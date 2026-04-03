# Implementation Plan: Convert test framework from jest to bun

## Phase 1: Environment Setup & Logic Migration
- [x] Task: Create Bun-specific test files for logic helpers
    - [x] Create `__tests__/helpers/api.test.ts` (Bun version)
    - [x] Create `__tests__/helpers/auth.test.ts` (Bun version)
- [x] Task: Update `package.json` with initial Bun test scripts
    - [x] Add `test:bun` script
- [x] Task: Conductor - User Manual Verification 'Environment Setup & Logic Migration' (Protocol in workflow.md)

## Phase 2: Component & UI Mocking Strategy
- [x] Task: Establish global Bun setup for React Native
    - [x] Create `__tests__/setup.ts`
    - [x] Implement mocks for `react-native`, `expo-router`, `AsyncStorage`, etc.
- [x] Task: Conductor - User Manual Verification 'UI Mocking Strategy' (Protocol in workflow.md)

## Phase 3: Component & Screen Test Migration
- [x] Task: Port remaining screen tests to Bun
    - [x] Port `__tests__/AddFeedScreen.test.tsx`
    - [x] Port `__tests__/FeedItemListScreen.test.tsx`
    - [x] Port `__tests__/FeedListScreen.test.tsx`
    - [x] Port `__tests__/LoginScreen.test.tsx`
    - [x] Port `__tests__/ManageFeedsListScreen.test.tsx`
- [x] Task: Fix any identified Bun-specific environment issues
    - [x] Address any `act()` warnings or event loop issues in Bun
- [x] Task: Conductor - User Manual Verification 'UI Migration' (Protocol in workflow.md)

## Phase 4: Final Cleanup & Jest Removal
- [x] Task: Remove all Jest dependencies and files
    - [x] Uninstall `jest`, `jest-expo`, `@types/jest`, `babel-preset-expo`
    - [x] Delete `jest.setup.js` and `app.config.js` Jest-specific lines
- [x] Task: Final verification of the complete suite
    - [x] Update `npm test` to run only `bun test`
- [x] Task: Conductor - User Manual Verification 'Full Migration Verification' (Protocol in workflow.md)

## Phase: Review Fixes
- [x] Task: Apply review suggestions
