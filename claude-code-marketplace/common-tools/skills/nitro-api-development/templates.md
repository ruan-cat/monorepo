# Nitro v3 项目初始化模板

本文档提供项目初始化所需的完整代码模板。

## 1. nitro.config.ts 基础模板

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	/** 服务端代码目录 */
	serverDir: "server",

	/** 禁用自动导入，显式声明所有依赖 */
	imports: false,

	/** 兼容性日期 */
	compatibilityDate: "2024-09-19",

	/** 开发服务器配置 */
	devServer: {
		port: 3000,
	},
});
```

## 2. nitro.config.ts Cloudflare 部署模板

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",

	/** Cloudflare 部署配置 */
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			/** 部署到 Cloudflare Worker 的名称 */
			name: "your-project-name",
		},
	},
});
```

## 3. filter-data.ts 工具函数模板（可选）

此模板适用于需要 Mock 数据和筛选功能的项目。

```typescript
/**
 * @file 通用数据筛选工具函数
 * @description Generic data filtering utility function
 */

/**
 * 通用数据筛选工具函数
 * 用于根据查询参数对数据列表进行筛选
 *
 * @template TItem - 数据项的类型
 * @template TFilters - 筛选条件的类型，必须是 TItem 的部分字段
 *
 * @param data - 原始数据数组
 * @param filters - 筛选条件对象
 * @returns 筛选后的数据数组
 *
 * 筛选规则：
 * - 字符串字段：使用 `.includes()` 进行模糊匹配
 * - 其他字段（枚举、数字等）：使用 `===` 进行精确匹配
 * - 自动忽略空值、null 和 undefined
 * - 多个条件使用 AND 逻辑
 */
export function filterDataByQuery<TItem, TFilters extends Partial<TItem> = Partial<TItem>>(
	data: readonly TItem[],
	filters: TFilters,
): TItem[] {
	let filteredData = [...data];

	(Object.keys(filters) as Array<keyof TFilters>).forEach((key) => {
		const filterValue = filters[key];

		if (filterValue !== undefined && filterValue !== null && filterValue !== "") {
			filteredData = filteredData.filter((item) => {
				const itemValue = item[key as keyof TItem];

				if (typeof itemValue === "string" && typeof filterValue === "string") {
					return itemValue.includes(filterValue);
				}

				return itemValue === (filterValue as unknown as TItem[keyof TItem]);
			});
		}
	});

	return filteredData;
}
```

## 4. 基础接口模板

```typescript
/**
 * @file 用户列表接口
 * @description User list API
 * GET /users
 */

import { defineHandler } from "nitro/h3";

interface User {
	id: string;
	name: string;
	email: string;
}

export default defineHandler(async (event) => {
	const users: User[] = [
		{ id: "1", name: "John", email: "john@example.com" },
		{ id: "2", name: "Jane", email: "jane@example.com" },
	];

	return {
		success: true,
		data: users,
	};
});
```

## 5. 带参数的接口模板

```typescript
/**
 * @file 创建用户接口
 * @description Create user API
 * POST /users
 */

import { defineHandler, readBody } from "nitro/h3";

interface CreateUserBody {
	name: string;
	email: string;
}

export default defineHandler(async (event) => {
	const body = await readBody<CreateUserBody>(event);

	if (!body.name || !body.email) {
		return {
			success: false,
			message: "name 和 email 是必填字段",
		};
	}

	// 处理业务逻辑...

	return {
		success: true,
		message: "创建成功",
		data: { id: "new-id", ...body },
	};
});
```

## 6. 分页列表接口模板（可选）

此模板适用于需要 Mock 数据和分页功能的场景。

```typescript
/**
 * @file 用户列表分页接口
 * @description User list with pagination API
 * POST /users/list
 */

import { defineHandler, readBody } from "nitro/h3";
import { filterDataByQuery } from "../utils/filter-data";
import { mockUserData } from "./mock-data";

interface QueryParams {
	pageIndex: number;
	pageSize: number;
	name?: string;
}

interface UserItem {
	id: string;
	name: string;
	status: string;
}

export default defineHandler(async (event) => {
	const body = await readBody<QueryParams>(event);
	const { pageIndex = 1, pageSize = 10, ...filters } = body;

	/** 数据筛选 */
	const filteredData = filterDataByQuery(mockUserData, filters);

	/** 分页处理 */
	const total = filteredData.length;
	const startIndex = (pageIndex - 1) * pageSize;
	const pageData = filteredData.slice(startIndex, startIndex + pageSize);

	return {
		success: true,
		message: "查询成功",
		data: {
			list: pageData,
			total,
			pageIndex,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		},
	};
});
```

## 7. 树形数据接口模板（可选）

```typescript
/**
 * @file 组织树形接口
 * @description Organization tree API
 * GET /organization/tree
 */

import { defineHandler } from "nitro/h3";

interface TreeNode {
	id: string;
	name: string;
	parentId: string | null;
	children?: TreeNode[];
}

const mockTreeData: TreeNode[] = [
	{
		id: "1",
		name: "总部",
		parentId: null,
		children: [
			{ id: "2", name: "技术部", parentId: "1" },
			{ id: "3", name: "产品部", parentId: "1" },
		],
	},
];

export default defineHandler(async (event) => {
	return {
		success: true,
		data: mockTreeData,
	};
});
```

## 8. Mock 数据文件模板（可选）

```typescript
/**
 * @file 用户假数据
 * @description User mock data
 */

interface UserItem {
	id: string;
	name: string;
	status: "启用" | "禁用";
	createTime: string;
}

export const mockUserData: UserItem[] = [
	{
		id: "001",
		name: "张三",
		status: "启用",
		createTime: "2024-01-01 09:00:00",
	},
	{
		id: "002",
		name: "李四",
		status: "启用",
		createTime: "2024-01-02 10:00:00",
	},
];
```

## 9. Vite 插件配置模板

```typescript
// build/plugins/index.ts 或 vite.config.ts
import { nitro } from "nitro/vite";
import vue from "@vitejs/plugin-vue";
import type { PluginOption } from "vite";

export function getPluginsList(): PluginOption[] {
	return [
		vue(),

		// 其他 Vite 插件...

		/**
		 * Nitro 全栈插件
		 * @description 将 Vite 项目变成全栈项目
		 * @see https://v3.nitro.build/docs/quick-start#add-to-a-vite-project
		 */
		nitro(),
	];
}
```

## 10. package.json 脚本配置

```json
{
	"scripts": {
		"dev": "nitro dev",
		"build": "nitro build",
		"preview": "nitro preview",
		"typecheck": "tsc --noEmit"
	}
}
```

## 11. 类型定义模板

### 11.1 列表项类型

```typescript
/**
 * @file 用户类型定义
 * @description User type definitions
 */

/** 用户列表项 */
export interface UserItem {
	/** ID */
	id: string;
	/** 名称 */
	name: string;
	/** 状态 */
	status: "启用" | "禁用";
	/** 创建时间 */
	createTime: string;
}

/** 查询参数 */
export interface QueryParams {
	/** 页码 */
	pageIndex: number;
	/** 每页大小 */
	pageSize: number;
	/** 名称（筛选用） */
	name?: string;
	/** 状态（筛选用） */
	status?: string;
}
```

### 11.2 树形节点类型

```typescript
/** 树形节点 */
export interface TreeNode {
	/** ID */
	id: string;
	/** 名称 */
	name: string;
	/** 父节点ID */
	parentId: string | null;
	/** 子节点 */
	children?: TreeNode[];
}
```

## 12. 环境变量配置模板

### 12.1 .env 文件

```bash
# Nitro 运行时配置
# 注意：环境变量必须以 NITRO_ 为前缀

# API 密钥
NITRO_API_TOKEN="your-api-token"

# 数据库连接
NITRO_DATABASE_URL="your-database-url"

# 部署预设（根据部署平台选择）
# NITRO_PRESET=cloudflare_module
# NITRO_PRESET=cloudflare_pages
# NITRO_PRESET=vercel
# NITRO_PRESET=node
```

### 12.2 .env.development

```bash
# 开发环境配置
NITRO_API_TOKEN="dev-token"
NITRO_DEBUG=true
```

### 12.3 .env.production

```bash
# 生产环境配置
NITRO_API_TOKEN="prod-token"
NITRO_DEBUG=false
```
