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

import { File } from "expo-file-system";

/**
 * Validates a file at the given URI as a basic OPML file.
 * 
 * Note: Since there is no robust XML parser easily available in mobile environments
 * without adding large dependencies, we perform a basic structural check using regex.
 * 
 * @param fileUri The URI of the file to validate.
 * @returns true if valid, throws an error otherwise.
 */
export const validateOpmlFile = async (fileUri: string): Promise<boolean> => {
	const file = new File(fileUri);
	const content = await file.text();
	const trimmed = content.trim();

	// Very basic XML check
	if (!trimmed.toLowerCase().startsWith("<?xml") && !trimmed.toLowerCase().startsWith("<opml")) {
		throw new Error("Invalid OPML file: Not a valid XML");
	}

	// Root element check
	const withoutXmlTag = trimmed.replace(/^<\?xml[^>]*\?>/i, "").trim();
	if (!withoutXmlTag.toLowerCase().startsWith("<opml")) {
		throw new Error("Invalid OPML file: Missing <opml> root element");
	}

	// Body element check
	if (!/<body[^>]*>/i.test(trimmed)) {
		throw new Error("Invalid OPML file: Missing <body> element");
	}

	// Outline element check - should have at least one
	if (!/<outline[^>]*>/i.test(trimmed)) {
		throw new Error("Invalid OPML file: No <outline> elements found");
	}

	return true;
};
