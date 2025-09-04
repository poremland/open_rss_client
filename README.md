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

# Open RSS Client

This is an RSS client for the [Open RSS Aggregator](https://github.com/poremland/open_rss_aggregator) server and API. It's a mobile-first application built with [React Native](https://reactnative.dev/) and the [Expo](https://expo.dev/) framework, enabling a single codebase to be deployed across Web, Android, and iOS.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)
- [Android Studio](https://developer.android.com/studio) for Android development (with a configured emulator or device)
- [Xcode](https://developer.apple.com/xcode/) for iOS development (macOS only)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/poremland/open_rss_client.git
    cd open_rss_client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the App

Start the Expo development server:

```bash
npx expo start
```

This will open the Expo developer tools in your browser. From there, you can:
- Run on an Android emulator or connected device.
- Run on an iOS simulator or connected device (macOS only).
- Run in a web browser.

The Expo Go app for [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) and [iOS](https://apps.apple.com/us/app/expo-go/id982107779) can also be used to run the project directly on your phone by scanning the QR code from the developer tools.

## Debugging

### General

For general debugging, you can use the browser-based developer tools. Press `j` in the terminal where Expo is running to open the JavaScript debugger. You can also use `console.log` statements, which will appear in the terminal.

### Android

To view native Android logs, you can use the following command:

```bash
npx react-native log-android
```

### iOS

To view native iOS logs, you can use the Console app that comes with macOS or view them directly within Xcode.

### Troubleshooting

If you encounter issues with caching, try clearing the Expo cache:

```bash
npx expo start --clear
```

## Production Builds

### Web

1.  **Generate the web build:**
    ```bash
    npx expo export --platform web
    ```

2.  **Deploy:**
    The command will create a `dist` directory containing the static web app. You can deploy this folder to any static web hosting service.

### Android

#### Local Build (Recommended)

1.  **Configure Keystore:**
    Before building, you need to set up your Android Keystore credentials as environment variables. These are used to sign your application for release.
    ```bash
    export ANDROID_KEYSTORE_PASSWORD="<YOUR_KEYSTORE_PASSWORD>"
    export ANDROID_KEYSTORE_ALIAS="<YOUR_KEY_ALIAS>"
    ```
    Ensure you have a `open.rss.client.release.keystore` file in the project root, or update `app.config.js` to point to your keystore file.

2.  **Build the APK/AAB:**

    Update `./android/app/build.gradle` to include the following in the `android { ... }` section:
    ```groovy
    splits {
            abi {
                    enable true
                    reset() // Clears all default ABIs
                    include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64' // Specify the ABIs you want to include
                    universalApk false // Set to true if you want a universal APK as well
            }
    }
    ```

    **Note:** if you don't have the ./android directory you need to run prebuild
	```bash
	npx expo prebuild
	```
	now you should be able to make the above update to `./android/app/build.gradle` 

    Set the required keystone password variables:
    ```bash
    export ANDROID_KEYSTORE_PASSWORD="<YOUR PASSWORD>"
    export ANDROID_KEYSTORE_ALIAS="<YOUR ALIAS>"
    ```

    Then run the build command:
    ```bash
    (npx expo prebuild && cd android/ && ./gradlew app:assembleRelease && rm ../app.json)
    ```

    The release APKs can be found under: `./android/app/build/outputs/apk/release/`. For modern ARM based phones `app-arm64-v8a-release.apk` is most likely the release you want.

    **Note:** Alternatively, you can use the command `npx expo run:android --variant release`, but this requires an Android emulator to be running.

#### Alternative: EAS Build

For a more automated process, you can use Expo Application Services (EAS). Note that EAS is a paid service with a free tier.

```bash
eas build -p android --profile production
```
This requires installing and configuring the [EAS CLI](https://docs.expo.dev/build/introduction/).

### iOS

#### Local Build (Recommended)

1.  **Prebuild the project:**
    This step generates the native `ios` directory if it doesn't exist.
    ```bash
    npx expo prebuild --platform ios
    ```

2.  **Build in Xcode:**
    - Open the `.xcworkspace` file in the `ios` directory with Xcode.
    - Configure your signing credentials (Apple Developer account) in the "Signing & Capabilities" tab.
    - Select a target device or "Any iOS Device (arm64)".
    - Go to "Product" > "Archive" to create the build archive.
    - From the Archives window, you can distribute the app to the App Store or export it as an `.ipa` file.

#### Alternative: EAS Build

For a simpler process that handles code signing and building for you, you can use Expo Application Services (EAS). Note that EAS is a paid service with a free tier.

```bash
eas build -p ios --profile production
```
This requires installing and configuring the [EAS CLI](https://docs.expo.dev/build/introduction/).
