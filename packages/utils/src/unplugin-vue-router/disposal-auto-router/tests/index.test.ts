import { describe, it, expect } from "vitest";
import { disposalAutoRouter, processRoute } from "../index";
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

	it("测试processRoute函数单独使用", () => {
		const route = {
			path: "/test",
			children: [
				{
					path: "",
					name: "test-route",
					meta: { title: "测试路由" },
					redirect: "/test/child",
					beforeEnter: () => true,
					props: { id: 1 },
					alias: ["/test-alias"],
				},
				{
					path: "child",
					name: "test-child",
				},
			],
		} as unknown as RouteRecordRaw;

		const processed = processRoute(route);

		// 验证路径处理
		expect(processed.path).toBe("/test");

		// 验证完整属性复制
		expect(processed.name).toBe("test-route");
		expect(processed.meta).toEqual({ title: "测试路由" });
		expect(processed.redirect).toBe("/test/child");
		expect(processed.beforeEnter).toBeDefined();
		expect(processed.props).toEqual({ id: 1 });
		expect(processed.alias).toEqual(["/test-alias"]);

		// 验证子路由处理
		if (processed.children) {
			expect(processed.children.length).toBe(1);
			expect(processed.children[0].path).toBe("/test/child");
			expect(processed.children[0].name).toBe("test-child");
		}
	});

	it("测试复杂对象的属性复制", () => {
		const route = {
			path: "/complex",
			children: [
				{
					path: "",
					name: "complex-route",
					meta: {
						permissions: ["admin", "user"],
						settings: {
							cache: true,
							timeout: 5000,
						},
					},
					components: {
						default: { template: "<div>默认视图</div>" },
						sidebar: { template: "<div>侧边栏</div>" },
					},
				},
			],
		} as unknown as RouteRecordRaw;

		const processed = processRoute(route);

		// 验证复杂对象的复制
		expect(processed.meta?.permissions).toEqual(["admin", "user"]);
		expect(processed.meta?.settings).toEqual({ cache: true, timeout: 5000 });
		expect(processed.components).toBeDefined();
		if (processed.components) {
			expect(Object.keys(processed.components)).toContain("default");
			expect(Object.keys(processed.components)).toContain("sidebar");
		}
	});

	it("测试文档示例中的完整路由场景", () => {
		// 来自example.ts的示例路由
		const routeFromAutoRouter = {
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
				{
					path: "message-template",
					children: [
						{
							path: "",
							name: "message-middle-message-template",
							meta: {
								menuType: "page",
								text: "消息模块",
								icon: "IconMessage",
							},
							alias: [],
						},
					],
				},
				{
					path: "work-setting",
					children: [
						{
							path: "",
							name: "message-middle-work-setting",
							meta: {
								menuType: "page",
								text: "业务配置",
								icon: "IconSetting",
							},
							alias: [],
						},
					],
				},
				{
					path: "work-sql",
					children: [
						{
							path: "",
							name: "message-middle-work-sql",
							meta: {
								menuType: "page",
								text: "业务SQL",
								icon: "IconSetting",
							},
							alias: [],
						},
					],
				},
			],
		} as unknown as RouteRecordRaw;

		// 处理自动路由数据
		const result = disposalAutoRouter([routeFromAutoRouter]);

		// 验证结果
		expect(result.length).toBe(1);

		const processedRoute = result[0];
		expect(processedRoute.path).toBe("/message-middle");
		expect(processedRoute.name).toBe("message-middle");
		expect(processedRoute.meta).toEqual({
			menuType: "folder",
			text: "消息中间件",
			icon: "IconMessage",
		});

		// 验证子路由数量
		expect(processedRoute.children).toBeDefined();
		if (processedRoute.children) {
			expect(processedRoute.children.length).toBe(4);

			// 验证所有子路由都被正确处理
			const childPaths = processedRoute.children.map((route) => route.path);
			expect(childPaths).toContain("/message-middle/message-center");
			expect(childPaths).toContain("/message-middle/message-template");
			expect(childPaths).toContain("/message-middle/work-setting");
			expect(childPaths).toContain("/message-middle/work-sql");

			// 验证子路由属性
			const messageCenter = processedRoute.children.find((route) => route.path === "/message-middle/message-center");
			if (messageCenter) {
				expect(messageCenter.name).toBe("message-middle-message-center");
				expect(messageCenter.meta?.text).toBe("消息中心");
			}
		}
	});
});
