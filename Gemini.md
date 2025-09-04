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
YOU ONLY RUN UNIT TESTS USING THE COMMAND `npx jest`.
YOU DO NOT MAKE ANY ASSUMPTIONS ABOUT THE REST API BEING USED (such as what endpoints are available or what VERBs should be used).
YOU DO NOT HARD CODE ENVIRONMENT VARIABLES.
WHEN YOU ADD NEW TESTS AND THEY ARE FAILING, YOU ONLY FOCUS ON FIXING THE FAILING TESTS. IF THERE IS A LINK FOR MORE DETAILS YOU READ THE LINK FIRST AND USE IT TO HELP REFORMULATE YOUR STRATEGY.
YOU FOCUS ON FIXING ONE TEST AT A TIME.
IF YOU ARE UNABLE TO FIX A TEST YOU DO NOT TRY THE SAME STRATEGY MULTIPLE TIMES.
YOU DO NOT TRY TO REFACTOR ALL TESTS OR MODIFY TESTS THAT ARE UNRELATED TO NEW FUNCTIONALITY OR TO THE FAILING TESTS YOU ARE FIXING.

# About the app
You're in a git project which is an RSS reader.
The RSS reader gets it's data from an RSS Aggregator which has a REST API.
This rest API uses JWT tokens for authentication.
The happy path workflow in the application is the user will login by requesting a OTP from the api/request_otp endpoint which takes a username using a post request (same as the previous api/create_jwt request).
The login screen will change to display a box to enter the the OTP.
When the OTP has been entered the username and OTP are sent to the api/login endpoint which will return a JWT token.
Once successfully logged in the app loads a screen that displays a list of rss feeds with unread feed items.
When a feed is clicked a screen is opened to display the list of unread feed items.
When a feed item is clicked it opens a screen that displays the feed item.
Each screen has it's own set of unique header menu items.
On the feed list screen there's a menu item for adding a feed which takes you to a screen to add a feed (by name and uri), a menu item for managing feeds which displays a list of all feeds, and a menu item to logout which clears the JWT token from async storage and takes the user back to the login screen.