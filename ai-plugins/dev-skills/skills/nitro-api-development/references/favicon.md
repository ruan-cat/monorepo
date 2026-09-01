# Nitro v3 接口项目显示 favicon

纯 Nitro API 没有页面 HTML `head`，不能依赖 `<link rel="icon">` 注入。浏览器通常会请求 `/favicon.ico`，因此同时提供 SVG 资源和 fallback 路由。

## 实现步骤

1. 在项目根目录创建 `public/favicon.svg`。Nitro 构建时会将它复制到 `.output/public`，Cloudflare Worker 的 Assets 配置会负责公开该文件。
2. 创建 `server/routes/favicon.ico.get.ts`，使用 Nitro v3 的 `redirect`：

   ```typescript
   import { defineHandler, redirect } from "nitro/h3";

   export default defineHandler(() => redirect("/favicon.svg", 302));
   ```

   不要使用已弃用的 `sendRedirect(event, location, code)`；Handler 必须返回 `redirect(location, status)`。

3. 在 `tests/favicon-route.test.ts` 使用 Vitest 固定重定向契约：

   ```typescript
   import { describe, expect, test } from "vitest";
   import faviconHandler from "../server/routes/favicon.ico.get.ts";

   describe("favicon fallback route", () => {
   	test("redirects /favicon.ico to the SVG asset", async () => {
   		const response = await faviconHandler.fetch(new Request("https://nitro.test/favicon.ico"));

   		expect(response.status).toBe(302);
   		expect(response.headers.get("location")).toBe("/favicon.svg");
   	});
   });
   ```

## 验收

构建后检查 `public/favicon.svg` 已进入 `.output/public`，并确认路由已进入 Worker 构建产物。部署后检查：

```bash
curl -I https://example.com/favicon.ico
curl -I https://example.com/favicon.svg
```

预期 `/favicon.ico` 返回 `302` 且 `Location: /favicon.svg`，`/favicon.svg` 返回 `200` 和 `Content-Type: image/svg+xml`。

## 常见错误

- 只添加 `public/favicon.svg`，没有 `/favicon.ico` fallback，浏览器仍显示默认图标。
- 把路由放在 `server/api/` 导致路径前缀不符合预期；浏览器 fallback 应放在 `server/routes/favicon.ico.get.ts`。
- 在 Nitro v3 中继续使用 `sendRedirect`，应改为返回 `redirect`。
