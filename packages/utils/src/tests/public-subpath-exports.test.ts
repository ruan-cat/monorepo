import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const packageRoot = resolve(import.meta.dirname, "../..");

const rejectConsolaLoader = `
export async function resolve(specifier, context, nextResolve) {
	if (specifier === "consola") {
		throw new Error("测试禁止窄子路径解析 consola");
	}

	return nextResolve(specifier, context);
}
`;

function runEntrypoint(source: string, rejectConsola = false) {
	if (!rejectConsola) {
		return spawnSync(
			process.execPath,
			["--input-type=module", "--eval", source],
			{
				cwd: packageRoot,
				encoding: "utf8",
			},
		);
	}

	const loaderDirectory = mkdtempSync(
		resolve(tmpdir(), "ruan-cat-utils-loader-"),
	);
	const loaderPath = resolve(loaderDirectory, "reject-consola-loader.mjs");
	writeFileSync(loaderPath, rejectConsolaLoader, "utf8");

	try {
		return spawnSync(
			process.execPath,
			[
				"--experimental-loader",
				pathToFileURL(loaderPath).href,
				"--input-type=module",
				"--eval",
				source,
			],
			{ cwd: packageRoot, encoding: "utf8" },
		);
	} finally {
		rmSync(loaderDirectory, { recursive: true, force: true });
	}
}

describe("@ruan-cat/utils 构建后的窄子路径出口", () => {
	test("node-cjs 的声明文件保留 conditions 导出", () => {
		const declaration = readFileSync(
			resolve(packageRoot, "dist/node-cjs/index.d.cts"),
			"utf8",
		);

		expect(declaration).toContain("isConditionsEvery");
	});

	test("conditions 在禁止解析 consola 时仍可运行", () => {
		const result = runEntrypoint(
			`
			const { isConditionsSome } = await import("@ruan-cat/utils/conditions");
			if (!isConditionsSome([() => false, () => true])) process.exit(1);
		`,
			true,
		);

		expect(result.status, result.stderr).toBe(0);
	});

	test("monorepo 在禁止解析 consola 时仍可运行", () => {
		const result = runEntrypoint(
			`
			const { findMonorepoRoot } = await import("@ruan-cat/utils/monorepo");
			if (!findMonorepoRoot(process.cwd())?.endsWith("monorepo")) process.exit(1);
		`,
			true,
		);

		expect(result.status, result.stderr).toBe(0);
	});

	test("默认 ESM、node-esm 与 node-cjs 构建入口均可加载", () => {
		const result = runEntrypoint(`
			await import("@ruan-cat/utils");
			await import("@ruan-cat/utils/node-esm");
			const { createRequire } = await import("node:module");
			createRequire(import.meta.url)("@ruan-cat/utils/node-cjs");
		`);

		expect(result.status, result.stderr).toBe(0);
	});
});
