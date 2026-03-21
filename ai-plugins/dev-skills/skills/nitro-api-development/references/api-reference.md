# Nitro API 快速参考手册 (Quick Reference)

本文档提供 Nitro v3 开发时的函数、配置和常用类型速查表。

## 1. 核心函数导入

### 1.1 事件处理与请求函数

| 函数             |    来源    |                                  说明 |
| :--------------- | :--------: | ------------------------------------: |
| `defineHandler`  | `nitro/h3` |        **定义事件处理器**（必须使用） |
| `readBody`       | `nitro/h3` |                            读取请求体 |
| `getQuery`       | `nitro/h3` |                    获取查询参数 (GET) |
| `getRouterParam` | `nitro/h3` | 获取路由参数 (如 `[id].ts` 中的 `id`) |
| `getHeaders`     | `nitro/h3` |                            获取请求头 |
| `setHeader`      | `nitro/h3` |                            设置响应头 |
| `setCookie`      | `nitro/h3` |                           设置 Cookie |
| `getCookie`      | `nitro/h3` |                           获取 Cookie |

### 1.2 运行时配置函数

| 函数               |          来源          |               说明 |
| :----------------- | :--------------------: | -----------------: |
| `useRuntimeConfig` | `nitro/runtime-config` | 获取运行时配置对象 |

### 1.3 响应函数

| 函数           |    来源    |           说明 |
| :------------- | :--------: | -------------: |
| `send`         | `nitro/h3` |       发送响应 |
| `sendRedirect` | `nitro/h3` | 发送重定向响应 |
| `sendError`    | `nitro/h3` |   发送错误响应 |
| `createError`  | `nitro/h3` |   创建错误对象 |

## 2. 配置选项速查

### 2.1 nitro.config.ts 主要选项

```typescript
export default defineConfig({
	// 服务端目录
	serverDir: "./server",

	// 扫描目录
	scanDirs: ["./server"],

	// 禁用自动导入，显式声明所有依赖
	imports: false,

	// 开发服务器
	devServer: {
		watch: ["./server/**/*.ts"],
		port: 3000,
	},

	// 路径别名
	alias: {
		"@": "./src",
		server: "./server",
	},

	// 兼容性日期
	compatibilityDate: "2024-09-19",

	// TypeScript 配置
	typescript: {
		typeCheck: false,
	},

	// 部署预设（根据平台选择）
	// preset: "cloudflare_module",

	// Cloudflare 配置（可选）
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			name: "your-project-name",
		},
	},
});
```

### 2.2 部署预设列表

| 预设                |        平台        |
| :------------------ | :----------------: |
| `node`              |   Node.js 服务器   |
| `cloudflare_module` | Cloudflare Workers |
| `cloudflare_pages`  |  Cloudflare Pages  |
| `vercel`            |       Vercel       |
| `netlify`           |      Netlify       |
| `static`            |      静态站点      |
| `deno`              |    Deno Deploy     |

## 3. 接口编写速查

### 3.1 基础接口结构

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { db } from "server/db"; // 根据项目实际路径调整
import { users } from "./schema"; // 根据项目实际路径调整
import type { ApiResponse } from "./types"; // 参见 templates/types.ts
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
	try {
		/** 读取请求体 (必须使用 await，且建议断言为 any 以便后续清洗) */
		const body = (await readBody(event)) as any;

		/** 处理逻辑... */
		const [result] = await db.select().from(users).where(eq(users.id, body.id));

		/** 使用 ApiResponse 类型注解约束成功响应 */
		const response: ApiResponse<typeof result> = {
			success: true,
			code: 200,
			message: "操作成功",
			data: result,
		};
		return response;
	} catch (error: any) {
		console.error("[API Error]", error);

		/** 使用 ApiResponse<null> 类型注解约束错误响应 */
		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "操作失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.2 列表接口的类型约束结构

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { db } from "server/db"; // 根据项目实际路径调整
import { yourTable } from "./schema"; // 根据项目实际路径调整
import type { ApiResponse, PageData } from "./types"; // 参见 templates/types.ts
import { desc, sql } from "drizzle-orm";

export default defineHandler(async (event) => {
	try {
		const body = (await readBody(event)) as any;

		/** 查询分页数据 */
		const data = await db
			.select()
			.from(yourTable)
			.orderBy(desc(yourTable.createTime))
			.limit(body.pageSize || 10)
			.offset(((body.page || 1) - 1) * (body.pageSize || 10));

		/** 查询总数 */
		const [countResult] = await db.select({ total: sql<number>`count(*)` }).from(yourTable);
		const total = Number(countResult?.total || 0);
		const totalPages = Math.ceil(total / (body.pageSize || 10));

		/**
		 * 使用 ApiResponse<PageData<...>> 类型注解约束列表响应
		 * (typeof data)[number] 自动推断 Drizzle 查询结果的行类型
		 */
		const response: ApiResponse<PageData<(typeof data)[number]>> = {
			success: true,
			code: 200,
			message: "查询成功",
			data: {
				list: data,
				total,
				pageIndex: body.page || 1,
				pageSize: body.pageSize || 10,
				totalPages,
			},
		};
		return response;
	} catch (error: any) {
		console.error("[List] Error:", error);

		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "查询失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.3 获取查询参数 (GET)

```typescript
import { defineHandler, getQuery } from "nitro/h3";
import type { ApiResponse } from "./types";

export default defineHandler(async (event) => {
	try {
		const query = getQuery(event);
		const id = query.id;

		return {
			success: true,
			code: 200,
			message: "查询成功",
			data: { id },
		};
	} catch (error: any) {
		console.error("[API Error]", error);
		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "查询失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.4 获取路由参数

```typescript
/** 文件: [id].get.ts */
import { defineHandler, getRouterParam } from "nitro/h3";
import type { ApiResponse } from "./types";

export default defineHandler(async (event) => {
	try {
		const id = getRouterParam(event, "id");

		return {
			success: true,
			code: 200,
			message: "查询成功",
			data: { id },
		};
	} catch (error: any) {
		console.error("[API Error]", error);
		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "查询失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.5 设置响应头

```typescript
import { defineHandler, setHeader } from "nitro/h3";

export default defineHandler(async (event) => {
	setHeader(event, "Content-Type", "application/json");
	setHeader(event, "Cache-Control", "max-age=3600");

	return { data: "response" };
});
```

## 4. 环境变量速查

### 4.1 访问环境变量

```typescript
import { defineHandler } from "nitro/h3";
import { useRuntimeConfig } from "nitro/runtime-config";

export default defineHandler((event) => {
	// 方式1: 通过 useRuntimeConfig（推荐）
	const config = useRuntimeConfig();
	const value1 = config.myValue;

	// 方式2: 通过 process.env
	const value2 = process.env.NITRO_MY_VALUE;

	// 方式3: 通过 import.meta.env
	const value3 = import.meta.env.MY_VALUE;

	return { value1, value2, value3 };
});
```

### 4.2 环境变量命名转换

| 配置键          | 环境变量                |
| :-------------- | :---------------------- |
| `apiToken`      | `NITRO_API_TOKEN`       |
| `databaseUrl`   | `NITRO_DATABASE_URL`    |
| `myCustomValue` | `NITRO_MY_CUSTOM_VALUE` |

## 5. 错误处理速查

### 5.1 参数校验失败时的错误响应

```typescript
import { defineHandler, readBody } from "nitro/h3";
import type { ApiResponse } from "./types";

export default defineHandler(async (event) => {
	try {
		const body = (await readBody(event)) as any;

		if (!body.id) {
			/** 使用 ApiResponse<null> 类型注解约束参数错误响应 */
			const badRequestResponse: ApiResponse<null> = {
				success: false,
				code: 400,
				message: "缺少必要参数 id",
				data: null,
			};
			return badRequestResponse;
		}

		const response: ApiResponse<null> = {
			success: true,
			code: 200,
			message: "操作成功",
			data: null,
		};
		return response;
	} catch (error: any) {
		console.error("[API Error]", error);

		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "操作失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 5.2 标准错误响应格式

所有错误响应 **必须** 使用 `ApiResponse<null>` 类型注解标注变量，确保编译期检查字段结构。catch 块中**必须**包含 `error` 和 `stack` 字段：

```typescript
/** 参数校验错误（业务逻辑异常，无需 error/stack） */
const badRequestResponse: ApiResponse<null> = {
	success: false,
	code: 400,
	message: "请求参数错误",
	data: null,
};

/** 资源不存在（业务逻辑异常，无需 error/stack） */
const notFoundResponse: ApiResponse<null> = {
	success: false,
	code: 404,
	message: "记录不存在",
	data: null,
};

/** 服务器内部错误（catch 块中，必须携带 error 和 stack） */
const errorResponse: ApiResponse<null> = {
	success: false,
	code: 500,
	message: "操作失败",
	data: null,
	error: error.message || String(error),
	stack: error.stack,
};
```

## 6. 文件路径与 API 路径映射

| 文件路径                                 | HTTP 方法 |                API 路径 |
| :--------------------------------------- | :-------: | ----------------------: |
| `server/routes/users.get.ts`             |    GET    |                `/users` |
| `server/routes/users.post.ts`            |   POST    |                `/users` |
| `server/api/users/list.post.ts`          |   POST    |       `/api/users/list` |
| `server/api/users/[id].get.ts`           |    GET    |        `/api/users/:id` |
| `server/api/users/create.post.ts`        |   POST    |     `/api/users/create` |
| `server/api/users/[id]/update.put.ts`    |    PUT    | `/api/users/:id/update` |
| `server/api/users/[id]/delete.delete.ts` |  DELETE   | `/api/users/:id/delete` |

## 7. 常用类型定义

> 完整可复用的 TypeScript 类型文件请参见 [templates/types.ts](../templates/types.ts)

### 7.1 ApiResponse 响应包装类型

```typescript
interface ApiResponse<T> {
	success: boolean;
	code: number;
	message: string;
	data: T;
	timestamp?: number;
	error?: string;
	stack?: string;
}
```

### 7.2 PageData 分页数据类型

```typescript
interface PageData<T> {
	list: T[];
	total: number;
	pageIndex: number;
	pageSize: number;
	totalPages: number;
}
```

### 7.3 查询参数基础类型

```typescript
interface BaseQueryParams {
	pageIndex: number;
	pageSize: number;
}
```

## 8. 开发命令速查

```bash
# 开发模式
pnpm nitro dev

# 构建
pnpm nitro build

# 预览
pnpm nitro preview

# 类型检查
pnpm typecheck
```

## 9. 调试技巧

### 9.1 使用 consola 日志

```typescript
import consola from "consola";
import { defineHandler } from "nitro/h3";

export default defineHandler(async (event) => {
	consola.info("收到请求");
	consola.debug("请求详情:", event);
	consola.warn("警告信息");
	consola.error("错误信息");

	return { success: true, code: 200, message: "操作成功", data: null };
});
```

### 9.2 请求调试

```typescript
import { defineHandler, readBody, getQuery, getHeaders } from "nitro/h3";

export default defineHandler(async (event) => {
	const body = await readBody(event);
	const query = getQuery(event);
	const headers = getHeaders(event);

	console.log("Body:", body);
	console.log("Query:", query);
	console.log("Headers:", headers);

	return { success: true, code: 200, message: "调试成功", data: { body, query } };
});
```
