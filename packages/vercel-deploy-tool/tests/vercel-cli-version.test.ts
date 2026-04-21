import { strictEqual } from "node:assert";
import { describe, test } from "vitest";
import { isVercelCliVersionSupported, parseVercelCliVersion } from "@ruan-cat/vercel-deploy-tool/src/core/vercel.ts";

describe("Vercel CLI 版本检查", () => {
	test("解析 Vercel CLI 的版本输出", () => {
		strictEqual(parseVercelCliVersion("Vercel CLI 51.8.0"), "51.8.0");
		strictEqual(parseVercelCliVersion("51.8.0"), "51.8.0");
	});

	test("判断 Vercel CLI 是否满足最低版本", () => {
		strictEqual(isVercelCliVersionSupported("47.2.1"), false);
		strictEqual(isVercelCliVersionSupported("47.2.2"), true);
		strictEqual(isVercelCliVersionSupported("51.8.0"), true);
	});
});
