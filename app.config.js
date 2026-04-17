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

module.exports = ({ config }) => {
	// This function will be executed after the "publish" step but before the build.

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

	// Inject the Reanimated Babel plugin into the configuration
	const babelPlugins = (baseConfig.packagerOpts?.babel?.plugins || []).concat([
		"react-native-reanimated/plugin"
	]);

	// Update the baseConfig to include the modified Babel plugins
	baseConfig.packagerOpts = {
		...baseConfig.packagerOpts,
		babel: {
			plugins: babelPlugins,
		},
	};

	// Inject the Android keystore configuration
	baseConfig.android = {
		...baseConfig.android,
		useProguard: true,
		package: "open.rss.client",
		build: {
			gradleCommand: ":app:assembleRelease",
			adaptiveIcon: {
				foregroundImage: "./assets/images/adaptive-icon.png",
				backgroundColor: "#ffffff",
			},
			keystore: {
				path: keystorePath,
				alias: keystoreAlias,
				password: keystorePassword,
				keyPassword: keyPassword,
			},
		},
	};

	// Merge baseConfig into the provided config
	const finalConfig = {
		...config,
		...baseConfig,
	};

	// ABI splits configuration
	const { withAppBuildGradle } = require("@expo/config-plugins");

	return withAppBuildGradle(finalConfig, (config) => {
		if (config.modResults.language === "groovy") {
			const splitsConfig = `
	splits {
		abi {
			enable true
			reset() // Clears all default ABIs
			include 'armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64' // Specify the ABIs you want to include
			universalApk false // Set to true if you want a universal APK as well
		}
	}
`;
			if (!config.modResults.contents.includes("splits {")) {
				config.modResults.contents = config.modResults.contents.replace(
					/android\s*{/,
					`android {${splitsConfig}`
				);
			}
		}
		return config;
	});
};
