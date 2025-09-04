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

import fs from 'fs';
import path from 'path';

module.exports = ({ config }) => {
  // This function will be executed after the "publish" step but before the build.

  const keystorePassword = process.env.ANDROID_KEYSTORE_PASSWORD;
  const keystoreAlias = process.env.ANDROID_KEYSTORE_ALIAS;
  const keyPassword = process.env.ANDROID_KEYSTORE_PASSWORD;
  const keystorePath = './open.rss.client.release.keystore';

  if (!keystorePassword || !keystoreAlias || !keyPassword) {
    console.error(
      'Error: Android keystore passwords and alias environment variables must be set.'
    );
    process.exit(1);
  }

  // Load your base app.json template
  const baseConfig = require('./app.config.base.json');

  // Inject the keystore configuration
  baseConfig.android = {
    useProguard: true,
    build: {
      gradleCommand: ':app:assembleRelease',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      package: 'open.rss.client.expo',
      keystore: {
        path: keystorePath,
        alias: keystoreAlias,
        password: keystorePassword,
        keyPassword: keyPassword,
      },
    },
  };

  // Write the modified configuration to app.json
  fs.writeFileSync(
    path.join(__dirname, 'app.json'),
    JSON.stringify(baseConfig, null, 2)
  );

  // You might want to delete app.json after the build completes.
  // However, Expo's build process might rely on it being present.
  // A safer approach might be to clean up in a post-build script if needed.

  return config; // Ensure you return the config
};
