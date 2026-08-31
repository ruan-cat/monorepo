# 2026-09-01 shadcn-docs-nuxt Vercel Function runtime closure

## 现象

- `eams-component-lib` 的 Nuxt 文档站在 Vercel 上显示 `READY`，但真实请求触发 `FUNCTION_INVOCATION_FAILED`，首错为 `Cannot find module 'entities/decode'`。
- Windows 本地 Nitro/NFT 构建曾出现长时间无完成行；Content cache/search、MDC 渲染、`.output` 启动和 Vercel Function 运行时必须分别验收。
- 用户原有 `docs/prompts/index.md` 修改属于任务外写集，不能被修复或发版覆盖。

## 根因

1. Nuxt 3 文档站的依赖范围允许跨世代漂移：`@ztl-uwu/nuxt-content` 的范围可能解析到 Nuxt 4 兼容线，`nuxt-og-image` 的较新版本可能带入 Nuxt 4 `@nuxt/kit`/H3 v2；Content 运行时又直接消费 H3，却没有完整表达直接依赖。
2. `@vue/compiler-core -> vue -> entities/decode` 首错发生在 Vercel Function runtime startup。根目录 trace 入口、文档包 manifest、Vite SSR transform、Nitro Rollup、NFT trace 和最终 Function artifact 没有形成可证明的闭包。
3. 历史宽 `vite.ssr.noExternal`、`nitro.externals.inline` 或 Windows `trace:false` 只能改变某一阶段，不能替代 manifest、trace 或部署包验证；本地 Windows/CLI artifact 也不能代表 Vercel Linux artifact。

## 关键误导点

- Vercel `READY` 只代表部署编排完成，不代表 Function runtime 或 Content API 可用。
- `nitro.externals.inline: ["entities"]` 没有被 Nitro Rollup 首错证据证明，不能作为常驻生产修复。
- `compatibilityDate` 改为平台对象是配置规范化；`2024-09-19` 本身没有修复 `entities/decode` 闭包。
- Windows 日志停住不等于进程死锁；`routes.clear()` 会破坏 document-driven Content 的结构化缓存。
- 让 `rolldown@nightly` 安装暂时成功不等于所有 workspace 的 rolldown API/peer 兼容；禁止 root 全局 override 掩盖范围问题。

## 有效修复

- 文档包与根构建 manifest 显式声明 `entities: ^7.0.1`，并锁定实际 `entities@7.0.1`。
- 根 `pnpm.overrides` 固定 `nuxt-og-image: 5.1.9`，将文档站锁在 Nuxt 3/H3 v1 保守世代。
- 仅对 `tsdown@0.3.1` 增加精确 `rolldown` override，处理公开 registry 无法解析 `rolldown@nightly` 的安装阻断；没有改成全局 rolldown override。
- 保留必要的窄 Vite SSR 兼容入口、Popper ESM alias 和 workspace `build:vercel` 的 `^build` 依赖边；生产模板不再配置 `nitro.externals`。
- `compatibilityDate` 与 `nitro-api-development` 统一为带官方链接的对象：Cloudflare/Vercel 均为 `2024-09-19`。
- Windows trace workaround 仅作为本地、可回滚的显式诊断开关；document-driven Content 默认保留 prerender。

## 验证

- 隔离 checkout 完成 fresh install、`pnpm why`、Nuxt prepare、Windows 构建 workaround、`.output` server 启动、Content/MDC 测试和真实 HTTP smoke。
- GitHub Actions main CI/Release 与三个版本 tag Release 均成功。
- 最新 Vercel production deployment `dpl_Fn96o6sFRQHRrXQEg89vDDuRVCUX` 对应提交 `306d316`，状态 `Ready/Promoted`，Node `24.x`。
- 首页、安装页、Table demo、guidelines、updates、Content cache/search 共 7 个真实 HTTP 请求均返回 `200`；Vercel logs 无 `entities/decode`、`MODULE_NOT_FOUND` 或 `FUNCTION_INVOCATION_FAILED`。
- 修复链路的生产首页与 Table demo 已通过可见 agent-browser，导航、SSR 内容、交互和代码面板正常，浏览器 errors 为空。

## 后续约束

- 先记录 `git status --short --untracked-files=all` 和目标 diff，保护用户写集；禁止为验证或发版无授权 `git add .`、覆盖、reset 或清理脏文件。
- 依赖故障必须按 `manifest -> Vite SSR -> Nitro Rollup -> NFT trace -> Function artifact -> runtime startup -> HTTP/browser` 定位首错；未有 exact 阶段证据时不要追加 inline/noExternal。
- `candidate`/`needs_check`/`verified` 状态必须与 deployment SHA、Function logs、HTTP 响应和浏览器证据绑定；READY、单次 `200`、本地 build 或 CI 不能互相替代。
- `compatibilityDate` 统一对象只表达 Nitro provider 基线；`nuxt-og-image@5.1.9` 是 Nuxt 3 世代门，`tsdown@0.3.1>rolldown` 是 registry 特定门，二者都不能被泛化成所有项目的全局 override。
- `init-shadcn-docs-nuxt` 已在 monorepo 分发源升级到 `1.2.0`，新增上述生产闭包、dirty-tree、provider/browser 和 override 范围门；技能 registry 必须与 `SKILL.md` 同步。
