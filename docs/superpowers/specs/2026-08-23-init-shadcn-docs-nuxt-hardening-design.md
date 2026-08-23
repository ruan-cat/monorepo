# 2026-08-23 `init-shadcn-docs-nuxt` 事故驱动加固设计

## 目标

将对外分发的 `init-shadcn-docs-nuxt` 从“给出可启动模板”升级为“能区分 Nuxt Content 兼容、生产构建图、Nitro standalone runtime、Turbo 缓存和 Windows 平台边界的执行型技能”。未来 agent 必须先定位第一个失败生命周期，再采用最小、可删除、可验证的修复；不得用宽 externalization、全局 hoist、长期 memory wrapper 或缓存绿灯掩盖真实故障。

## 用户可见结果

调用技能的 agent 能根据错误信号进入正确分支：

1. Content API 500、`ERR_INVALID_URL` 或 H3 导出缺失时，先检查 `shadcn-docs-nuxt`、Content、Nuxt、H3 的实际解析树。
2. final Nitro OOM 时，先审计 production source alias、宽 `vite.ssr.noExternal`、宽 `nitro.externals.inline`、Turbo 并发和资源数据，而不是一味提高 Node 堆或增加 bundle 清单。
3. build 通过但 `.output` HTTP 请求报 `MODULE_NOT_FOUND` 时，先检查 logical package name、deployment package manifest、pnpm alias/symlink 与 standalone closure；不把问题误归为 Vite/Nitro transform。
4. 仅当 `.output` 中由 `element-plus` 导入 `@popperjs/core` 并报精确缺包错误时，才在实际部署文档包的 `dependencies` 使用 `"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"`；不把该依赖预置到通用模板。
5. 由 Turbo 编排时，cache hit 不再被当作 fresh build 证据；变更构建图输入后需强制重跑任务，并继续进行 `.output` startup 与 HTTP smoke。

## 已确认设计决策

### 生产默认边界

完整 Nuxt 模板不再默认把 workspace 组件库的 `src` alias 用于 production。源码 alias 仅能在开发期显式 opt-in；production 默认消费正式 package boundary。此变更是有意的破坏性收紧：旧配置会把未编译源码及额外传递依赖带入服务端图，并与宽 `noExternal`/`inline` 叠加放大内存占用。

`vite.ssr.noExternal` 与 `nitro.externals.inline` 保留为工具，但必须具有 exact error、阶段归属、单变量对照、资源对照和删除条件。两者不得复制同一依赖族 matcher，且不能代替 runtime dependency 的 manifest 声明或 Nitro tracing。

### 生命周期诊断模型

新参考以以下顺序组织故障，而不是按包名堆配置：

```text
manifest → lockfile/安装 → dev → Vite SSR → Nitro bundling/tracing
→ .output startup → HTTP runtime → target deployment
```

每次诊断都记录 first failing gate。上一关没有失败时，禁止修改下一层的“万能配置”。Nuxt/Content/H3 兼容、构建图资源、pnpm alias closure、Windows trace 分别是独立故障域；一个域的修复不构成另一个域的验证。

### Element Plus / Popper 专项案例

该案例进入分发 skill 自身的 current reference，作为已验证的条件化处方：当 standalone server log 显示 `element-plus` 导入 `@popperjs/core` 且真实 HTTP 请求触发 `ERR_MODULE_NOT_FOUND`，在**部署文档包**的 `dependencies` 明确添加：

```json
{
	"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"
}
```

修复后必须 fresh install，检查 logical name 的解析，并完成 build、`.output` startup、HTTP smoke 与可用目标平台验证。该案例不允许演变成 inline `element-plus`、全局 `nodeLinker: hoisted`、targeted hoist 的默认替代品，也不进入 `templates/package.json`。

### Turbo 缓存可信度门

Turbo 只在目标项目实际使用 Turbo 时适用，不提供通用 `turbo.json` 模板。技能需要让 agent 检查：任务 inputs 是否覆盖 lockfile、Nuxt 配置、workspace package、环境和构建脚本；outputs 是否明确包含 `.output/**`、`.nuxt/**` 并排除各自 cache；并发是否有内存数据支持。

在变更依赖、lockfile、Nuxt 配置、环境、workspace package 或 build script 后，diagnostic run 必须忽略已有 task cache，例如使用目标项目等价的 `turbo run <task> --force`，并记录缓存状态。`--concurrency=1` 仅在单变量资源对照证明其必要时采用；它是调度/资源缓解，不是内容兼容或 runtime closure 的修复。无论 Turbo 是否绿色，artifact HTTP 验收都不可省略。

### 版本证据等级

模板中的保守 Nuxt 3 基线不因一次 CI 解析到较新 patch 版本而自动更新。技能需要区分 manifest 声明、lockfile 的实际解析版本、fresh install 的观测版本和完整生命周期验证。Nuxt 4 或任何未在同一链路完成 Content API、build、artifact HTTP、目标部署验证的新世代，只能标记为候选线。

## 文件结构与职责

| 路径                                                                                                     | 变更职责                                                                                                                |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`                                            | 升级入口、错误信号路由、生产验收合同、版本至 `1.1.0`。                                                                  |
| `.../references/production-graph-and-runtime-closure.md`                                                 | 新增 current reference：生命周期、externalization、Element Plus/Popper、Node heap、wrapper 退役、artifact HTTP、Turbo。 |
| `.../references/README.md`                                                                               | 新增当前 reference 导航与迁移台账；不把历史 archive 作为运行时依赖。                                                    |
| `.../references/incident-repair.md`                                                                      | 消除“完整 workspace/UI 依赖树加入 noExternal”的泛化建议，保留它作为历史误区与受限纠偏。                                 |
| `.../references/workspace.md`                                                                            | 写入开发 source alias 与 production package boundary、manifest 优先于 hoist/linker。                                    |
| `.../references/nuxt-config.md`                                                                          | 限定 `debug` 兼容例外，补充不外推为依赖族配置的门禁。                                                                   |
| `.../references/windows.md`                                                                              | 将宽杀进程示例改为 PID/命令行审计；统一使用 `pnpm exec nuxi`；保留条件化 trace 与跨平台复验。                           |
| `.../references/mdc-prettier.md`                                                                         | 修正 MDC 正例，确保开标记不带 Markdown 标题。                                                                           |
| `.../templates/nuxt.config.full.ts`                                                                      | 默认移除 production source alias；提供开发期显式 opt-in 的泛化模式。                                                    |
| `.../templates/workspace-aliases.ts`、`.../templates/plugins/ui-lib.ts`                                  | 移除项目特例，保留可复制的泛化样例。                                                                                    |
| `.../templates/package.json`                                                                             | 仅增加 runtime alias 检查说明；不预置 Element Plus/Popper alias。                                                       |
| `.../templates/.nuxt/**`                                                                                 | 删除 25 个非分发生成物；不迁移、不归档。                                                                                |
| `tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`                                                     | 新增 Vitest 静态行为契约，防止上述边界回退。                                                                            |
| `ai-plugins/dev-skills/CHANGELOG.md`                                                                     | 记录技能 `1.1.0` 的公开能力变化。                                                                                       |
| 发布 metadata、marketplace、registry                                                                     | 由 `release-ai-plugins` 发布流程更新为 `10.6.0`，registry 只由 canonical generator 写入。                               |
| `.agents/skills/fix-bug/record-bug-fix-memory/2026-08-23-init-shadcn-docs-nuxt-production-boundaries.md` | 实施验证后记录问题、根因、误导点、有效修复、验证与后续约束，并更新案例索引。                                            |

## 非目标

- 不重新部署、修改或修复 SmallAliceWeb。
- 不把 5120 MiB、某个 Node 版本、Windows trace workaround 或 npm alias 写成所有项目的默认配置。
- 不新增 runtime scanner、迁移器、memory wrapper、Turbo 配置生成器或自动修复脚本。
- 不把项目内部报告、绝对路径、内部测试路径或 SmallAliceWeb 特例泄露到外发 skill 的正常执行路径。
- 不把 archive、根级 AI 记忆或网络报告作为分发 skill 的运行时依赖。

## 验收设计

### 测试驱动的静态行为契约

新增的测试先在当前树失败，再以最小文档/模板变更转绿。它必须断言：

- skill metadata 为 `1.1.0`，reference 导航和生产诊断 reference 存在；
- `templates/.nuxt` 不存在；
- 分发内容不含内部绝对路径、`docs/reports`、内部 tests 路径或项目特例；
- full template 没有默认 production source alias 或宽 `noExternal`/`inline`；
- Element Plus/Popper 精确案例存在于 current reference，但通用 package 模板不含该依赖；
- active `routes.clear()` 不存在，Windows trace 保持平台与环境变量双门；
- MDC 正例不使用 `## ::demo-playground`；
- Turbo 规则只作为条件化缓存可信度门，并要求 fresh artifact smoke。

### 外部证据复核

本轮不重启 SmallAliceWeb 发布，但在 spec/plan 执行前已核对 PR #11 合并状态、GitHub production-build job 的 Nuxt build + `.output` HTTP 200 记录，以及 Vercel 现有 production deployment `Ready` 与受保护 HTTP 响应。这些是规则来源，不替代本仓库 skill 的静态验收，也不被表述为对任何新项目的生产保证。

### 发布验收

按 `release-ai-plugins` 先运行 `10.6.0` / `minor` / `init-shadcn-docs-nuxt` 的 DryRun，再在确认计划文件和实际改动一致后运行 Apply。发布验收必须包括：技能版本、六份 plugin manifest、Claude/Cursor marketplace、CHANGELOG、registry Apply/Check、README/安装文档一致性、范围内 `git diff --check`，以及可用客户端的安装 smoke。任何无法取得的客户端安装证据必须明确标记为未验证。

## 风险与缓解

最主要的风险是把来自一个真实项目的充分条件误写成所有项目的必要条件。缓解方式是将所有专门修复绑定到 error signature、执行阶段和验证命令；模板只保留无证据时安全的默认值。第二个风险是发布会扩大写集；缓解方式是先冻结预期发布文件、DryRun 审核、仅通过 release skill 的 canonical generator 改 registry，并在最终 diff 中排除既有用户修改。

## 设计自审

- 不存在临时占位符。
- 每个新规则都有明确故障信号、最小动作与验证门。
- Element Plus 专项案例与通用模板边界明确，不会强加无关依赖。
- Turbo、构建内存、Windows workaround 都被限定为条件化诊断，不被误写成默认修复。
- 发布范围、版本号和不提交约束已明确；尚未开始实现或发布。
