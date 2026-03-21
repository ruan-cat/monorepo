# 从 Mock 数据迁移到真实数据库

当需要将现有的 Mock 模式接口迁移到真实数据库（如 Neon PostgreSQL、PlanetScale MySQL 等）时，请遵循以下步骤。

## 迁移步骤

### Step 1: 准备数据库 Schema

1. 在你的项目中创建对应的 Drizzle Schema 定义文件（推荐放在 `server/db/schema/` 或 `shared/schema/` 目录下）。
2. 确保导出 Drizzle Table 对象：

   ```typescript
   // server/db/schema/users.ts
   import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

   export const users = pgTable("users", {
   	id: uuid("id").primaryKey().defaultRandom(),
   	name: varchar("name", { length: 100 }).notNull(),
   	email: varchar("email", { length: 255 }),
   	createTime: timestamp("create_time").defaultNow().notNull(),
   	updateTime: timestamp("update_time").defaultNow().notNull(),
   });
   ```

3. 运行数据库迁移命令（根据你使用的工具）：

   ```bash
   # Drizzle Kit
   pnpm drizzle-kit generate
   pnpm drizzle-kit push
   # 或
   pnpm drizzle-kit migrate
   ```

### Step 2: 替换接口实现

修改 API 处理器文件（例如 `list.post.ts`）：

1. **移除 Mock 依赖**：
   - 删除 `import { filterDataByQuery } ...`
   - 删除 `import { mockData } ...`
   - 删除本地定义的 `mock-data.ts` 文件引用。

2. **导入 DB 依赖**：

   ```typescript
   import { db } from "server/db"; // 根据你的项目结构调整
   import { yourTable } from "server/db/schema"; // 根据你的项目结构调整
   import { count, eq, like } from "drizzle-orm";
   ```

3. **重写查询逻辑**：
   - 将 `filterDataByQuery` 替换为 Drizzle 的 `where(...)` 条件构建。
   - 将数组的 `.slice()` 分页替换为数据库的 `.limit().offset()`。
   - **关键**：数据库操作是异步的，务必添加 `await` 关键字。

   **代码对比**：

   _Mock 模式 (旧)_:

   ```typescript
   const list = filterDataByQuery(mockData, { key: val });
   return { data: list.slice(0, 10) };
   ```

   _数据库模式 (新)_:

   ```typescript
   const list = await db.select().from(table).where(eq(table.key, val)).limit(10).offset(0);
   return { data: list };
   ```

### Step 3: 数据映射 (Data Mapping)

- **自动映射**：Drizzle 通常会自动将数据库的 `snake_case` 列名映射为 Schema 定义中的 `camelCase` 属性名（如果在定义时使用了 `.name("db_col_name")`）。
- **手动映射**：如果前端类型与 DB Schema 结构不完全一致（例如数据库存的是 JSON 字符串而前端需要对象），需要在查询后使用 `.map(...)` 进行手动转换。
- **时间字段**：数据库返回的 `Date` 类型需要格式化为 `string` 类型供前端展示。可参考 [templates/format-date.ts](../templates/format-date.ts) 中的工具函数。

### Step 4: 清理

- 删除同目录下的 `mock-data.ts` 文件。
- 验证接口返回格式是否保持不变（`ApiResponse<PageData<T>>`）。

## 常见数据库选择

| 数据库          | Drizzle 驱动                | 特点                                          |
| :-------------- | :-------------------------- | :-------------------------------------------- |
| Neon PostgreSQL | `drizzle-orm/neon-http`     | Serverless PostgreSQL，适合 Cloudflare/Vercel |
| Supabase        | `drizzle-orm/postgres-js`   | 开源 Firebase 替代，内置 PostgreSQL           |
| PlanetScale     | `drizzle-orm/planetscale`   | Serverless MySQL，分支和部署预览              |
| Turso           | `drizzle-orm/libsql`        | 基于 SQLite 的分布式数据库                    |
| 本地 PostgreSQL | `drizzle-orm/node-postgres` | 传统 PostgreSQL                               |
| 本地 MySQL      | `drizzle-orm/mysql2`        | 传统 MySQL                                    |
