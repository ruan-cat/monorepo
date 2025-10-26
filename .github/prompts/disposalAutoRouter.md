<!--
	一次性提示词
	已完成
 -->

# 生成路由脏数据格式化函数

为我编写一个 typescript 函数，用于实现路由脏数据的格式化。

该函数接收一个包含路由信息的对象数组，并返回一个处理后的对象数组。

## 脏数据的路由数组

比如：

```ts
import type { RouteRecordRaw } from "vue-router";

const routeFromAutoRouter: RouteRecordRaw[] = {
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
};
```

那么我期望处理后的结果为：

```ts
import type { RouteRecordRaw } from "vue-router";

const goodRoute: RouteRecordRaw[] = {
	path: "/message-middle",
	name: "message-middle",
	meta: {
		menuType: "folder",
		text: "消息中间件",
		icon: "IconMessage",
	},
	alias: [],
	children: [
		{
			path: "/message-middle/message-center",
			name: "message-middle-message-center",
			meta: {
				menuType: "page",
				text: "消息中心",
				icon: "IconMessage",
			},
			alias: [],
		},
		{
			path: "/message-middle/message-template",
			name: "message-middle-message-template",
			meta: {
				menuType: "page",
				text: "消息模块",
				icon: "IconMessage",
			},
			alias: [],
		},
		{
			path: "/message-middle/work-setting",
			name: "message-middle-work-setting",
			meta: {
				menuType: "page",
				text: "业务配置",
				icon: "IconSetting",
			},
			alias: [],
		},
		{
			path: "/message-middle/work-sql",
			name: "message-middle-work-sql",
			meta: {
				menuType: "page",
				text: "业务SQL",
				icon: "IconSetting",
			},
			alias: [],
		},
	],
};
```

## 注意事项

在你实现业务时，请务必遵守以下注意事项：

### 仅仅针对 `path: "",` 的路由

我们的目的是将路径 path 为空字符串的路由信息，提取复制到父级路由内。

我们只重点处理路径为空字符串的路由。其他不满足要求的路由，不要做任何多余的处理。

### 仅复制除 path 路径的其他路由信息

比如以下例子：

```ts
const routeFromAutoRouter: RouteRecordRaw[] = {
	path: "/base-config",
	children: [
		{
			path: "",
			name: "base-config",
			meta: {
				menuType: "folder",
				text: "基础配置",
				icon: {
					name: "Box",
					__name: "box",
				},
			},
			alias: [],
		},
	],
};
```

我们将子路由的以下信息都移动到父级路由内，

- name
- meta
- alias

处理后的效果如下：

```ts
const routeFromAutoRouter: RouteRecordRaw[] = {
	path: "/base-config",
	name: "base-config",
	meta: {
		menuType: "folder",
		text: "基础配置",
		icon: {
			name: "Box",
			__name: "box",
		},
	},
	alias: [],
};
```

路径处理交由其他的逻辑实现。在复制数据时，我们仅复制除开 path 路径的其他路由信息。

### 及时删除掉空路径路由信息

在处理完路径为空字符串的路由后，请务必删除掉该路由信息。不要留下多余的 children 数组。

如果父级路由的 children 数组为空，请务必删除掉该 children 数组。

### 拼接子路由的完整路径

当你注意到当前路由的 path 不为空字符串时，请将子路由的 path 拼接上父级路由的 path。

比如子路由的 path 为 `message-center` ，父路由的 path 为 `/message-middle` 。

那么子路由拼接后的完整路径为 `/message-middle/message-center` 。
