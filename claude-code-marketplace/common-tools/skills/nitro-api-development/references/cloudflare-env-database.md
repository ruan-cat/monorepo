# Cloudflare Worker 与 Vercel 多平台数据库连接指南

|     项目     |                                     详情                                     |
| :----------: | :--------------------------------------------------------------------------: |
| **适用版本** |       Nitro v3（`nitro@3.x`）+ Drizzle ORM + Neon Serverless / 其他 DB       |
| **核心结论** | Cloudflare Worker 环境变量必须通过 `event.req.runtime?.cloudflare?.env` 获取 |
| **文档来源** |                            源自真实 Bug 排查经验                             |

---

## 1. 背景：为什么需要本文档

在 Nitro v3 + Cloudflare Worker 环境中，常规获取环境变量的方式（`process.env`、`useRuntimeConfig()`）都可能失效，导致数据库连接崩溃。

这是因为 Cloudflare Worker 使用 V8 Isolate 而非 Node.js 进程，环境变量的注入机制完全不同。

---

## 2. 根本原因分析

### 2.1. 错误认知与失败路径

社区中普遍流传的 Cloudflare 环境变量访问路径 **在 Nitro v3 中不存在**：

```typescript
// ❌ 错误：event.context.cloudflare 在 Nitro v3 部署环境中根本不存在
const cfEnv = (event.context as any).cloudflare?.env;
```

通过调试端点的生产日志，确认 `event.context` 的实际内容为：

```log
"context keys": ["nitro", "params", "matchedRoute"]
```

`cloudflare` 属性完全缺失。

### 2.2. 正确路径的发现

查阅 Nitro v3 官方仓库 `src/presets/cloudflare/runtime/_module-handler.ts` 源码：

```typescript
// Nitro v3 源码——augmentReq 函数将 env 挂载到 req.runtime.cloudflare
export function augmentReq(cfReq: Request | CF.Request, ctx: NonNullable<ServerRuntimeContext["cloudflare"]>) {
	const req = cfReq as ServerRequest;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = { ...req.runtime.cloudflare, ...ctx };
	// ctx 包含 { env, context }
}
```

正确访问路径为：**`event.req.runtime?.cloudflare?.env?.MY_VAR`**

### 2.3. 生产环境验证日志

```log
"req.runtime exists": true,
"req.runtime keys": ["name", "cloudflare"],
"req.runtime.cloudflare exists": true,
"req.runtime.cloudflare keys": ["env", "context"],
"req.runtime.cloudflare.env keys": ["NITRO_DATABASE_URL", "DATABASE_URL", "ASSETS"]
```

---

## 3. 两大平台的环境变量机制对比

|             对比项              |              Cloudflare Worker               | Vercel / Node.js |
| :-----------------------------: | :------------------------------------------: | :--------------: |
|         **运行时环境**          |        V8 Isolate（无 Node.js 进程）         |   Node.js 进程   |
|    **`process.env` 可用性**     |         ❌ 空对象（`total keys: 0`）         |   ✅ 完整可用    |
|      **环境变量注入方式**       |    `fetch(request, env, ctx)` 的第二参数     |  进程启动时注入  |
|    **Nitro v3 正确访问路径**    |     `event.req.runtime?.cloudflare?.env`     |  `process.env`   |
|        **旧版错误路径**         | `event.context.cloudflare?.env`（❌ 不存在） |        —         |
| **`useRuntimeConfig()` 可靠性** |         ⚠️ 有全局缓存陷阱（见下文）          |     ✅ 可靠      |

---

## 4. 环境变量获取优先级链

下面是经过生产验证的 `resolveDatabaseUrl(event)` 优先级设计：

```typescript
function resolveDatabaseUrl(event: H3Event): string | undefined {
	/** 第 1 优先级：Nitro v3 官方 Cloudflare 路径（生产验证有效） */
	try {
		// @ts-ignore — TypeScript 无此路径的类型定义，是 Nitro 运行时注入的
		const cfRuntimeEnv = (event.req as any)?.runtime?.cloudflare?.env;
		if (cfRuntimeEnv) {
			return cfRuntimeEnv.NITRO_DATABASE_URL || cfRuntimeEnv.DATABASE_URL;
		}
	} catch {
		/** 非 Cloudflare 环境，静默忽略 */
	}

	/** 第 2 优先级：旧版 Cloudflare 兼容路径（降级保底） */
	try {
		const cfCtxEnv = (event.context as any).cloudflare?.env;
		if (cfCtxEnv) {
			return cfCtxEnv.NITRO_DATABASE_URL || cfCtxEnv.DATABASE_URL;
		}
	} catch {
		/** 静默忽略 */
	}

	/** 第 3 优先级：process.env（本地 Node.js + Vercel） */
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	/** 第 4 优先级：Nitro runtimeConfig（最低，有全局缓存风险） */
	try {
		const config = useRuntimeConfig();
		if (config?.databaseUrl) return config.databaseUrl as string;
	} catch {
		/** 静默忽略 */
	}

	return undefined;
}
```

---

## 5. 完整的 useDb(event) 实现模式

这是适配 Cloudflare Worker + Vercel 双平台的 Drizzle + Neon 标准数据库连接模式：

> **适配其他数据库**：此模式同样适用于其他 Drizzle 支持的数据库驱动（如 `drizzle-orm/postgres-js`、`drizzle-orm/mysql2` 等），只需替换驱动相关的 import 和连接创建逻辑。

````typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { H3Event } from "nitro/h3";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { useRuntimeConfig } from "nitro/runtime-config";
import consola from "consola";
import * as schema from "./schema";

/** Drizzle 数据库连接类型（根据你使用的驱动替换） */
export type DbType = NeonHttpDatabase<typeof schema>;

/**
 * 获取数据库实例（多平台兼容版本）
 *
 * @description
 * 在同一请求内实现单例模式（缓存到 event.context.db），
 * 适配 Cloudflare Worker 和 Vercel 两个部署环境。
 *
 * @param event - H3 事件对象，用于访问平台 Bindings
 * @returns Drizzle 数据库实例
 *
 * @example
 * ```typescript
 * export default defineHandler(async (event) => {
 *   const db = useDb(event);
 *   return await db.select().from(users);
 * });
 * ```
 */
export function useDb(event: H3Event): DbType {
	/** 单请求内单例模式——避免重复创建连接 */
	if (event.context.db) {
		return event.context.db as DbType;
	}

	const url = resolveDatabaseUrl(event);

	if (!url) {
		consola.error("未能获取数据库连接 URL，已检查所有来源：");
		consola.error("  1. event.req.runtime.cloudflare.env（Nitro v3 Cloudflare 路径）");
		consola.error("  2. event.context.cloudflare.env（旧版兼容路径）");
		consola.error("  3. process.env.DATABASE_URL");
		consola.error("  4. Nitro runtimeConfig.databaseUrl");
		throw new Error("未设置数据库连接地址 URL。请确保环境变量已正确配置。");
	}

	/** 创建 Neon + Drizzle 连接并缓存到请求上下文 */
	const envDbInstance = drizzle(neon(url), { schema }) as DbType;
	event.context.db = envDbInstance;

	return envDbInstance;
}
````

---

## 6. 关键陷阱与注意事项

### 6.1. ❌ 陷阱一：模块顶层创建数据库连接

```typescript
// ❌ 错误：Cloudflare Worker 模块加载时 env 未注入，DATABASE_URL 为 undefined
const db = drizzle(neon(process.env.DATABASE_URL!));

export default defineHandler(async (event) => {
	// db 实例使用的是 undefined 创建的，所有查询都会失败
	return await db.select().from(users);
});
```

**正确做法**：始终在 handler 内通过 `useDb(event)` 动态获取。

### 6.2. ❌ 陷阱二：错误的 Cloudflare 环境变量访问路径

```typescript
// ❌ 错误：Nitro v3 中 event.context.cloudflare 不存在
const cfEnv = (event.context as any).cloudflare?.env;

// ✅ 正确：使用 event.req.runtime（Nitro v3 官方路径）
// @ts-ignore
const cfEnv = (event.req as any)?.runtime?.cloudflare?.env;
```

### 6.3. ❌ 陷阱三：`useRuntimeConfig()` 的全局缓存问题

`useRuntimeConfig()` 内部使用 `||=` 运算符，**第一次调用的结果被永久缓存**：

```typescript
// Nitro 源码（简化）
export function useRuntimeConfig() {
	return ((useRuntimeConfig as any)._cached ||= getRuntimeConfig());
	//                                     ^^^^ 第一次调用后永久缓存
}
```

如果在**模块顶层**（Cloudflare env 注入前）触发了 `useRuntimeConfig()`，
则会被缓存为全默认值（空字符串），后续所有请求均无法获得真实配置。

**规则**：`useRuntimeConfig()` 最多作为最低优先级兜底，且只在 handler 内调用。

### 6.4. ❌ 陷阱四：`cloudflare:workers` 导致的构建失败

在 handler 中使用 `await import("cloudflare:workers")` 可以正确读取 Cloudflare 运行时环境变量，
但该模块仅存在于 CF 运行时，Vite 在构建阶段会报错：

```log
Rollup failed to resolve import "cloudflare:workers" from "...debug-env.get.ts"
```

**必须**在 `nitro.config.ts` 中声明：

```typescript
export default defineConfig({
	rollupConfig: {
		external: ["cloudflare:workers"],
	},
});
```

---

## 7. Nitro v3 内部机制速查

|             机制              |               源码位置               |                           说明                            |
| :---------------------------: | :----------------------------------: | :-------------------------------------------------------: | --- | ----------------------- |
| `req.runtime.cloudflare` 挂载 |  `_module-handler.ts: augmentReq()`  | 每次 fetch 请求时将 `env` 绑定到 `req.runtime.cloudflare` |
|   `globalThis.__env__` 注入   |     `_module-handler.ts` L22-38      |    同时写入 `globalThis.__env__`，供 unenv Proxy 使用     |
|      `process.env` Proxy      | `unenv/runtime/node/process/env.mjs` | 拦截 `process.env.X` 读取，实时查找 `globalThis.__env__`  |
|   `useRuntimeConfig()` 缓存   | `runtime/internal/runtime-config.ts` |                             `                             |     | =` 永久缓存首次计算结果 |

---

## 8. 快速诊断清单

当 Cloudflare Worker 出现数据库连接失败时，按此顺序排查：

- [ ] **环境变量路径**：`resolveDatabaseUrl` 是否优先读取 `event.req.runtime?.cloudflare?.env`？
- [ ] **作用域检查**：数据库连接是否在 handler 内（而非模块顶层）创建？
- [ ] **构建配置**：`nitro.config.ts` 中是否有 `rollupConfig.external: ["cloudflare:workers"]`？
- [ ] **Dashboard 配置**：Cloudflare Worker → Settings → Variables 中是否已设置正确的变量名？
- [ ] **缓存问题**：是否存在模块顶层调用 `useRuntimeConfig()` 的代码？
- [ ] **调试验证**：部署调试端点，查看 `req.runtime.cloudflare.env keys` 是否包含目标变量。
