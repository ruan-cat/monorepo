# Nitro v3 快速参考手册

本文档提供 Nitro v3 开发的快速参考，便于快速查阅常用函数和配置。

## 1. 核心函数速查

### 1.1 请求处理函数

| 函数             |    来源    |               说明 |
| :--------------- | :--------: | -----------------: |
| `defineHandler`  | `nitro/h3` | 定义请求处理器函数 |
| `readBody`       | `nitro/h3` |     读取请求体数据 |
| `getQuery`       | `nitro/h3` |  获取 URL 查询参数 |
| `getRouterParam` | `nitro/h3` |   获取路由动态参数 |
| `getHeader`      | `nitro/h3` |         获取请求头 |
| `setHeader`      | `nitro/h3` |         设置响应头 |
| `setCookie`      | `nitro/h3` |        设置 Cookie |
| `getCookie`      | `nitro/h3` |        获取 Cookie |

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
	/** 服务端目录 */
	serverDir: "server",

	/** 禁用自动导入 */
	imports: false,

	/** 兼容性日期 */
	compatibilityDate: "2024-09-19",

	/** 开发服务器 */
	devServer: {
		port: 3000,
		watch: ["./server/**/*.ts"],
	},

	/** 路径别名（可选） */
	alias: {
		"@": "./src",
		server: "./server",
	},

	/** TypeScript 配置 */
	typescript: {
		typeCheck: false,
	},

	/** Cloudflare 配置（可选） */
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			name: "project-name",
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

export default defineHandler(async (event) => {
	// 读取请求体
	const body = await readBody(event);

	// 处理逻辑...

	// 返回响应
	return { success: true, data: {} };
});
```

### 3.2 带类型约束的接口结构

```typescript
import { defineHandler, readBody } from "nitro/h3";

interface QueryParams {
	pageIndex: number;
	pageSize: number;
	keyword?: string;
}

interface ListItem {
	id: string;
	name: string;
}

export default defineHandler(async (event) => {
	const body = await readBody<QueryParams>(event);
	const { pageIndex = 1, pageSize = 10 } = body;

	// 处理业务逻辑...
	const list: ListItem[] = [];
	const total = 0;

	return {
		success: true,
		data: {
			list,
			total,
			pageIndex,
			pageSize,
			totalPages: Math.ceil(total / pageSize),
		},
	};
});
```

### 3.3 获取查询参数

```typescript
import { defineHandler, getQuery } from "nitro/h3";

export default defineHandler(async (event) => {
	const query = getQuery(event);
	const id = query.id;
	const name = query.name;

	return { id, name };
});
```

### 3.4 获取路由参数

```typescript
// 文件: [id].get.ts
import { defineHandler, getRouterParam } from "nitro/h3";

export default defineHandler(async (event) => {
	const id = getRouterParam(event, "id");

	return { id };
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
	// 方式1: 通过 useRuntimeConfig
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

### 5.1 创建错误响应

```typescript
import { defineHandler, createError } from "nitro/h3";

export default defineHandler(async (event) => {
	const body = await readBody(event);

	if (!body.id) {
		throw createError({
			statusCode: 400,
			statusMessage: "Bad Request",
			message: "缺少必要参数 id",
		});
	}

	return { success: true };
});
```

### 5.2 标准错误响应格式

```typescript
const errorResponse = {
	success: false,
	message: "请求参数错误",
	data: null,
};
```

## 6. 文件路径与 API 路径映射

| 文件路径                              | HTTP 方法 |                API 路径 |
| :------------------------------------ | :-------: | ----------------------: |
| `server/routes/users.get.ts`          |    GET    |                `/users` |
| `server/routes/users.post.ts`         |   POST    |                `/users` |
| `server/routes/users/[id].get.ts`     |    GET    |            `/users/:id` |
| `server/api/users/list.post.ts`       |   POST    |       `/api/users/list` |
| `server/api/users/[id]/update.put.ts` |    PUT    | `/api/users/:id/update` |

## 7. 常用类型定义（可选）

### 7.1 基础响应类型

```typescript
interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
}
```

### 7.2 分页数据类型

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

## 8. 常用常量

```typescript
/** HTTP 状态码 */
const SUCCESS_CODE = 200;
const BAD_REQUEST_CODE = 400;
const UNAUTHORIZED_CODE = 401;
const FORBIDDEN_CODE = 403;
const NOT_FOUND_CODE = 404;
const INTERNAL_ERROR_CODE = 500;
```

## 9. 开发命令速查

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

## 10. 调试技巧

### 10.1 使用 consola 日志

```typescript
import consola from "consola";
import { defineHandler } from "nitro/h3";

export default defineHandler(async (event) => {
	consola.info("收到请求");
	consola.debug("请求详情:", event);
	consola.warn("警告信息");
	consola.error("错误信息");

	return { success: true };
});
```

### 10.2 请求调试

```typescript
import { defineHandler, readBody, getQuery, getHeaders } from "nitro/h3";

export default defineHandler(async (event) => {
	const body = await readBody(event);
	const query = getQuery(event);
	const headers = getHeaders(event);

	console.log("Body:", body);
	console.log("Query:", query);
	console.log("Headers:", headers);

	return { body, query };
});
```
