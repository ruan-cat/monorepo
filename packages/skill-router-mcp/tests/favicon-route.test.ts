import { describe, expect, test } from "vitest";
import faviconHandler from "../server/routes/favicon.ico.get.ts";

describe("favicon fallback route", () => {
	test("redirects the conventional favicon path to the SVG asset", async () => {
		const response = await faviconHandler.fetch(new Request("https://skill-router.test/favicon.ico"));

		expect(response.status).toBe(302);
		expect(response.headers.get("location")).toBe("/favicon.svg");
	});
});
