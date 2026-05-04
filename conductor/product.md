# Open RSS Client: Product Definition

**Current Version:** 1.7.1

## Vision
The Open RSS Client is a lightweight, mobile-first RSS reader designed for seamless consumption of feeds from the [Open RSS Aggregator](https://github.com/poremland/open_rss_aggregator). It empowers users to stay informed by providing a unified, cross-platform experience (Android, iOS, Web) with a focus on speed, offline accessibility, and a clean, distraction-free interface.

## Target Audience
- **News Enthusiasts:** Users who follow multiple news sources and want a centralized hub.
- **Developers:** Tech-savvy users who prefer self-hosted solutions like the Open RSS Aggregator.
- **Privacy-Conscious Users:** Individuals who value a tool that doesn't track their reading habits.

## Core Goals
- **Cross-Platform Consistency:** Deliver a high-quality experience across Web, Android, and iOS using a single Expo codebase.
- **Efficient Feed Management:** Provide intuitive tools for adding, organizing, and deleting RSS feeds.
- **Superior Reading Experience:** Optimize the interface for reading, with support for HTML content and smooth navigation.
- **Secure Authentication:** Implement robust JWT-based authentication with OTP support.
- **Occasionally Connected Access:** Ensure users can access and read their feeds even without an active internet connection through robust offline caching and synchronization.

## Key Features
- **OTP Login:** Secure, passwordless authentication flow using usernames and One-Time Passwords.
- **Unread Item Tracking:** Clear visualization of unread counts per feed.
- **Batch Actions:** Multi-select capabilities for marking items as read or deleting feeds.
- **OPML Support:** Easy migration and backup with OPML import and export capabilities.
- **Gestural Interaction:** Swipe-to-delete and swipe-to-mark-read for efficient list management.
- **Offline Mode:** Full support for reading cached feeds and items while offline, including immediate access to item details, with automatic state synchronization (e.g., "mark as read") when connectivity is restored.
- **Background Synchronization:** Periodically fetches and caches new content in the background to ensure the app is always ready for offline use.
- **Proactive Caching:** Automatically fetches and caches unread items for all feeds upon connection, ensuring full offline availability without manual navigation.
- **Connection-Aware UI:** Real-time detection and visual indication of connectivity status, with automated restriction of online-only actions.
- **Dynamic Content:** Automatic HTML entity decoding for clean title and description rendering.
- **About & Status:** Dedicated screen for application information, synchronization status, and manual cache management.
- **Seamless App Initialization:** Orchestrated splash screen that stays visible until all critical initial states (auth, cache, sync) are resolved, providing a professional and flicker-free startup experience.

## Success Metrics
- **Performance:** App initialization and feed loading in under 2 seconds.
- **Reliability:** Zero data loss and stable UI states during feed synchronization and item state updates, even across connectivity transitions.
- **User Satisfaction:** Positive feedback on the simplicity and speed of the reading experience.
nectivity transitions.
- **User Satisfaction:** Positive feedback on the simplicity and speed of the reading experience.
