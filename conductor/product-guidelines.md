# Open RSS Client: Product Guidelines

## Brand Voice & Style
- **Clear & Concise:** Use straightforward language. Avoid jargon unless necessary for technical context.
- **Supportive:** Provide helpful feedback during long operations (e.g., refreshing feeds).
- **Modern & Professional:** Maintain a clean, minimalist aesthetic that allows the content to be the hero.

## UX Principles
- **Content First:** Minimize UI chrome to maximize reading space.
- **Responsive Layout:** Ensure the interface is optimized for both small mobile screens and larger tablet/desktop displays.
- **Intuitive Navigation:** Use common gestures (swipe-to-action) and a consistent global menu for primary navigation.
- **Instant Feedback:** Use haptic feedback (where available) and subtle animations to acknowledge user actions.

## Design Patterns
- **Cards for Feeds & Items:** Use stylized cards with consistent padding and rounded corners to represent data entities.
- **Global Dropdown:** Centralize primary actions (Logout, Manage Feeds, etc.) in a predictable global menu.
- **Multi-Select Workflow:** Clearly transition into a selection mode when users long-press on list items.
- **Error States:** Display user-friendly error messages that explain the problem and provide a way to retry the action.

## Content Management
- **Entity Decoding:** Always decode HTML entities in titles and descriptions for a polished look.
- **Relative Timestamps:** Use relative time (e.g., "5m ago") for better readability of feed updates.
- **No-Content States:** Provide clear, encouraging empty states when no feeds or items are present.
