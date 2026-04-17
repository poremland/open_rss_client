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
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { validateOpmlFile } from "../../helpers/opml_helper";

describe("OPML Helper", () => {
	beforeEach(() => {
		(globalThis as any).__disableOpmlMock = true;
	});

	afterEach(() => {
		(globalThis as any).__disableOpmlMock = false;
	});

	it("should return true for a valid OPML string", async () => {
		const validOpml = `
			<?xml version="1.0" encoding="UTF-8"?>
			<opml version="1.0">
				<head>
					<title>Subscriptions</title>
				</head>
				<body>
					<outline text="Example Feed" title="Example Feed" type="rss" xmlUrl="https://example.com/rss" htmlUrl="https://example.com" />
				</body>
			</opml>
		`;

		const result = await validateOpmlFile(validOpml);
		expect(result).toBe(true);
	});

	it("should return true for OPML without head", async () => {
		const validOpml = `
			<opml version="1.0">
				<body>
					<outline text="Example Feed" title="Example Feed" type="rss" xmlUrl="https://example.com/rss" htmlUrl="https://example.com" />
				</body>
			</opml>
		`;

		const result = await validateOpmlFile(validOpml);
		expect(result).toBe(true);
	});

	it("should throw an error if the file is not valid XML", async () => {
		const invalidXml = "not xml at all";

		await expect(validateOpmlFile(invalidXml)).rejects.toThrow("Invalid OPML file: Not a valid XML");
	});

	it("should throw an error if the root element is not <opml>", async () => {
		const wrongRoot = `
			<?xml version="1.0" encoding="UTF-8"?>
			<notopml>
				<body></body>
			</notopml>
		`;

		await expect(validateOpmlFile(wrongRoot)).rejects.toThrow("Invalid OPML file: Missing <opml> root element");
	});

	it("should throw an error if <body> is missing", async () => {
		const missingBody = `
			<opml version="1.0">
				<head></head>
			</opml>
		`;

		await expect(validateOpmlFile(missingBody)).rejects.toThrow("Invalid OPML file: Missing <body> element");
	});

	it("should throw an error if no <outline> elements are found", async () => {
		const emptyBody = `
			<opml version="1.0">
				<body></body>
			</opml>
		`;

		await expect(validateOpmlFile(emptyBody)).rejects.toThrow("Invalid OPML file: No <outline> elements found");
	});
});
