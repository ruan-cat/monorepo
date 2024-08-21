import { navbar } from "vuepress-theme-hope";

export default navbar([
	"/",
	"/demo/",
	{
		text: "指南",
		icon: "lightbulb",
		prefix: "/guide/",
		children: [
			{
				text: "Bar",
				icon: "lightbulb",
				prefix: "bar/",
				children: ["baz", { text: "...", icon: "ellipsis", link: "" }],
			},
			{
				text: "Foo",
				icon: "lightbulb",
				prefix: "foo/",
				children: ["ray", { text: "...", icon: "ellipsis", link: "" }],
			},
		],
	},
	{
		text: "V2 文档",
		icon: "book",
		link: "https://theme-hope.vuejs.press/zh/",
	},
	// 怀疑这里无法打开一个有意义的SPA。无法启动 eslint-config-inspector 内所需的nitro服务。
	// {
	// 	text: "eslint-config-inspector",
	// 	// link: "../../../../.eslint-config-inspector/index.html",
	// 	link: "/eslint-config-inspector/index",
	// 	// target: "/eslint-config-inspector/index.html",
	// },
]);
