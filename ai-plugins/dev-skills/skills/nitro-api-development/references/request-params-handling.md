# 请求参数处理最佳实践

本文档详细说明在 Nitro v3/H3 接口开发中，如何正确、健壮地处理请求参数，特别是在与前端组件对接时的常见场景。

> **类型导入说明**：示例中使用的 `ApiResponse` 类型定义可从 [templates/types.ts](../templates/types.ts) 复制到你的项目中。

## 1. POST 请求体 (Request Body) 处理

前端通常使用 POST 请求发送 JSON 数据，包括查询条件、表单数据和分页参数。

### 1.1 基本读取

使用 `readBody` 读取请求体。注意 `readBody` 是异步的，**必须使用 `await`**。

```typescript
import { defineHandler, readBody } from "nitro/h3";

export default defineHandler(async (event) => {
	// 强制类型断言为 any 或具体接口，避免 'unknown' 类型错误
	const body = (await readBody(event)) as any;

	// ...
});
```

### 1.2 参数清洗与预处理 (Critical)

前端传递的参数往往不完美，常见问题包括：

- **空字符串**: 前端表单清空时常发送 `""`，这会导致数据库查询错误（如 `status=""` 匹配失败）。
- **参数名不一致**: 前端通用组件可能使用 `pageIndex`，而后端分页可能习惯用 `page`。
- **类型不匹配**: 数字可能被传为字符串。

**推荐的处理模式：**

在 Zod 校验之前，先进行参数清洗。

```typescript
// 1. 读取原始 Body
const body = (await readBody(event)) as any;

// 2. 清洗与规范化参数
const rawQuery = {
	...body,
	// 【分页映射】兼容前端 pageIndex 到后端 page
	page: body.page || body.pageIndex || 1,
	pageSize: body.pageSize || 20,

	// 【空值清洗】将空字符串转换为 undefined，避免 Zod 枚举校验失败或生成错误的 SQL 查询
	status: body.status === "" ? undefined : body.status,
	keyword: body.keyword === "" ? undefined : body.keyword,
};

// 3. 使用 Zod 验证清洗后的参数
const query = querySchema.parse(rawQuery);
```

### 1.3 Zod Schema 定义建议

配合清洗逻辑，Zod Schema 应该充分利用 `coerce` 和 `optional`。

```typescript
const querySchema = z.object({
	// 使用 coerce 自动转换字符串数字
	page: z.coerce.number().int().min(1).optional().default(1),
	pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),

	// 都是 optional，因为空字符串已被清洗为 undefined
	keyword: z.string().optional(),
	status: z.enum(["enabled", "disabled"]).optional(),
});
```

## 2. GET 请求 (Query Params) 处理

对于简单的获取操作，参数通过 URL 传递。

### 2.1 基本读取

使用 `getQuery`。注意 `getQuery` 是**同步**的。

```typescript
import { defineHandler, getQuery } from "nitro/h3";

export default defineHandler(async (event) => {
	const query = getQuery(event);
	const id = query.id;
	// ...
});
```

---

## 3. 错误处理与响应 (Error Handling)

为了方便前端调试和生产环境监控，接口**必须**具备鲁棒的错误捕获机制。所有响应**必须**符合 `ApiResponse` 类型结构。

### 3.1 强制 try-catch 异常捕获模式

**所有** Handler **必须**在顶层包裹 `try-catch`。成功和失败响应均**必须**使用 `ApiResponse` 类型注解标注响应变量（不是仅导入不使用）。

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { db } from "server/db"; // 根据你的项目结构调整
import { users } from "./schema"; // 根据你的项目结构调整
import type { ApiResponse } from "./types";
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
	try {
		const body = (await readBody(event)) as any;
		const [result] = await db.select().from(users).where(eq(users.id, body.id));

		/** 使用 ApiResponse<typeof result> 类型注解约束成功响应 */
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

### 3.2 业务逻辑异常 (404 等)

对于可预见的业务错误（如 ID 不存在），使用 `ApiResponse<null>` 类型注解约束：

```typescript
if (!record) {
	/** 使用 ApiResponse<null> 类型注解约束 404 响应 */
	const notFoundResponse: ApiResponse<null> = {
		success: false,
		code: 404,
		message: "记录不存在",
		data: null,
	};
	return notFoundResponse;
}
```
