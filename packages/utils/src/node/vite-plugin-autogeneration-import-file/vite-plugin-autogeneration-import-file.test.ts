import { test } from "vitest";

import { getDefaultAutoImportTemplate } from "./index.ts";
// import "./index.ts";

test("getDefaultAutoImportTemplate", () => {
	const res = getDefaultAutoImportTemplate();
	console.log(res);
});
