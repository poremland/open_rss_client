/*
 * RSS Reader: A mobile application for consuming RSS feeds.
 * Copyright (C) 2025 Paul Oremland
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const fs = require("fs");
const path = require("path");
const { withAppBuildGradle, withMainActivity, withMainApplication } = require("@expo/config-plugins");

// Plugin to inject the ABI splits into build.gradle
const withAndroidSplits = (config) => {
	return withAppBuildGradle(config, (config) => {
		if (config.modResults.language === "groovy") {
			const splitsBlock = `
	splits {
		abi {
			enable true
			reset() // Clears all default ABIs
			include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64' // Specify the ABIs you want to include
			universalApk false // Set to true if you want a universal APK as well
		}
	}`;
			// Insert the block inside the android { ... } section if it's not already there
			if (!config.modResults.contents.includes("splits {")) {
				config.modResults.contents = config.modResults.contents.replace(
					/android\s*\{/,
					`android {${splitsBlock}`
				);
			}
		}
		return config;
	});
};

// Plugin to fix the package name header in Kotlin files if it gets generated incorrectly
const withPackageFix = (config) => {
	const fixPackage = (modConfig) => {
		modConfig.modResults.contents = modConfig.modResults.contents.replace(
			/package open\.rss\.clientexpo/,
			"package open.rss.client"
		);
		return modConfig;
	};
	// Apply the fix to both MainActivity and MainApplication
	return withMainActivity(withMainApplication(config, fixPackage), fixPackage);
};

module.exports = ({ config }) => {
	const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
	const keystoreAlias = process.env.ANDROID_KEYSTORE_ALIAS;
	const keyPassword = process.env.ANDROID_KEYSTORE_PASSWORD;
	const keystorePath = "./open.rss.client.release.keystore";

	if (!keystorePassword || !keystoreAlias || !keyPassword) {
		console.error("Error: Android keystore passwords and alias environment variables must be set.");
		process.exit(1);
	}

	// Load the base app.json template
	const baseConfig = require("./app.config.base.json");

	// Structure the final configuration object idiomatic to Expo.
	// Non-standard properties like keystore info are moved to 'extra'.
	let finalConfig = {
		...baseConfig,
		...config,
		packagerOpts: {
			...baseConfig.packagerOpts,
			...config.packagerOpts,
			babel: {
				plugins: [
					...(baseConfig.packagerOpts?.babel?.plugins || []),
					"react-native-reanimated/plugin"
				]
			}
		},
		android: {
			...baseConfig.android,
			...config.android,
			useProguard: true,
			package: "open.rss.client",
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
		},
		extra: {
			...baseConfig.extra,
			...config.extra,
			keystore: {
				path: keystorePath,
				alias: keystoreAlias,
				password: keystorePassword,
				keyPassword: keyPassword,
			},
			gradleCommand: ":app:assembleRelease",
		},
	};

	// Apply the automation plugins
	finalConfig = withAndroidSplits(finalConfig);
	finalConfig = withPackageFix(finalConfig);

	return finalConfig;
};
