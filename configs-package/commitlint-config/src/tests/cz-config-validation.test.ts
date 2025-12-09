import { describe, test, expect } from "vitest";
import { config } from "../config.ts";
import { commonScopes } from "../common-scopes.ts";
import { getDefaultScope } from "../get-default-scope.ts";

describe("cz-git 配置验证", () => {
	describe("配置对象完整性测试", () => {
		test("配置对象应该能被成功导出", () => {
			expect(config).toBeDefined();
			expect(config.prompt).toBeDefined();
		});

		test("配置对象的 rules 应该正确定义", () => {
			expect(config.rules).toBeDefined();
			expect(config.rules?.["type-enum"]).toBeDefined();
			expect(config.rules?.["scope-enum"]).toBeDefined();
		});

		test("配置对象的 prompt 应该包含必要字段", () => {
			expect(config.prompt?.messages).toBeDefined();
			expect(config.prompt?.types).toBeDefined();
			expect(config.prompt?.useEmoji).toBeDefined();
		});

		test("配置对象应该能被序列化为 JSON 字符串", () => {
			// 这个测试验证配置对象不包含不可序列化的内容
			// 例如函数、Symbol 等
			// 注意：getDefaultScope() 会在配置初始化时执行，不会导致序列化问题
			expect(() => {
				const serialized = JSON.stringify(config);
				expect(serialized).toBeTruthy();
			}).not.toThrow();
		});
	});

	describe("commonScopes glob 模式验证", () => {
		test("所有 commonScopes 项应该有 code、value、desc 字段", () => {
			commonScopes.forEach((scope) => {
				expect(scope.code).toBeDefined();
				expect(scope.value).toBeDefined();
				expect(scope.desc).toBeDefined();
			});
		});

		test("commonScopes 的 glob 字段应该是字符串数组或 undefined", () => {
			commonScopes.forEach((scope) => {
				if (scope.glob !== undefined) {
					expect(Array.isArray(scope.glob)).toBe(true);
					scope.glob.forEach((pattern) => {
						expect(typeof pattern).toBe("string");
						expect(pattern.length).toBeGreaterThan(0);
					});
				}
			});
		});

		test("commonScopes 应该能被序列化为 JSON", () => {
			expect(() => {
				const serialized = JSON.stringify(commonScopes);
				expect(serialized).toBeTruthy();

				// 验证序列化的字符串不包含异常的 token
				expect(serialized).not.toMatch(/Unexpected token/);

				// 验证可以反序列化回对象
				const deserialized = JSON.parse(serialized);
				expect(Array.isArray(deserialized)).toBe(true);
			}).not.toThrow();
		});

		test("root scope 的 glob 模式应该有效", () => {
			const rootScope = commonScopes.find((scope) => scope.value === "root");
			expect(rootScope).toBeDefined();
			expect(rootScope?.glob).toBeDefined();
			expect(Array.isArray(rootScope?.glob)).toBe(true);

			// 验证 glob 模式格式正确
			rootScope?.glob?.forEach((pattern) => {
				// 不应该包含导致 JSON 解析错误的字符
				expect(pattern).not.toMatch(/\x00/); // 空字符
				expect(typeof pattern).toBe("string");
			});
		});

		test("config scope 的 glob 模式应该有效", () => {
			const configScope = commonScopes.find((scope) => scope.value === "config");
			expect(configScope).toBeDefined();
			expect(configScope?.glob).toBeDefined();

			// 验证包含复杂 glob 模式的配置
			configScope?.glob?.forEach((pattern) => {
				expect(typeof pattern).toBe("string");
				// glob 模式可以包含 *, **, {}, [] 等特殊字符
				// 但这些字符在 JSON 序列化时应该被正确处理
			});
		});
	});

	describe("getDefaultScope 函数测试", () => {
		test("getDefaultScope 应该能被调用而不抛出错误", () => {
			expect(() => {
				const result = getDefaultScope();
				// 结果可以是 string、string[] 或 undefined
				if (result !== undefined) {
					expect(typeof result === "string" || Array.isArray(result)).toBe(true);
				}
			}).not.toThrow();
		});

		test("getDefaultScope 的返回值应该能被序列化", () => {
			const result = getDefaultScope();

			// 如果结果是 undefined，JSON.stringify 会返回 undefined
			// 这是正常的，不应该导致错误
			if (result !== undefined) {
				expect(() => {
					const serialized = JSON.stringify(result);
					expect(serialized).toBeDefined();

					// 验证可以反序列化
					const deserialized = JSON.parse(serialized);
					expect(deserialized).toEqual(result);
				}).not.toThrow();
			} else {
				// undefined 是有效的返回值
				expect(result).toBeUndefined();
			}
		});
	});

	describe("配置完整性集成测试", () => {
		test("整个配置对象应该能够被 JSON 序列化和反序列化", () => {
			// 这模拟了 cz-git 可能对配置进行的处理
			expect(() => {
				// 序列化
				const serialized = JSON.stringify(config);
				expect(serialized).toBeTruthy();

				// 反序列化
				const deserialized = JSON.parse(serialized);
				expect(deserialized).toBeTruthy();

				// 验证关键字段存在
				expect(deserialized.prompt).toBeDefined();
				expect(deserialized.rules).toBeDefined();
			}).not.toThrow();
		});

		test("配置对象不应该包含循环引用", () => {
			// 循环引用会导致 JSON.stringify 抛出错误
			expect(() => {
				JSON.stringify(config);
			}).not.toThrow();
		});

		test("types 配置应该正确格式化", () => {
			expect(config.prompt?.types).toBeDefined();
			expect(Array.isArray(config.prompt?.types)).toBe(true);

			config.prompt?.types?.forEach((type: any) => {
				expect(type.value).toBeDefined();
				expect(type.name).toBeDefined();
				expect(typeof type.value).toBe("string");
				expect(typeof type.name).toBe("string");
			});
		});

		test("defaultScope 应该能正确设置", () => {
			// config.ts 中 defaultScope 调用了 getDefaultScope()
			// 验证这个调用不会导致错误
			const defaultScope = config.prompt?.defaultScope;

			// defaultScope 可以是字符串或空字符串
			expect(typeof defaultScope).toBe("string");
		});
	});

	describe("JSON 序列化边界情况测试", () => {
		test("包含特殊字符的 glob 模式应该能被正确序列化", () => {
			const specialPatterns = ["**/*.{js,jsx}", "**/*.config.{ts,js}", "**/router/**/*.ts", "*.{sh,bat,ps1,cmd}"];

			specialPatterns.forEach((pattern) => {
				expect(() => {
					const obj = { glob: [pattern] };
					const serialized = JSON.stringify(obj);
					const deserialized = JSON.parse(serialized);
					expect(deserialized.glob[0]).toBe(pattern);
				}).not.toThrow();
			});
		});

		test("commonScopes 序列化后不应该包含错误的 token", () => {
			const serialized = JSON.stringify(commonScopes);

			// 验证序列化字符串的格式正确性
			expect(serialized.startsWith("[")).toBe(true);
			expect(serialized.endsWith("]")).toBe(true);

			// 验证不包含异常的 token 模式
			expect(serialized).not.toMatch(/Unexpected token/i);
			expect(serialized).not.toMatch(/is not valid JSON/i);
		});

		test("配置对象序列化后的大小应该合理", () => {
			const serialized = JSON.stringify(config);
			const sizeInBytes = new Blob([serialized]).size;

			// 配置对象序列化后不应该太大（这里设置为 1MB）
			expect(sizeInBytes).toBeLessThan(1024 * 1024);

			// 也不应该为空
			expect(sizeInBytes).toBeGreaterThan(100);
		});
	});
});
