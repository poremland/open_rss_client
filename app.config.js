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

	// ABI splits and Gradle properties configuration
	const { withAppBuildGradle, withGradleProperties } = require("@expo/config-plugins");

	const configWithBuildGradle = withAppBuildGradle(finalConfig, (config) => {
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

			const customTask = `
// Custom task to delete unused vector icon fonts in release builds to save app size
tasks.register("deleteUnusedVectorIcons") {
	doLast {
		def rawDir = file("\${buildDir}/generated/res/createBundleReleaseJsAndAssets/raw")
		if (rawDir.exists()) {
			rawDir.listFiles().each { file ->
				if (file.name.endsWith(".ttf") && 
					file.name.contains("vectoricons") && 
					!file.name.contains("ionicons")) {
					println "Deleting unused font asset: \${file.name}"
					file.delete()
				}
			}
		}
	}
}

tasks.configureEach { task ->
	if (task.name == "mergeReleaseResources") {
		task.dependsOn("deleteUnusedVectorIcons")
	}
	if (task.name == "deleteUnusedVectorIcons") {
		task.mustRunAfter("createBundleReleaseJsAndAssets")
	}
}
`;
			if (!config.modResults.contents.includes("deleteUnusedVectorIcons")) {
				config.modResults.contents += customTask;
			}
		}
		return config;
	});

	return withGradleProperties(configWithBuildGradle, (config) => {
		const targetProperties = [
			{ key: "android.enableMinifyInReleaseBuilds", value: "true" },
			{ key: "android.enableShrinkResourcesInReleaseBuilds", value: "true" },
			{ key: "org.gradle.jvmargs", value: "-Xmx3072m -XX:MaxMetaspaceSize=1024m" }
		];

		targetProperties.forEach(({ key, value }) => {
			const index = config.modResults.findIndex(item => item.key === key);
			if (index > -1) {
				config.modResults[index].value = value;
			} else {
				config.modResults.push({
					type: "property",
					key,
					value,
				});
			}
		});

		return config;
	});
};
