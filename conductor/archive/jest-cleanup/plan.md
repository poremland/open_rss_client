# Implementation Plan: Legacy Jest Cleanup & Artifact Removal

## Phase 1: Dependency Cleanup
- [x] Uninstall \`jest\`, \`ts-jest\`, \`jest-expo\`, and related devDependencies. c07f21a
- [x] Remove Jest-related types (\`@types/jest\`). c07f21a
- [x] Prune \`node_modules\` and verify \`bun.lock\`. c07f21a

## Phase 2: Configuration Cleanup
- [x] Delete \`jest.config.js\` or \`jest.setup.js\` if they still exist. c07f21a
- [x] Remove any \`jest\` property from \`package.json\`. c07f21a
- [x] Remove any Jest-specific globals from \`tsconfig.json\`. c07f21a

## Phase 3: Artifact Pruning
- [x] Search for and delete any remaining \`__mocks__\` folders if they are Jest-specific. c07f21a
- [x] Remove any Jest snapshots (\`__snapshots__\`). c07f21a
- [x] Delete any \`rn-mock.js\` or similar custom mocks that were specific to Jest. c07f21a

## Phase 4: Final Verification
- [x] Perform a clean \`bun install\`. c07f21a
- [x] Run \`bun test\` to ensure no regressions were introduced by removing Jest "crutches". c07f21a
