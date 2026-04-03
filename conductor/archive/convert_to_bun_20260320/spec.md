# Specification: Convert test framework from jest to bun

## Overview
Completely migrate the project's testing framework from Jest to Bun. This includes logic helpers, components, and screens. The goal is to eliminate the Jest dependency and leverage Bun's performance across the entire test suite.

## Functional Requirements
1.  **Bun Environment Configuration:** Set up Bun to handle React Native and Expo-specific code (JSX, TypeScript, and Native Module mocks).
2.  **Logic Test Migration:** Port existing Jest tests for `helpers/*.ts` to Bun's native test runner.
3.  **Component Test Migration:** Port all React Native component and screen tests from Jest/React Testing Library to Bun.
4.  **Mocking Strategy:** Implement a custom mocking solution for Expo native modules (replacing `jest-expo`).
5.  **Deprecation:** Remove Jest and all associated dependencies (`jest`, `jest-expo`, `babel-jest`, etc.) once the migration is verified.

## Acceptance Criteria
- 100% of the Jest unit tests are migrated to Bun and pass using `bun test`.
- No Jest-specific code or dependencies remain in the project.
- `npm test` executes the full suite using Bun.

## Out of Scope
- Migrating the app runtime to Bun (the app continues to run on Hermes/Expo).
