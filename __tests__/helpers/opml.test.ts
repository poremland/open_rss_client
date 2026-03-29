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

import { expect, describe, it, beforeEach, mock } from "bun:test";
import { validateOpmlFile } from "../../helpers/opml_helper.impl";
import { resetAll } from "../mocks";
import { File } from "expo-file-system";

describe("OPML Helper", () => {
	beforeEach(() => {
		resetAll();
	});

	it("should return true for a valid OPML string", async () => {
		const validOpml = `
			<?xml version="1.0" encoding="UTF-8"?>
			<opml version="2.0">
				<head>
					<title>Subscriptions</title>
				</head>
				<body>
					<outline text="Feed 1" type="rss" xmlUrl="http://feed1.com" />
				</body>
			</opml>
		`;
		File.prototype.text = mock(async () => validOpml);

		const result = await validateOpmlFile("file:///test.opml");
		expect(result).toBe(true);
	});

	it("should return true for OPML without head", async () => {
		const validOpml = `
			<opml version="2.0">
				<body>
					<outline text="Feed 1" type="rss" xmlUrl="http://feed1.com" />
				</body>
			</opml>
		`;
		File.prototype.text = mock(async () => validOpml);

		const result = await validateOpmlFile("file:///test.opml");
		expect(result).toBe(true);
	});

	it("should throw an error if the file is not valid XML", async () => {
		const invalidXml = "not xml at all";
		File.prototype.text = mock(async () => invalidXml);

		await expect(validateOpmlFile("file:///test.opml")).rejects.toThrow("Invalid OPML file: Not a valid XML");
	});

	it("should throw an error if the root element is not <opml>", async () => {
		const wrongRoot = `
			<?xml version="1.0" encoding="UTF-8"?>
			<notopml>
				<body></body>
			</notopml>
		`;
		File.prototype.text = mock(async () => wrongRoot);

		await expect(validateOpmlFile("file:///test.opml")).rejects.toThrow("Invalid OPML file: Missing <opml> root element");
	});

	it("should throw an error if <body> is missing", async () => {
		const missingBody = `
			<opml version="2.0">
				<head></head>
			</opml>
		`;
		File.prototype.text = mock(async () => missingBody);

		await expect(validateOpmlFile("file:///test.opml")).rejects.toThrow("Invalid OPML file: Missing <body> element");
	});

	it("should throw an error if no <outline> elements are found", async () => {
		const emptyBody = `
			<opml version="2.0">
				<body></body>
			</opml>
		`;
		File.prototype.text = mock(async () => emptyBody);

		await expect(validateOpmlFile("file:///test.opml")).rejects.toThrow("Invalid OPML file: No <outline> elements found");
	});
});
