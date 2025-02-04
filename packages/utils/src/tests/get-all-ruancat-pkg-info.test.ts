import { expect, test } from "vitest";

import { getRuanCatPkgInfo } from "@ruan-cat/utils";

test("查询全部的阮喵喵依赖包", async () => {
	console.log(await getRuanCatPkgInfo());
});
