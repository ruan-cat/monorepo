<!-- 已完成 -->

# 2026-04-21 VitePress 文档站 favicon 设计

## 目标

为仓库内已经发现的 7 个 VitePress 文档站补齐独立本地 `favicon.svg`，并在对应 VitePress 配置中显式添加 `head`。

覆盖范围：

- `packages/vitepress-preset-config/src/docs`
- `packages/utils/src`
- `packages/domains/docs`
- `packages/vercel-deploy-tool/src/docs`
- `packages/claude-notifier/src/docs`
- `tests/monorepo-1/src/configs/vip`
- `tests/monorepo-1/src/configs/vip-carbon`

## 用户偏好

- 统一 Lucide 风格。
- 每个站点使用不同图标，按项目语义区分。
- 图标整体尽量圆形。
- 最多 2 个颜色：一个圆形底色，一个白色线性图标。
- 避免复杂细节，保证浏览器标签页内仍然清晰。
- 优先从 Iconify 图标库中查找设计灵感，但最终落地为仓库内独立本地 SVG，不引入运行时依赖。

## 调研结论

### VitePress public 目录规则

之前候选方案中提到的 `.vitepress/public/favicon.svg` 不正确，不能作为最终方案。

依据：

- VitePress 官方 Asset Handling 文档说明，favicon、PWA icon 等静态文件应放在 source directory 下的 `public` 目录。例如项目根是 `docs` 且使用默认 source directory 时，目录是 `docs/public`。
- `public` 内资源会原样复制到构建输出根目录。
- `public/favicon.svg` 应在源码中用根绝对路径 `/favicon.svg` 引用。

官方参考：

- https://vitepress.dev/guide/asset-handling.html
- https://vitepress.dev/reference/site-config

### head 配置规则

VitePress 官方 `head` 示例推荐通过配置添加 favicon：

```ts
export default {
	head: [["link", { rel: "icon", href: "/favicon.ico" }]],
};
```

本仓库使用的 VitePress 版本是 `v1.6.4`。本地最小构建验证得到：

- `source/public/favicon.svg` 会被复制到输出目录根部。
- `.vitepress/public/favicon.svg` 不会被复制。
- 设置 `srcDir: "src"` 时，实际生效目录是 `src/public/favicon.svg`。
- `head` 中手写的 `/favicon.svg` 不会在构建产物里自动补 `base`。因此配置了 `base` 的测试站需要显式写 `/vip/favicon.svg` 和 `/vip-carbon/favicon.svg`。

### GitHub 参考项目

公开 VitePress 项目中也存在相同实践：

- `knex/knex`：`docs/.vitepress/config.mts` 中 `srcDir: "src"`，`head` 引用 `/favicon.svg`，实际资源位于 `docs/src/public/favicon.svg`。
- `alibaba/OpenSandbox`：`docs/.vitepress/config.mts` 中 `head` 引用 `/favicon.svg`，实际资源位于 `docs/public/favicon.svg`。
- `jdx/mise`：`docs/.vitepress/config.ts` 中 `head` 引用 `/favicon.svg`，实际资源位于 `docs/public/favicon.svg`。

## 站点文件位置设计

正式站点直接按 VitePress source directory 放置：

| 站点                    | favicon 文件                                                   | config 文件                                                       | head href      |
| ----------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- | -------------- |
| vitepress-preset-config | `packages/vitepress-preset-config/src/docs/public/favicon.svg` | `packages/vitepress-preset-config/src/docs/.vitepress/config.mts` | `/favicon.svg` |
| utils                   | `packages/utils/src/public/favicon.svg`                        | `packages/utils/src/.vitepress/config.mts`                        | `/favicon.svg` |
| domains                 | `packages/domains/docs/public/favicon.svg`                     | `packages/domains/docs/.vitepress/config.mts`                     | `/favicon.svg` |
| vercel-deploy-tool      | `packages/vercel-deploy-tool/src/docs/public/favicon.svg`      | `packages/vercel-deploy-tool/src/docs/.vitepress/config.mts`      | `/favicon.svg` |
| claude-notifier         | `packages/claude-notifier/src/docs/public/favicon.svg`         | `packages/claude-notifier/src/docs/.vitepress/config.mts`         | `/favicon.svg` |

测试站点较特殊：`vip` 与 `vip-carbon` 的 `srcDir` 指向 `tests/monorepo-1/.docs/*`，而 `.docs` 被 git 忽略且会被 `moveMdAsHomePage()` 删除后重建。因此不能把最终提交文件直接放入 `.docs/*/public`。

测试站点采用稳定源文件 + 构建前复制的方式：

| 站点       | 稳定源文件                                                   | 构建时目标 public                                      | config 文件                                                     | head href                 |
| ---------- | ------------------------------------------------------------ | ------------------------------------------------------ | --------------------------------------------------------------- | ------------------------- |
| vip        | `tests/monorepo-1/src/configs/vip/public/favicon.svg`        | `tests/monorepo-1/.docs/vip/public/favicon.svg`        | `tests/monorepo-1/src/configs/vip/.vitepress/config.mts`        | `/vip/favicon.svg`        |
| vip-carbon | `tests/monorepo-1/src/configs/vip-carbon/public/favicon.svg` | `tests/monorepo-1/.docs/vip-carbon/public/favicon.svg` | `tests/monorepo-1/src/configs/vip-carbon/.vitepress/config.mts` | `/vip-carbon/favicon.svg` |

实现时可以新增一个小工具函数复用复制逻辑，避免两个测试站重复写 `fs` 细节。

## 图标语义设计

所有图标都采用 `viewBox="0 0 32 32"`：

- 外层实心圆：`<circle cx="16" cy="16" r="16" fill="..."/>`
- 内层 Lucide 风格线性图标：白色描边、圆角端点、圆角连接。
- 不使用渐变，不使用阴影，不使用第三种颜色。
- 不直接依赖 Iconify 包，只借鉴 Iconify 中 Lucide 图标的语义与构图。

候选语义：

| 站点                    | Iconify/Lucide 灵感                 | 语义                      |
| ----------------------- | ----------------------------------- | ------------------------- |
| vitepress-preset-config | `lucide:settings`                   | 配置预设、主题配置        |
| utils                   | `lucide:wrench` 或 `lucide:package` | 工具函数集合              |
| domains                 | `lucide:globe`                      | 域名、项目集合            |
| vercel-deploy-tool      | `lucide:cloud-upload`               | 部署、上传                |
| claude-notifier         | `lucide:bell`                       | 通知提醒                  |
| vip                     | `lucide:flask-conical`              | VitePress 原生主题测试    |
| vip-carbon              | `lucide:atom`                       | Carbon 风格、结构化测试站 |

## 配置写法

默认站点：

```ts
head: [["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]],
```

带 `base` 的测试站：

```ts
head: [["link", { rel: "icon", type: "image/svg+xml", href: "/vip/favicon.svg" }]],
```

```ts
head: [["link", { rel: "icon", type: "image/svg+xml", href: "/vip-carbon/favicon.svg" }]],
```

若现有配置已经存在 `head`，应合并追加 favicon，不覆盖原有条目。

## 验证方案

实施后至少验证：

1. 构建正式文档站：
   - `pnpm -F @ruan-cat/vitepress-preset-config build:docs`
   - `pnpm -F @ruan-cat/utils build:docs-main`
   - `pnpm -F @ruan-cat/domains build:docs`
   - `pnpm -F @ruan-cat/vercel-deploy-tool build:docs`
   - `pnpm -F @ruan-cat/claude-notifier build:docs`
2. 构建测试站：
   - `pnpm -C tests/monorepo-1 vip:build`
   - `pnpm -C tests/monorepo-1 vip-carbon:build`
3. 检查构建产物：
   - 每个输出目录根部存在 `favicon.svg`。
   - 每个 `index.html` 中存在 `rel="icon"` 且 href 正确。
   - `vip` 和 `vip-carbon` 的 href 带对应 `base`。
4. 浏览器预览：
   - 使用 Chrome MCP 或本地浏览器打开站点，确认标签页图标可见且不是视觉糊成一团。

## 已完成的辅助处理

- `.gitignore` 已加入 `.superpowers/`，避免 brainstorming 与验证临时文件进入 git。
- 用于验证 VitePress public 规则的 `.superpowers/vitepress-public-check` 临时目录已删除。
- 本地构建产生的根目录 `.vitepress/cache` 临时目录已删除。
