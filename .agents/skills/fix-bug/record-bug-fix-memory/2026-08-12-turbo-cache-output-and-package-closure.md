# 2026-08-12 Turbo 缓存输出与发布包依赖闭包故障

## 问题现象

本次 CI 不是单一错误：VitePress 物理入口找不到、Vercel 工具找不到 `tsup`、utils 发布入口找不到 `yaml` 依次出现。前一个失败会阻断后一个，因此表面上像 pnpm 链接或 Node.js 24 环境持续不稳定。

## 根因

1. 曾经的 VitePress `build:docs` 直接执行 `node node_modules/vitepress/bin/vitepress.js`，错误地把包内物理链接布局当作稳定 API。
2. `Turbo build.outputs` 使用 `**/dist/**` / `**/.output/**`，缓存范围宽于任务自身输出，破坏产物所有权边界。
3. `@ruan-cat/vercel-deploy-tool` 未声明自己 `build: tsup` 所需的 `tsup` 与 `typescript`。
4. `@ruan-cat/utils` 的 ESM 产物保留 `yaml` 外部 import，却没有将其声明为直接运行时依赖。

## 关键误导点

- VitePress 脚本失败后的 `exit 139` 是后续现象；第一条模块解析错误才是可信排障入口。
- `node-linker=hoisted`、全量 hoist、强制重装与重建链接都改变全局环境，却没有证据说明能补上包清单缺口；`ecb79404` 的 hoisted 试验已在 `40821036` 回退。
- 历史绿灯、不同 SHA 或远程缓存命中不能替代最新代码 SHA 的完整构建后入口测试。
- 删除 `consola` shim 不会破坏 utils：最新入口测试显式禁止解析 `consola`，仍通过默认 ESM、`node-esm`、`node-cjs`。

## 有效修复

1. `f509a791` 恢复标准 `vitepress build src/docs`，不再依赖 package-local `node_modules` 物理路径。
2. `40821036` 把 `build.outputs` 收紧为 `dist/**` / `.output/**`，并恢复正常 `pnpm i` 安装方式。
3. `790ff779` 为 Vercel 工具补充本地 `tsup`、`typescript` 开发依赖。
4. `010845a7` 为 utils 补充 `yaml` 直接运行时依赖。

## 验证方式

- [31511256427](https://github.com/ruan-cat/monorepo/actions/runs/31511256427) 在缓存修复后稳定暴露 `vercel-deploy-tool#build`，说明前层阻断已解除。
- [31511684710](https://github.com/ruan-cat/monorepo/actions/runs/31511684710) 完成 15/15 Turbo 构建，随后仅 `utils` 入口因 `yaml` 失败，精确定位最后缺口。
- [31512258550](https://github.com/ruan-cat/monorepo/actions/runs/31512258550) 在 `010845a7` 上完成构建和 `utils` 入口 4/4 测试；[31512798884](https://github.com/ruan-cat/monorepo/actions/runs/31512798884) 对最新 `dev` 再次通过。
- OpenCode Luna（`opencode-go/gpt-5.6-luna`，`max`）独立复核两个 run 与 `dev...origin/dev`，结论一致。

## 后续约束

1. Turbo 输出只能写任务直接拥有的相对产物；没有实际目录归属证据，不改宽 glob。
2. 发布包必须声明构建二进制和发布产物保留的每个外部 runtime import；本地 hoist 不是依赖合同。
3. CI 模块找不到时，先记录第一个失败、SHA、任务命令和文件存在性，再决定是否需要动 pnpm、Node 或 shim；禁止反向追逐 `139` 等伴随噪音。
4. 每次修改 exports、bundler external/noExternal、包清单或缓存声明，都要在最新代码 SHA 的完整构建后运行发布入口测试。
5. 早期绕行一旦被最终证据推翻，必须更正旧记忆，不能让相互矛盾的“最终方案”长期共存。

详细的证据台账、时间线、无效尝试与未覆盖边界见 [`docs/reports/2026-08-12-monorepo-ci-build-cache-and-package-closure-incident.md`](../../../../docs/reports/2026-08-12-monorepo-ci-build-cache-and-package-closure-incident.md)。
