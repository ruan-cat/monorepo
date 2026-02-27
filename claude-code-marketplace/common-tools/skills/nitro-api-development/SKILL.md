---
name: nitro-api-development
description: 使用 Nitro v3 框架和 H3 编写服务端 API 的技能。适用于初始化纯后端 Nitro 项目、为 Vite 项目赋予全栈能力、编写符合规范的 CRUD 接口、以及使用 Drizzle ORM 进行数据库交互。当需要开发新的 Nitro 接口、初始化 Nitro 配置、或咨询 Nitro 开发规范时使用此技能。
metadata:
  version: "0.13.4"
---

# Nitro v3 接口开发技能规范

本技能用于指导使用 Nitro v3 框架编写服务端接口，包括项目初始化、配置、接口编写规范、数据库交互和多平台部署等完整流程。

## 1. 适用场景

- **纯后端 Nitro 项目初始化**：对非 Vite 的 Node.js 项目，初始化 Nitro 示例代码和配置
- **Vite 项目全栈化**：对 Vite 项目，初始化 Nitro 接口和配置，赋予全栈能力
- **接口开发与维护**：按规范编写 Nitro v3 格式的接口代码
- **Mock 数据迁移到真实数据库**：将旧的 Mock 接口迁移到 Drizzle ORM + 真实数据库
- **多平台部署**：适配 Cloudflare Worker、Vercel 等平台的环境变量和数据库连接

## 2. 核心原则 [CRITICAL]

1. **框架 (Framework)**: 使用 **Nitro v3** 和 **H3** 事件处理器 (`defineHandler`)。
2. **数据库 (Database)**: 推荐使用 **Drizzle ORM** 进行所有数据库交互。新开发**不建议使用 Mock JSON 文件**。
3. **响应格式 (Response Format)**: 必须严格遵循 `ApiResponse` 和 `PageData` 结构返回 `{ success, code, message, data }`。类型定义参见 [templates/types.ts](templates/types.ts)。
4. **错误处理 (Error Handling)**: 所有 Handler **必须**使用 `try-catch` 包裹全部业务逻辑，catch 块返回标准化错误响应。
5. **无状态 (Stateless)**: 保持 API 处理器无状态，所有数据持久化必须通过数据库。

## 3. 核心依赖

```bash
# Nitro v3 核心包
pnpm add nitro

# 数据库相关（可选，推荐）
pnpm add drizzle-orm
pnpm add -D drizzle-kit

# 参数验证（可选，推荐）
pnpm add zod

# 日志工具（可选）
pnpm add consola
```

## 4. 目录结构规范

### 4.1 扁平结构（推荐用于小型项目）

```plain
project-root/
├── server/                          # Nitro 服务端目录
│   ├── routes/                      # API 路由目录
│   │   ├── users.get.ts             # GET /users
│   │   ├── users.post.ts            # POST /users
│   │   └── health.get.ts            # GET /health
│   ├── db/                          # 数据库相关（可选）
│   │   ├── index.ts                 # 数据库连接（useDb）
│   │   └── schema/                  # Drizzle Schema 定义
│   ├── utils/                       # 工具函数
│   │   └── format-date.ts           # 时间格式化（参见 templates/format-date.ts）
│   └── types/                       # 类型定义
│       └── index.ts                 # ApiResponse、PageData 等（参见 templates/types.ts）
├── nitro.config.ts                  # Nitro 配置文件
└── package.json
```

### 4.2 模块化结构（适用于大型项目）

```plain
project-root/
├── server/
│   ├── api/                         # API 接口目录
│   │   └── {module}/{feature}/
│   │       ├── list.post.ts         # 列表查询接口
│   │       ├── create.post.ts       # 创建接口
│   │       ├── update.post.ts       # 更新接口
│   │       ├── delete.post.ts       # 删除接口
│   │       └── [id].get.ts          # 详情接口
│   ├── db/                          # 数据库连接和 Schema
│   └── utils/                       # 工具函数
├── nitro.config.ts
└── package.json
```

**文件路径映射规则**：文件路径直接映射为 API 路径

```plain
文件: server/routes/users.get.ts     -> GET /users
文件: server/api/users/list.post.ts  -> POST /api/users/list
文件: server/api/users/[id].get.ts   -> GET /api/users/:id
```

## 5. 接口编写规范 [CRITICAL]

### 5.1 导入模块规范

```typescript
// ✅ 必须从 nitro/h3 导入，不是 h3
import { defineHandler, readBody } from "nitro/h3";

// ✅ 使用 defineHandler，不是 defineEventHandler
export default defineHandler(async (event) => {
	// ...
});
```

### 5.2 返回值类型约束

仅 `import type { ApiResponse }` 是**不够的**——这只是一个死导入，TypeScript **不会**检查返回值结构。

**必须**将 `ApiResponse` 用作响应变量的**类型注解 (type annotation)**：

```typescript
// ❌ 错误：仅导入类型，直接返回字面量 → TypeScript 不做任何检查
import type { ApiResponse } from "./types";
return { success: true, code: 200, msg: "ok", data: result }; // msg 拼错也不会报错

// ✅ 正确：用类型注解标注响应变量 → TypeScript 会严格检查每个字段
import type { ApiResponse } from "./types";
const response: ApiResponse<typeof result> = { success: true, code: 200, message: "ok", data: result };
return response; // 如果字段名/类型不符合 ApiResponse，编译期立即报错
```

### 5.3 按端点类型的类型注解规则

| 端点类型                         |                  类型注解写法                  |
| :------------------------------- | :--------------------------------------------: |
| 分页列表（list）                 | `ApiResponse<PageData<(typeof data)[number]>>` |
| 单条数据（detail/create/update） |          `ApiResponse<typeof result>`          |
| 无数据返回（delete）             |              `ApiResponse<null>`               |
| 错误响应（catch 块）             |              `ApiResponse<null>`               |

> `(typeof data)[number]` 自动从 Drizzle 查询结果数组推断行类型，无需额外导入实体类型。

## 6. 开发工作流

1. **定义路由 (Define Route)**: 在 `server/api/` 或 `server/routes/` 创建文件。文件路径即 API 路由。
2. **实现处理器 (Implement Handler)**: 使用 `defineHandler` 定义处理函数，**必须**使用 `try-catch` 包裹。
3. **导入类型约束 (Import Types)**: 从你的类型文件导入 `ApiResponse`（列表接口额外导入 `PageData`）。
4. **查询数据库 (Query Database)**: 导入 `db` 与 schema，使用 Drizzle 查询构建器。
5. **返回数据 (Return Data)**: 确保返回对象严格符合 `ApiResponse<T>` 结构。

## 7. 时间字段格式化

### 7.1 核心原则

数据库 Schema 中的时间字段使用 Drizzle `timestamp` 类型，TypeScript 推断为 `Date` 类型。前端展示需要 `string` 类型。**API Handler 负责时间字段的格式化转换**。

### 7.2 使用 formatDateTime 工具函数

**必须**使用共享的时间格式化工具函数（参见 [templates/format-date.ts](templates/format-date.ts)），**禁止**在 Handler 内重复定义格式化函数。

```typescript
import { formatDateTime } from "server/utils/format-date"; // 根据你的项目结构调整

const list = data.map((item) => ({
	id: item.id,
	name: item.name,
	createTime: formatDateTime(item.createTime),
	updateTime: formatDateTime(item.updateTime),
}));
```

## 8. 类型回填 (Type Recovery)

当 `readValidatedBody` 的类型推导不足以满足 Drizzle `values()` 的严格类型要求时，必须显式回填 Insert 类型。

```typescript
// 从你的 Schema 文件导入 Insert 类型
import type { NewYourEntity } from "./schema";

const body = (await readValidatedBody(event, insertSchema.parse)) as unknown as NewYourEntity;
const result = await db.insert(table).values(body).returning();
```

## 9. 多平台数据库连接

> **本节基于 Cloudflare Worker 环境下排查真实严重 Bug 后沉淀的核心经验。**

### 9.1 核心原则：永远通过 `useDb(event)` 获取数据库实例

**严禁**在模块顶层或全局作用域直接创建 Drizzle 数据库连接实例：

```typescript
// ❌ 错误：模块顶层创建，Cloudflare Worker 环境下 process.env 为空
const db = drizzle(neon(process.env.DATABASE_URL!));

// ✅ 正确：在每个 handler 内通过 event 动态获取
export default defineHandler(async (event) => {
	const db = useDb(event); // 内部自动处理多平台环境变量
	return await db.select().from(table);
});
```

### 9.2 Cloudflare Worker 的核心陷阱

在 Nitro v3 + Cloudflare Worker 环境中，**`event.context.cloudflare.env` 不存在**。
正确路径必须是 **`event.req.runtime?.cloudflare?.env`**（Nitro v3 官方确认路径）。

**详细内容请参考**：[references/cloudflare-env-database.md](references/cloudflare-env-database.md)

## 10. Nitro 配置

### 10.1 基础配置

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",
	devServer: {
		port: 3000,
	},
});
```

### 10.2 Vite 集成

```typescript
// vite.config.ts
import { nitro } from "nitro/vite";

export default defineConfig({
	plugins: [
		// 其他插件...
		nitro(),
	],
});
```

### 10.3 Cloudflare 部署配置

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",
	cloudflare: {
		deployConfig: true,
		nodeCompat: true,
		wrangler: {
			name: "your-project-name",
		},
	},
	// 如果使用 cloudflare:workers 动态导入
	rollupConfig: {
		external: ["cloudflare:workers"],
	},
});
```

## 11. 常见陷阱 (Common Pitfalls)

- **错误的导入源**: 必须从 `nitro/h3` 导入，而非 `h3`。必须使用 `defineHandler` 而非 `defineEventHandler`。
- **缺失类型注解**: 仅导入类型不够，必须使用类型注解约束响应变量。
- **错误的响应字段**: 前端依赖 `{ success, code, message, data }` 结构。使用 `msg` 而非 `message` 会导致前端解析异常。
- **缺失 try-catch**: 所有 Handler **必须**使用 `try-catch` 包裹，catch 块返回标准化错误响应。
- **遗漏 Await**: 数据库操作是异步的，必须使用 `await`。
- **使用原始 SQL**: 除非万不得已，禁止使用 `sql` 模板字符串。请使用 Drizzle 的查询构建器。
- **重复定义格式化函数**: 必须使用共享的工具函数，禁止在 Handler 内重复定义 `formatDateTime`。
- **模块顶层创建数据库连接**: Cloudflare Worker 环境下会导致连接失败。必须在 handler 内创建。
- **错误的 Cloudflare 环境变量路径**: Nitro v3 使用 `event.req.runtime?.cloudflare?.env`，而非 `event.context.cloudflare?.env`。

## 12. 常见错误对比

| 错误写法                                  | 正确写法                                    |
| :---------------------------------------- | :------------------------------------------ |
| `import { defineEventHandler } from "h3"` | `import { defineHandler } from "nitro/h3"`  |
| `export default defineEventHandler(...)`  | `export default defineHandler(...)`         |
| 直接返回对象无类型注解                    | 使用 `const response: ApiResponse<T> = ...` |
| `process.env.DATABASE_URL`（CF Worker）   | `event.req.runtime?.cloudflare?.env`        |
| 模块顶层 `const db = drizzle(...)`        | handler 内 `const db = useDb(event)`        |

## 13. 项目初始化检查清单

### 13.1 纯后端项目

- [ ] 安装 `nitro` 依赖包
- [ ] 创建 `server/routes/` 目录结构
- [ ] 创建 `nitro.config.ts` 配置文件
- [ ] 添加开发和构建脚本到 `package.json`
- [ ] 创建 `server/types/` 并复制 [templates/types.ts](templates/types.ts) 中的类型定义

### 13.2 Vite 项目全栈化

- [ ] 安装 `nitro` 依赖包
- [ ] 在 Vite 插件配置中添加 `nitro()` 插件
- [ ] 创建 `server/` 目录结构
- [ ] 创建 `nitro.config.ts` 配置文件
- [ ] 创建 `server/types/` 并复制 [templates/types.ts](templates/types.ts) 中的类型定义

### 13.3 数据库集成

- [ ] 安装 `drizzle-orm` 和对应的数据库驱动
- [ ] 安装 `drizzle-kit`（开发依赖）
- [ ] 创建 `server/db/index.ts`（参考 [references/cloudflare-env-database.md](references/cloudflare-env-database.md) 中的 `useDb` 实现）
- [ ] 创建 `server/db/schema/` 目录并定义数据表
- [ ] 复制 [templates/format-date.ts](templates/format-date.ts) 到 `server/utils/`

## 14. 参考文档

详细的代码模板和参考文档请查阅：

- **可复用类型定义**: [templates/types.ts](templates/types.ts) - `ApiResponse<T>`、`PageData<T>` 等通用类型定义，可直接复制使用
- **时间格式化工具**: [templates/format-date.ts](templates/format-date.ts) - `formatDateTime`、`formatDate` 工具函数
- **API 语法速查**: [references/api-reference.md](references/api-reference.md) - H3 常用函数及模式速查
- **代码示例**: [references/examples.md](references/examples.md) - 标准的 CRUD 处理器示例和响应结构
- **参数处理**: [references/request-params-handling.md](references/request-params-handling.md) - `readBody` 使用、参数清洗和 Zod 校验
- **多平台数据库连接**: [references/cloudflare-env-database.md](references/cloudflare-env-database.md) - Cloudflare Worker 与 Vercel 环境变量获取和数据库连接模式
- **迁移指南**: [references/mock-to-database-migration.md](references/mock-to-database-migration.md) - 从 Mock 数据迁移到真实数据库
- **Mock 模式参考** (Legacy): [references/mock-mode.md](references/mock-mode.md) - Legacy Mock 模式的开发规范（仅用于维护现有接口）
- **接口测试**: [references/vitest-testing.md](references/vitest-testing.md) - Vitest + Nitro 接口测试配置和模板
- **官方文档**: https://v3.nitro.build/
