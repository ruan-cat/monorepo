import { describe, test, expect } from "vitest";
import { config } from "../config.ts";

describe("cz-git 集成测试", () => {
	describe("配置加载模拟", () => {
		test("应该能模拟 cz-git 加载配置的过程", () => {
			// 模拟 cz-git 可能进行的配置处理
			expect(() => {
				// 1. 读取配置对象
				const czConfig = config;
				expect(czConfig).toBeDefined();

				// 2. 访问 prompt 配置
				const promptConfig = czConfig.prompt;
				expect(promptConfig).toBeDefined();

				// 3. 检查必要的字段
				expect(promptConfig?.types).toBeDefined();
				expect(promptConfig?.messages).toBeDefined();
				expect(promptConfig?.useEmoji).toBeDefined();

				// 4. 验证 types 数组格式正确
				expect(Array.isArray(promptConfig?.types)).toBe(true);
				promptConfig?.types?.forEach((type: any) => {
					expect(type).toHaveProperty("value");
					expect(type).toHaveProperty("name");
				});

				// 5. 验证 defaultScope 字段存在且类型正确
				const defaultScope = promptConfig?.defaultScope;
				expect(typeof defaultScope).toBe("string");
			}).not.toThrow();
		});

		test("配置应该能被深度克隆而不出错", () => {
			// cz-git 可能会克隆配置对象
			expect(() => {
				const cloned = JSON.parse(JSON.stringify(config));
				expect(cloned).toBeDefined();
				expect(cloned.prompt).toBeDefined();
			}).not.toThrow();
		});

		test("配置中的数组字段应该能被正确遍历", () => {
			// 测试 types 数组
			expect(() => {
				const types = config.prompt?.types;
				if (Array.isArray(types)) {
					types.forEach((type) => {
						expect(type).toBeDefined();
					});
				}
			}).not.toThrow();
		});

		test("配置中的字符串字段不应该包含异常字符", () => {
			// 序列化配置
			const serialized = JSON.stringify(config);

			// 验证序列化后的字符串不包含可能导致 JSON 解析错误的模式
			expect(serialized).not.toMatch(/Unexpected token/i);
			expect(serialized).not.toMatch(/is not valid JSON/i);

			// 验证可以成功反序列化
			expect(() => {
				const parsed = JSON.parse(serialized);
				expect(parsed).toBeDefined();
			}).not.toThrow();
		});
	});

	describe("规则配置测试", () => {
		test("rules 配置应该正确定义", () => {
			expect(config.rules).toBeDefined();

			// 验证 type-enum 规则
			const typeEnum = config.rules?.["type-enum"];
			expect(typeEnum).toBeDefined();
			expect(Array.isArray(typeEnum)).toBe(true);
			if (Array.isArray(typeEnum)) {
				expect(typeEnum.length).toBe(3);
				expect(typeEnum[0]).toBe(2); // 错误级别
				expect(typeEnum[1]).toBe("always");
				expect(Array.isArray(typeEnum[2])).toBe(true);
			}

			// 验证 scope-enum 规则
			const scopeEnum = config.rules?.["scope-enum"];
			expect(scopeEnum).toBeDefined();
			expect(Array.isArray(scopeEnum)).toBe(true);
			if (Array.isArray(scopeEnum)) {
				expect(scopeEnum.length).toBe(3);
				expect(scopeEnum[0]).toBe(1); // 警告级别
				expect(scopeEnum[1]).toBe("always");
				expect(Array.isArray(scopeEnum[2])).toBe(true);
			}
		});

		test("type-enum 规则的值应该能被序列化", () => {
			const typeEnum = config.rules?.["type-enum"];

			expect(() => {
				const serialized = JSON.stringify(typeEnum);
				const deserialized = JSON.parse(serialized);
				expect(deserialized).toEqual(typeEnum);
			}).not.toThrow();
		});

		test("scope-enum 规则的值应该能被序列化", () => {
			const scopeEnum = config.rules?.["scope-enum"];

			expect(() => {
				const serialized = JSON.stringify(scopeEnum);
				const deserialized = JSON.parse(serialized);
				expect(deserialized).toEqual(scopeEnum);
			}).not.toThrow();
		});
	});

	describe("消息配置测试", () => {
		test("messages 配置应该包含所有必要的提示信息", () => {
			const messages = config.prompt?.messages;
			expect(messages).toBeDefined();

			// 验证关键的消息字段
			expect(messages?.type).toBeDefined();
			expect(messages?.scope).toBeDefined();
			expect(messages?.subject).toBeDefined();
			expect(messages?.confirmCommit).toBeDefined();
		});

		test("messages 配置应该能被序列化", () => {
			const messages = config.prompt?.messages;

			expect(() => {
				const serialized = JSON.stringify(messages);
				const deserialized = JSON.parse(serialized);
				expect(deserialized).toEqual(messages);
			}).not.toThrow();
		});

		test("消息文本不应该包含会导致 JSON 解析错误的字符", () => {
			const messages = config.prompt?.messages;
			const serialized = JSON.stringify(messages);

			// 验证序列化成功且格式正确
			expect(serialized).toBeDefined();
			expect(() => JSON.parse(serialized)).not.toThrow();
		});
	});

	describe("emoji 配置测试", () => {
		test("useEmoji 配置应该正确设置", () => {
			expect(config.prompt?.useEmoji).toBe(true);
		});

		test("emojiAlign 配置应该正确设置", () => {
			expect(config.prompt?.emojiAlign).toBe("center");
		});

		test("types 中的每个选项应该包含正确的格式", () => {
			const types = config.prompt?.types;

			if (Array.isArray(types)) {
				types.forEach((type: any) => {
					// value 应该包含 emoji
					expect(type.value).toBeDefined();
					expect(typeof type.value).toBe("string");

					// name 应该包含格式化的描述
					expect(type.name).toBeDefined();
					expect(typeof type.name).toBe("string");
				});
			}
		});
	});

	describe("作用域配置测试", () => {
		test("作用域相关配置应该正确设置", () => {
			expect(config.prompt?.enableMultipleScopes).toBe(true);
			expect(config.prompt?.scopeEnumSeparator).toBe(",");
			expect(config.prompt?.allowCustomScopes).toBe(true);
			expect(config.prompt?.allowEmptyScopes).toBe(true);
		});

		test("defaultScope 应该是字符串类型", () => {
			const defaultScope = config.prompt?.defaultScope;
			expect(typeof defaultScope).toBe("string");
		});
	});

	describe("配置完整性验证", () => {
		test("配置对象应该包含所有必要的顶层字段", () => {
			expect(config).toHaveProperty("rules");
			expect(config).toHaveProperty("prompt");
		});

		test("整个配置对象在序列化和反序列化后应该保持一致", () => {
			const serialized = JSON.stringify(config);
			const deserialized = JSON.parse(serialized);

			// 验证关键字段
			expect(deserialized.rules).toBeDefined();
			expect(deserialized.prompt).toBeDefined();
			expect(deserialized.prompt.messages).toBeDefined();
			expect(deserialized.prompt.types).toBeDefined();
		});

		test("配置序列化不应该产生异常大的输出", () => {
			const serialized = JSON.stringify(config);
			const sizeInKB = new Blob([serialized]).size / 1024;

			// 配置大小应该在合理范围内（小于 100KB）
			expect(sizeInKB).toBeLessThan(100);
			expect(sizeInKB).toBeGreaterThan(1);
		});
	});
});
