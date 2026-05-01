# Implementation Plan: Configure Android Emulator for Gemini Agent Testing (plan.md)

## Phase 1: Research and Analysis
- [x] Task: Research standard Pixel 8a emulator configuration requirements (system image, skin, etc.) 857a2b6
- [x] Task: Research Appium setup for React Native Expo projects (specifically those using dynamic `app.json`).
- [x] Task: Research shell-based commands for automated screenshot capture and ADB interaction patterns.
- [x] Task: Conductor - Agent Verification 'Phase 1: Research and Analysis' (Protocol in workflow.md)

## Phase 2: Emulator Lifecycle & Scripting
- [x] Task: Create a script (`conductor/scripts/emulator_start.sh`) to start the specified Android emulator with wait-for-boot logic.
- [x] Task: Create a script (`conductor/scripts/emulator_stop.sh`) to gracefully stop the emulator.
- [x] Task: Implement a utility command for capturing and storing screenshots from the emulator.
- [x] Task: Verify ADB interaction by successfully launching the default browser or a settings screen.
- [x] Task: Conductor - Agent Verification 'Phase 2: Emulator Lifecycle & Scripting' (Protocol in workflow.md)

## Phase 3: Appium Configuration [checkpoint: 465a9de]
- [x] Task: Install and configure Appium server locally for the project.
- [x] Task: Define desired capabilities for the RSS client in an Appium configuration file.
- [x] Task: Create a basic Appium wrapper to handle session management.
- [x] Task: Implement a "ping" test to ensure Appium can communicate with the running emulator. 870662d
- [x] Task: Conductor - Agent Verification 'Phase 3: Appium Configuration' (Protocol in workflow.md) 465a9de

## Phase 4: App Integration & Agent Tooling
- [x] Task: Implement a command for the agent to install and launch the latest build of the RSS client on the emulator.
- [x] Task: Create high-level interaction helpers (e.g., `agent_click`, `agent_type`) that use Appium or ADB as needed.
- [x] Task: Verify manual agent interaction by performing a login sequence via script.
- [x] Task: Conductor - Agent Verification 'Phase 4: App Integration & Agent Tooling' (Protocol in workflow.md)

## Phase 5: Verification & Checkpointing
- [x] Task: Create a sample E2E test using Appium that covers a basic flow (e.g., viewing the feed list).
- [x] Task: Run the full verification suite (unit tests + sample E2E test) in the emulator environment.
- [x] Task: Agent Validation - Manually start the emulator and verify that the agent can successfully capture a screenshot to confirm it works as expected.
- [x] Task: Conductor - Agent Verification 'Phase 5: Verification & Checkpointing' (Protocol in workflow.md)

## Phase 6: Performance Optimization
- [x] Task: Document and guide user to fix KVM Permissions (sudo usermod -aG kvm $USER).
- [x] Task: Update emulator_start.sh to enable hardware acceleration (-accel on -gpu host) once KVM is available.

- [x] Task: Document and guide user to optimize `.wslconfig` on the Windows host side.
- [x] Task: Research and potentially install a lighter AOSP system image (non-Google APIs) into the existing SDK to improve boot speed. 9f5a3b2
- [x] Task: Conductor - Agent Verification 'Phase 6: Performance Optimization' (Protocol in workflow.md) a7b2c1d

## Phase 7: Review Fixes
- [x] Task: Apply review suggestions b70bbde
