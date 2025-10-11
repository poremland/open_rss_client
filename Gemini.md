<!--
RSS Reader: A mobile application for consuming RSS feeds.
Copyright (C) 2025 Paul Oremland

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
-->

# General instructions
You are a helpful and very experienced expo react-native developer. You follow the best practices as outlined by https://docs.expo.dev/

# Coding Instructions
YOU USE TABS INSTEAD OF SPACES FOR INDENTING
WHEN TESTING YOU ALWAYS USE jest THROUGH npx USING THE --maxWorkers=50% PARAMETER
YOU DO NOT MAKE ANY ASSUMPTIONS ABOUT THE REST API BEING USED (such as what endpoints are available or what VERBs should be used).
YOU DO NOT HARD CODE ENVIRONMENT VARIABLES.
WHEN YOU ADD NEW TESTS AND THEY ARE FAILING, YOU ONLY FOCUS ON FIXING THE FAILING TESTS. IF THERE IS A LINK FOR MORE DETAILS YOU READ THE LINK FIRST AND USE IT TO HELP REFORMULATE YOUR STRATEGY.
YOU FOCUS ON FIXING ONE TEST AT A TIME.
IF YOU ARE UNABLE TO FIX A TEST YOU DO NOT TRY THE SAME STRATEGY MULTIPLE TIMES.
YOU DO NOT TRY TO REFACTOR ALL TESTS OR MODIFY TESTS THAT ARE UNRELATED TO NEW FUNCTIONALITY OR TO THE FAILING TESTS YOU ARE FIXING.

# About the app
You're in a git project which is an RSS reader.
The RSS reader gets its data from an RSS Aggregator which has a REST API.
This rest API uses JWT tokens for authentication.

**Authentication:**

*   The user starts at a login screen where they must enter a server URL.
*   The user enters their username and requests a One-Time Password (OTP).
*   The app sends a POST request to `/api/request_otp` with the username.
*   The user then enters the received OTP.
*   The app sends a POST request to `/api/login` with the username and OTP.
*   Upon successful login, the API returns a JWT token, which is stored in `AsyncStorage` along with the username.
*   The app then navigates to the `FeedListScreen`.
*   The app checks if the user is already logged in when it starts and navigates to the `FeedListScreen` if they are.

**Feed Management:**

*   The `FeedListScreen` displays a list of RSS feeds that have unread items. The count of unread items is displayed next to the feed name.
*   From the `FeedListScreen`, the user can navigate to:
    *   `AddFeedScreen`: To add a new feed by providing a name and a URI.
    *   `ManageFeedsListScreen`: To see a list of all their feeds and delete them.
*   The `ManageFeedsListScreen` allows for multi-selection to delete multiple feeds at once.

**Feed Item Viewing:**

*   When a user clicks on a feed in the `FeedListScreen`, they are navigated to the `FeedItemListScreen`.
*   The `FeedItemListScreen` displays a list of unread items for the selected feed.
*   From the `FeedItemListScreen`, the user can:
    *   Mark all items as read.
    *   Delete the feed.
    *   Log out.
    *   Long-press an item to enter a multi-select mode to mark multiple items as read.
*   When a user clicks on a feed item, they are navigated to the `FeedItemDetailScreen`.
*   The `FeedItemDetailScreen` displays the details of the selected feed item. When the screen is focused, the item is marked as read.

**Navigation:**

*   The application uses a global dropdown menu for navigation and actions within screens.
*   The header has a right menu that toggles the global dropdown.

**Data Fetching:**

*   The application uses a custom `useApi` hook to make API calls.
*   The API calls are authenticated using a JWT token stored in `AsyncStorage`.
