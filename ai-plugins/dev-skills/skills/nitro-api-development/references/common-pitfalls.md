> **何时读**：排障或 review 时快速自检；本表为 SKILL.md 第 5/9/10 节规则的汇总复述，与正文冲突时以正文 CRITICAL 规则为准。

## 11. 常见陷阱 （Common Pitfalls）

- **错误的导入源**: 必须从 `nitro/h3` 导入，而非 `h3`。必须使用 `defineHandler` 而非 `defineEventHandler`。
- **缺失类型注解**: 仅导入类型不够，必须使用类型注解约束响应变量。
- **错误的响应字段**: 前端依赖 `{ success, code, message, data }` 结构。使用 `msg` 而非 `message` 会导致前端解析异常。
- **缺失 try-catch**: 所有 Handler **必须**使用 `try-catch` 包裹，catch 块返回标准化错误响应。
- **遗漏 Await**: 数据库操作是异步的，必须使用 `await`。
- **使用原始 SQL**: 除非万不得已，禁止使用 `sql` 模板字符串。请使用 Drizzle 的查询构建器。
- **重复定义格式化函数**: 必须使用共享的工具函数，禁止在 Handler 内重复定义 `formatDateTime`。
- **模块顶层创建数据库连接**: Cloudflare Worker 环境下会导致连接失败。必须在 handler 内创建。
- **错误的 Cloudflare 环境变量路径**: Nitro v3 使用 `event.req.runtime?.cloudflare?.env`，而非 `event.context.cloudflare?.env`。
- **`serverDir` 配置遗漏**: Nitro v3 默认扫描项目根目录的 `routes/`、`plugins/` 和 `middleware/`。若代码位于 `server/` 子目录，必须配置 `serverDir: "server"`，否则路由不会进入构建产物，所有端点返回 404。
- **将 `compatibilityDate` 写成单字符串**: 必须保留 Cloudflare、Vercel 两个平台键和对应官方链接注释的对象形式；单字符串丢失了部署适配信息。
- **纯 Nitro API 未暴露接口文档**: 判定为纯 API 项目后，必须启用 `experimental.openAPI`，提供 `/openapi.json`、`/scalar`，并从 `package.json` 读取 `openAPI.meta.version`。
- **纯 Nitro API 缺少 favicon fallback**: 只添加 `public/favicon.svg` 不足以覆盖浏览器默认的 `/favicon.ico` 请求，必须增加 `server/routes/favicon.ico.get.ts` 并测试重定向。
- **Nitro v3 使用已弃用的 `sendRedirect`**: 改为 `return redirect(location, status)`，并为 fallback 路由保留状态码和 `Location` 断言。

## 12. 常见错误对比

| 错误写法                                  | 正确写法                                        |
| :---------------------------------------- | :---------------------------------------------- |
| `import { defineEventHandler } from "h3"` | `import { defineHandler } from "nitro/h3"`      |
| `export default defineEventHandler(...)`  | `export default defineHandler(...)`             |
| 直接返回对象无类型注解                    | 使用 `const response: ApiResponse<T> = ...`     |
| `process.env.DATABASE_URL`（CF Worker）   | `event.req.runtime?.cloudflare?.env`            |
| 模块顶层 `const db = drizzle(...)`        | handler 内 `const db = useDb(event)`            |
| 单字符串形式的 `compatibilityDate`        | 带 Cloudflare、Vercel 键及官方链接注释的对象    |
| 纯 API 不配置接口文档                     | 启用 OpenAPI，暴露 `/openapi.json` 与 `/scalar` |
