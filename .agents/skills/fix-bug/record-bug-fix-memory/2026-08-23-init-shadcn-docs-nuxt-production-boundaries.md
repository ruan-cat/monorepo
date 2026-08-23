# 2026-08-23 `init-shadcn-docs-nuxt` 生产边界加固

## 现象

对外文档站技能把 workspace 源码 alias、生成的 `.nuxt` 文件和项目特例混入默认模板；build 绿灯又容易掩盖 Nitro standalone 的真实缺包。

## 根因

把开发期源码便利、Vite SSR transform、Nitro tracing、pnpm npm alias 和 artifact runtime 当成同一层问题，导致宽 `noExternal`/`inline`、缓存命中或临时 memory wrapper 被误当作长期修复。

## 关键误导点

`nuxt build`、Turbo cache hit 或首页 200 都不能证明 `.output` 的依赖闭包。Element Plus 的 Popper 问题只有在已启动 `.output` 的 HTTP 请求显示 `element-plus` 导入 `@popperjs/core` 且报 `ERR_MODULE_NOT_FOUND` 时，才是 logical npm alias 的精确案例。

## 有效修复

默认 production 不再使用 workspace source alias；生成 `.nuxt` 不再分发；规则按 first failing gate 路由。符合上述精确错误时，在实际部署文档包 `dependencies` 声明 `"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"`，而不 inline 整个 Element Plus 或修改全局 hoist/linker。

## 验证

- Vitest 静态契约 6/6 通过，覆盖分发边界、production alias、Element Plus 条件、Turbo 缓存门和 Windows/MDC 安全规则。
- `release-ai-plugins` DryRun 与 Apply 将 `dev-skills` 发布为 `10.6.0`、目标 skill 升至 `1.1.0`，registry Check 通过。
- Codex marketplace 本地 add/list/install/remove smoke 通过，临时 marketplace 已移除。

## 后续约束

1. 外发 skill 不分发 `.nuxt`、本机路径、内部报告或项目特例。
2. `noExternal`、`inline`、heap、Turbo `--force` 和 trace workaround 都必须绑定错误阶段、最小变量和撤除条件。
3. 每次生产变更都要在 fresh artifact 上执行 `.output` startup 与 HTTP smoke；cache hit 不是验收。
