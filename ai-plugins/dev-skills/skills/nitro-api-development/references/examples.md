# Nitro API 开发参考示例

本参考文档提供使用 Nitro v3 开发服务端 API 的代码示例和标准。

> **类型导入说明**：示例中使用的 `ApiResponse`、`PageData` 等类型定义可从 [templates/types.ts](../templates/types.ts) 复制到你的项目中。根据你的项目结构调整导入路径。

## 1. API 处理器结构 (标准模板)

每个 API 处理器文件 **必须** 遵循此结构。重点：**必须使用类型注解标注响应变量**。

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { db } from "server/db"; // 根据你的项目结构调整
import { users } from "./schema"; // 根据你的项目结构调整
import type { ApiResponse } from "./types"; // 参见 templates/types.ts
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
	try {
		/** 获取参数 (POST 请求读取 Body，建议断言为 any 以便后续清洗) */
		const body = (await readBody(event)) as any;

		/** 业务逻辑 (Database Query) */
		const [result] = await db.select().from(users).where(eq(users.id, body.id));

		if (!result) {
			/** 使用 ApiResponse<null> 类型注解约束 404 响应 */
			const notFoundResponse: ApiResponse<null> = {
				success: false,
				code: 404,
				message: "用户不存在",
				data: null,
			};
			return notFoundResponse;
		}

		/** 使用 ApiResponse<typeof result> 类型注解约束成功响应 */
		const response: ApiResponse<typeof result> = {
			success: true,
			code: 200,
			message: "查询成功",
			data: result,
		};
		return response;
	} catch (error: any) {
		console.error("[API Error]", error);

		/** 使用 ApiResponse<null> 类型注解约束错误响应 */
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

## 2. 响应格式规范

所有 API **必须** 返回标准化的 JSON 结构。类型定义请参见 [templates/types.ts](../templates/types.ts)。

### 2.1 分页列表返回示例

```json
{
	"success": true,
	"code": 200,
	"message": "查询成功",
	"data": {
		"list": [{ "id": "uuid-1", "name": "Admin" }],
		"total": 100,
		"pageIndex": 1,
		"pageSize": 10,
		"totalPages": 10
	}
}
```

### 2.2 单条数据返回示例

```json
{
	"success": true,
	"code": 200,
	"message": "查询成功",
	"data": { "id": "uuid-1", "name": "Admin", "createTime": "2025-01-01 00:00:00" }
}
```

### 2.3 错误返回示例

```json
{
	"success": false,
	"code": 500,
	"message": "操作失败",
	"data": null,
	"error": "Database connection timeout",
	"stack": "(仅开发环境返回) Error: Database connection timeout\n    at ..."
}
```

## 3. CRUD 标准模板

### 3.1 列表查询 (list.post.ts)

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { z } from "zod";
import { db } from "server/db"; // 根据你的项目结构调整
import { yourTable } from "./schema"; // 替换为你的表 Schema
import type { ApiResponse, PageData } from "./types";
import { and, desc, like, sql } from "drizzle-orm";

/** 查询参数验证 schema */
const querySchema = z.object({
	page: z.coerce.number().int().min(1).optional().default(1),
	pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
	name: z.string().optional(), // 替换为你的筛选字段
});

export default defineHandler(async (event) => {
	try {
		const body = (await readBody(event)) as any;

		/** 预处理参数：映射 pageIndex → page，空字符串清洗为 undefined */
		const rawQuery = {
			...body,
			page: body.page || body.pageIndex || 1,
			name: body.name === "" ? undefined : body.name,
		};

		const query = querySchema.parse(rawQuery);

		/** 构建查询条件 */
		const conditions = [];
		if (query.name) {
			conditions.push(like(yourTable.name, `%${query.name}%`));
		}

		const offset = (query.page - 1) * query.pageSize;

		/** 查询总数 */
		const [countResult] = await db
			.select({ total: sql<number>`count(*)` })
			.from(yourTable)
			.where(conditions.length > 0 ? and(...conditions) : undefined);

		const total = Number(countResult?.total || 0);

		/** 查询分页数据 */
		const data = await db
			.select()
			.from(yourTable)
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(yourTable.createTime))
			.limit(query.pageSize)
			.offset(offset);

		/** 计算总页数 */
		const totalPages = Math.ceil(total / query.pageSize);

		/**
		 * 使用 ApiResponse<PageData<...>> 类型注解约束成功响应
		 * (typeof data)[number] 自动推断 Drizzle 查询结果的行类型
		 */
		const response: ApiResponse<PageData<(typeof data)[number]>> = {
			success: true,
			code: 200,
			message: "查询成功",
			data: {
				list: data,
				total,
				pageSize: query.pageSize,
				pageIndex: query.page,
				totalPages,
			},
		};
		return response;
	} catch (error: any) {
		console.error("[List] Error:", error);

		/** 使用 ApiResponse<null> 类型注解约束错误响应 */
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

### 3.2 创建 (create.post.ts)

```typescript
import { defineHandler, readValidatedBody } from "nitro/h3";
import { db } from "server/db";
import { yourTable, insertYourEntitySchema } from "./schema";
import type { NewYourEntity } from "./schema"; // 你的 Insert 类型
import type { ApiResponse } from "./types";

export default defineHandler(async (event) => {
	try {
		const body = (await readValidatedBody(event, insertYourEntitySchema.parse)) as unknown as NewYourEntity;
		const [newRecord] = await db.insert(yourTable).values(body).returning();

		/** 使用 ApiResponse<typeof newRecord> 类型注解约束成功响应 */
		const response: ApiResponse<typeof newRecord> = {
			success: true,
			code: 200,
			message: "创建成功",
			data: newRecord,
		};
		return response;
	} catch (error: any) {
		console.error("[Create] Error:", error);

		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "创建失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.3 更新 (update.post.ts)

```typescript
import { defineHandler, readValidatedBody } from "nitro/h3";
import { db } from "server/db";
import { yourTable, updateYourEntitySchema } from "./schema";
import type { ApiResponse } from "./types";
import { eq } from "drizzle-orm";

export default defineHandler(async (event) => {
	try {
		const body = await readValidatedBody(event, updateYourEntitySchema.parse);
		const { id, ...updateData } = body;

		const [updatedRecord] = await db.update(yourTable).set(updateData).where(eq(yourTable.id, id)).returning();

		if (!updatedRecord) {
			const notFoundResponse: ApiResponse<null> = {
				success: false,
				code: 404,
				message: "记录不存在",
				data: null,
			};
			return notFoundResponse;
		}

		const response: ApiResponse<typeof updatedRecord> = {
			success: true,
			code: 200,
			message: "更新成功",
			data: updatedRecord,
		};
		return response;
	} catch (error: any) {
		console.error("[Update] Error:", error);

		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "更新失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.4 删除 (delete.post.ts)

```typescript
import { defineHandler, readBody } from "nitro/h3";
import { z } from "zod";
import { db } from "server/db";
import { yourTable } from "./schema";
import type { ApiResponse } from "./types";
import { eq } from "drizzle-orm";

/** 请求体验证 schema */
const bodySchema = z.object({
	id: z.string().uuid(),
});

export default defineHandler(async (event) => {
	try {
		const body = (await readBody(event)) as any;
		const { id } = bodySchema.parse(body);

		const [deletedRecord] = await db.delete(yourTable).where(eq(yourTable.id, id)).returning();

		if (!deletedRecord) {
			const notFoundResponse: ApiResponse<null> = {
				success: false,
				code: 404,
				message: "记录不存在",
				data: null,
			};
			return notFoundResponse;
		}

		/** 删除操作无返回数据 */
		const response: ApiResponse<null> = {
			success: true,
			code: 200,
			message: "删除成功",
			data: null,
		};
		return response;
	} catch (error: any) {
		console.error("[Delete] Error:", error);

		const errorResponse: ApiResponse<null> = {
			success: false,
			code: 500,
			message: "删除失败",
			data: null,
			error: error.message || String(error),
			stack: error.stack,
		};
		return errorResponse;
	}
});
```

### 3.5 详情 (detail.get.ts)

```typescript
import { defineHandler, getQuery } from "nitro/h3";
import { z } from "zod";
import { db } from "server/db";
import { yourTable } from "./schema";
import type { ApiResponse } from "./types";
import { eq } from "drizzle-orm";

/** 查询参数验证 schema */
const querySchema = z.object({
	id: z.string().uuid(),
});

export default defineHandler(async (event) => {
	try {
		const rawQuery = getQuery(event);
		const query = querySchema.parse(rawQuery);

		const [record] = await db.select().from(yourTable).where(eq(yourTable.id, query.id)).limit(1);

		if (!record) {
			const notFoundResponse: ApiResponse<null> = {
				success: false,
				code: 404,
				message: "记录不存在",
				data: null,
			};
			return notFoundResponse;
		}

		const response: ApiResponse<typeof record> = {
			success: true,
			code: 200,
			message: "查询成功",
			data: record,
		};
		return response;
	} catch (error: any) {
		console.error("[Detail] Error:", error);

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

## 4. Drizzle ORM 常用操作

- **查询 (Select)**: `await db.select().from(table).where(...)`
- **插入 (Insert)**: `await db.insert(table).values({...}).returning()`
- **更新 (Update)**: `await db.update(table).set({...}).where(...)`
- **删除 (Delete)**: `await db.delete(table).where(...)`

**注意**：除非绝对必要，**禁止**直接编写原始 SQL 语句。请始终使用查询构建器 (Query Builder)。

## 5. 错误处理 (Error Handling)

### 5.1 强制要求

所有 API Handler **必须**使用 `try-catch` 包裹全部业务逻辑。**禁止**依赖 Nitro 全局异常处理器作为唯一的错误捕获手段。

### 5.2 错误响应结构

catch 块 **必须** 返回符合 `ApiResponse<null>` **类型注解**的错误响应变量，包含 `error` 和 `stack` 字段：

```typescript
catch (error: any) {
	console.error("[模块名 操作名] Error:", error);

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
```

### 5.3 业务逻辑异常 (404 等)

对于可预见的业务错误（如 ID 不存在），使用 `ApiResponse<null>` 类型注解约束：

```typescript
if (!record) {
	const notFoundResponse: ApiResponse<null> = {
		success: false,
		code: 404,
		message: "记录不存在",
		data: null,
	};
	return notFoundResponse;
}
```
