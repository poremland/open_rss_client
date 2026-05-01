# Open RSS Client: Tech Stack

## Core Technologies
- **Language:** TypeScript (v5+) for type-safe application logic.
- **Framework:** [Expo](https://expo.dev/) (v54+) for cross-platform development on React Native.
- **Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) for file-system-based navigation across platforms.

## UI & Styling
- **Styling:** React Native `StyleSheet` with shared common styles.
- **Icons:** `@expo/vector-icons` (Ionicons, AntDesign, MaterialIcons) and `expo-symbols` for SF Symbols on iOS.
- **Gestures:** `rn-gesture-swipeable-flatlist` for performant swipe-to-delete and swipe-to-read interactions.
- **Feedback:** `expo-haptics` for tactile user confirmation.
- **Visuals:** `expo-blur` for backdrop filtering and visual depth, and `expo-splash-screen` for controlled app initialization.

## State & Data Management
- **Local Storage:** `@react-native-async-storage/async-storage` for storing JWT tokens, server configuration, and the sync queue.
- **Offline Caching:** Custom caching layer using `AsyncStorage` to persist feed lists and item content for offline access.
- **Synchronization:** Robust, event-driven sync queue mechanism to track, batch, and replay offline actions upon reconnection, ensuring UI consistency.
- **Networking:** Native `fetch` API, wrapped in a custom `useApi` hook for authentication, error handling, and integrated offline support.
- **File Management:** Platform-agnostic file handling using `expo-file-system` for mobile and standard Browser APIs (`Blob`, `File`) for web.
- **Data Sharing:** `expo-sharing` and `expo-clipboard` for exporting OPML data and copying URLs.
- **File Selection:** `expo-document-picker` for importing OPML files.
- **Content Processing:** `he` for robust HTML entity decoding.
- **Data Validation:** Basic TypeScript interfaces for Models (Feed, FeedItem, Login).

## Infrastructure & Tooling
- **Build System:** Expo Application Services (EAS) for cloud builds and local CLI builds.
- **Background Tasks:** `expo-background-fetch` and `expo-task-manager` for periodic background data synchronization.
- **Network Monitoring:** `expo-network` for real-time connectivity state tracking.
- **Continuous Integration (CI):** GitHub Actions for automated unit testing (`bun test`) and linting (`expo lint`) on all pull requests and pushes to `main`.
- **Testing:**
    - **Primary Runner:** [Bun](https://bun.sh/) for all unit, component, and hook tests.
    - **Component Testing:** `@testing-library/react-native` (RNTL) with native rendering mocks.
    - **Matchers:** Native [Bun matchers](https://bun.sh/docs/test/expect) for assertions.
    - **E2E Testing:** [Appium](https://appium.io/) for automated mobile interaction.
    - **Emulator:** Android Emulator (Pixel 8a, API 34) for agent-based validation.
- **Formatting & Linting:** ESLint with `eslint-config-expo`.
- **Environment Management:** `app.config.js` with `app.config.base.json` for dynamic configuration.
