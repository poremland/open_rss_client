# Implementation Plan: Migrate from react-test-renderer to @testing-library/react-native

## Phase 1: Dependency Cleanup [checkpoint: 7224f5d]
- [x] Uninstall \`react-test-renderer\`, \`@types/react-test-renderer\` and related devDependencies. 3519759
- [x] Prune \`node_modules\` and verify \`bun.lock\`. 3519759
- [x] Task: Conductor - User Manual Verification 'Phase 1: Dependency Cleanup' (Protocol in workflow.md) 7224f5d

## Phase 2: Configuration Update [checkpoint: be428a4]
- [x] Remove any \`react-test-renderer\` property from \`package.json\`. 3519759
- [x] Update any Jest-specific mocks or globals in \`__tests__/setup.ts\` that refer to \`react-test-renderer\`. be428a4
- [x] Task: Conductor - User Manual Verification 'Phase 2: Configuration Update' (Protocol in workflow.md) be428a4

## Phase 3: Test Migration - Component Tests [checkpoint: be428a4]
- [x] Migrate \`__tests__/components/FeedCard.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/components/FeedItemCard.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/components/MultiSelectBar.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/components/SelectableFlatList.test.tsx\` to RNTL. be428a4
- [x] Task: Conductor - User Manual Verification 'Phase 3: Test Migration - Component Tests' (Protocol in workflow.md) be428a4

## Phase 4: Test Migration - Screen Tests [checkpoint: be428a4]
- [x] Migrate \`__tests__/AddFeedScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/FeedItemDetailScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/FeedItemListScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/FeedListScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/LoginScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/ManageFeedsListScreen.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/NativeRendering.test.tsx\` to RNTL. be428a4
- [x] Task: Conductor - User Manual Verification 'Phase 4: Test Migration - Screen Tests' (Protocol in workflow.md) be428a4

## Phase 5: Test Migration - Utility & Hook Tests [checkpoint: be428a4]
- [x] Migrate \`__tests__/GlobalDropdownMenu.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/HeaderRightMenu.test.tsx\` to RNTL. be428a4
- [x] Migrate \`__tests__/useApi.test.ts\` to RNTL's \`renderHook\`. be428a4
- [x] Task: Conductor - User Manual Verification 'Phase 5: Test Migration - Utility & Hook Tests' (Protocol in workflow.md) be428a4

## Phase 6: Final Verification [checkpoint: 9675957]
- [x] Perform a clean \`bun install\`. be428a4
- [x] Run \`bun test\` and ensure all tests pass with NO deprecation warnings. 9675957
- [x] Task: Conductor - User Manual Verification 'Phase 6: Final Verification' (Protocol in workflow.md) 9675957
