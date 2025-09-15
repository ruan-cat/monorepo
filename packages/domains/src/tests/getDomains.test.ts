import { test, describe, expect, vi } from "vitest";
import { getDomains } from "../utils";
import type { GetDomainsParamsWithAlias } from "../utils";

describe("getDomains 函数测试", () => {
	describe("使用 projectName 字符串参数", () => {
		test("应该返回项目的所有域名 - 简单项目", () => {
			const domains = getDomains("09oa");
			expect(domains).toEqual(["01s-09oa.ruancat6312.top"]);
		});

		test("应该返回项目的所有域名 - 多域名项目", () => {
			const domains = getDomains("10wms-doc");
			expect(domains).toEqual(["01s-10wms-doc.ruancat6312.top", "01s-10wms-frontend-docs.ruancat6312.top"]);
		});

		test("应该返回项目的所有域名 - 包含别名的项目", () => {
			const domains = getDomains("ruan-cat-notes");
			expect(domains).toEqual(["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]);
		});
	});

	describe("使用对象参数 - 不带 projectAlias", () => {
		test("应该返回项目的所有域名 - 简单项目", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "09oa",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["01s-09oa.ruancat6312.top"]);
		});

		test("应该返回项目的所有域名 - 多域名项目", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "10wms-doc",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["01s-10wms-doc.ruancat6312.top", "01s-10wms-frontend-docs.ruancat6312.top"]);
		});

		test("应该返回项目的所有域名 - 包含别名的项目", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]);
		});
	});

	describe("使用对象参数 - 带有效的 projectAlias", () => {
		test("应该返回指定别名的域名 - notesCloudflare", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: "notesCloudflare",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["notes.ruan-cat.com"]);
		});

		test("应该返回指定别名的域名 - notesVercel", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: "notesVercel",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["ruan-cat-notes.ruan-cat.com"]);
		});

		test("应该返回指定别名的域名 - notesGithubWorkflow", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: "notesGithubWorkflow",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["ruan-cat-notes.ruancat6312.top"]);
		});
	});

	describe("使用对象参数 - 带无效的 projectAlias", () => {
		test("应该警告并返回所有域名 - 无效的别名", () => {
			// Mock consola.warn
			const consolaSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: "invalidAlias",
			};
			const domains = getDomains(params);

			// 应该返回所有域名
			expect(domains).toEqual(["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]);

			// 恢复 mock
			consolaSpy.mockRestore();
		});

		test("应该警告并返回所有域名 - 没有别名的项目使用别名查询", () => {
			// Mock consola.warn
			const consolaSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const params: GetDomainsParamsWithAlias = {
				projectName: "09oa",
				projectAlias: "someAlias",
			};
			const domains = getDomains(params);

			// 应该返回所有域名
			expect(domains).toEqual(["01s-09oa.ruancat6312.top"]);

			// 恢复 mock
			consolaSpy.mockRestore();
		});
	});

	describe("边界情况测试", () => {
		test("使用空字符串作为 projectAlias 应该返回所有域名", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: "",
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]);
		});

		test("使用 undefined 作为 projectAlias 应该返回所有域名", () => {
			const params: GetDomainsParamsWithAlias = {
				projectName: "ruan-cat-notes",
				projectAlias: undefined,
			};
			const domains = getDomains(params);
			expect(domains).toEqual(["notes.ruan-cat.com", "ruan-cat-notes.ruan-cat.com", "ruan-cat-notes.ruancat6312.top"]);
		});
	});
});
