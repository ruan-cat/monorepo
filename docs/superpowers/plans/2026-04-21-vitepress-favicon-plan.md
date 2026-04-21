<!-- 已完成 -->

# 2026-04-21 VitePress 文档站 favicon 实施计划

## 目标

根据 `docs/superpowers/specs/2026-04-21-vitepress-favicon-design.md`，为 7 个 VitePress 文档站增加独立本地 `favicon.svg`，并在对应配置中显式添加 `head`。

## 实施步骤

1. 创建 favicon SVG
   - 在 5 个正式站点的 VitePress source directory 下创建 `public/favicon.svg`。
   - 在 `tests/monorepo-1` 的两个测试站配置目录下创建稳定源文件 `public/favicon.svg`。
   - 每个 SVG 使用统一的圆形底色 + 白色 Lucide 风格线性图标。

2. 更新正式站点配置
   - 在 5 个正式站点的 `.vitepress/config.mts` 中追加：

     ```ts
     head: [["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]],
     ```

   - 如果配置由 `setUserConfig()` 包装，直接放入传入的用户配置对象。

3. 更新测试站复制逻辑
   - 扩展 `tests/monorepo-1/src/tools/move-md-as-home-page.ts`，支持在重建 `.docs/*` 后复制额外 public 资源。
   - `vip` 与 `vip-carbon` 分别从稳定源目录复制 favicon 到实际 `srcDir` 的 `public/favicon.svg`。

4. 更新测试站配置
   - `vip` 的 `head` 使用 `/vip/favicon.svg`。
   - `vip-carbon` 的 `head` 使用 `/vip-carbon/favicon.svg`。

5. 验证
   - 分别构建 5 个正式站点和 2 个测试站。
   - 检查每个输出目录根部存在 `favicon.svg`。
   - 检查每个 `index.html` 中存在正确的 `rel="icon"` 链接。
   - 对带 `base` 的测试站确认 href 包含 `/vip/` 或 `/vip-carbon/`。

## 风险控制

- 不修改用户已有的 `docs/prompts/index.md` 改动。
- 不把临时验证目录提交到 git。
- 不引入 Iconify 或 Lucide 运行时依赖。
- 不把 favicon 放入 `.vitepress/public`。
