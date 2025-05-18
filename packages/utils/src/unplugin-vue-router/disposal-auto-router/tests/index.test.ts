import { describe, it, expect } from "vitest";
import { disposalAutoRouter } from "../index";
import { autoRouterData } from "./auto-router-data";
import type { RouteRecordRaw } from "vue-router";

describe("disposalAutoRouter", () => {
	it("将自动化路由返回的数据减少层级", () => {
		const result = disposalAutoRouter(autoRouterData as unknown as RouteRecordRaw[]);

		// 验证函数能正常处理并返回数据
		expect(result).toBeDefined();
		expect(Array.isArray(result)).toBe(true);

		// 检查一些基本路由结构是否正确处理
		const baseConfig = result.find((route) => route.path === "/base-config");
		expect(baseConfig).toBeDefined();

		if (baseConfig) {
			// 验证空路径子路由的信息已复制到父路由
			expect(baseConfig.name).toBe("base-config");
			expect(baseConfig.meta).toEqual({
				menuType: "folder",
				text: "基础配置",
				icon: {
					name: "Box",
					__name: "box",
				},
			});

			// 验证子路由路径是否正确拼接
			if (baseConfig.children) {
				const autoCoding = baseConfig.children.find((route) => route.name === "base-config-auto-coding");
				expect(autoCoding).toBeDefined();

				if (autoCoding) {
					expect(autoCoding.path).toBe("/base-config/auto-coding");
					expect(autoCoding.meta).toEqual({
						menuType: "page",
						text: "自动编码",
						icon: "IconSetting",
					});
				}
			}
		}

		// 测试处理空数组的情况
		expect(disposalAutoRouter([])).toEqual([]);

		// 输出测试结果，方便调试
		// console.log(JSON.stringify(result, null, 2));
	});

	it("处理简单的路由示例", () => {
		const simpleRoute = [
			{
				path: "/message-middle",
				children: [
					{
						path: "",
						name: "message-middle",
						meta: {
							menuType: "folder",
							text: "消息中间件",
							icon: "IconMessage",
						},
						alias: [],
					},
					{
						path: "message-center",
						children: [
							{
								path: "",
								name: "message-middle-message-center",
								meta: {
									menuType: "page",
									text: "消息中心",
									icon: "IconMessage",
								},
								alias: [],
							},
						],
					},
				],
			},
		] as unknown as RouteRecordRaw[];

		const result = disposalAutoRouter(simpleRoute);

		// 验证处理结果
		expect(result[0].path).toBe("/message-middle");
		expect(result[0].name).toBe("message-middle");
		expect(result[0].meta?.text).toBe("消息中间件");

		if (result[0].children) {
			expect(result[0].children.length).toBe(1);
			expect(result[0].children[0].path).toBe("/message-middle/message-center");
			expect(result[0].children[0].name).toBe("message-middle-message-center");
		}
	});
});
