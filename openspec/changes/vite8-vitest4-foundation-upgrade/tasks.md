# 长任务 checkpoint 清单

> 本文件是本 change 的唯一任务来源。当前只建立任务边界，等待用户审核；所有 checkpoint 均未开始。

## 工期与风险总览

以下是规划估算，不是承诺工时；实际耗时取决于基线问题是否需要恢复公开 API，以及 VitePress/VuePress 上游版本的可用性。

| Checkpoint                 | 预估有效工作时间 | 难度 | 主要故障点/困难                                                          |
| -------------------------- | ---------------: | ---- | ------------------------------------------------------------------------ |
| CP-00 工件审核             |       0.5–1 小时 | 低   | 目标范围、双轨策略或破坏性边界需要重新确认                               |
| CP-01 基线与边界           |         3–6 小时 | 中   | 多版本 Vite、包入口与测试发现范围交叉；失败可能来自既有基线              |
| CP-02 utils 与陈旧测试     |        6–12 小时 | 高   | `exports`、源码文件、测试断言和公开 API 可能互相矛盾，不能凭测试恢复 API |
| CP-03 构建顺序与依赖       |         4–8 小时 | 中高 | `dist` 前置、包级依赖声明、发布面变化和 VitePress 产物入口相互影响       |
| CP-04 Vitest projects 迁移 |         4–8 小时 | 中高 | 配置继承、node/jsdom 隔离、project 发现和旧 workspace 语义不完全等价     |
| CP-05 Vitest 4 升级        |         3–6 小时 | 中   | Module Runner、pool、reporter、coverage 或 UI 行为出现版本回归           |
| CP-06 核心 Vite 8          |        6–12 小时 | 高   | Rolldown/Oxc、插件 peer、产物差异和自有插件构建回归                      |
| CP-07 文档框架决策         |        6–16 小时 | 很高 | VitePress/VuePress 预发布版本、主题插件和文档构建稳定性不确定            |
| CP-08 CI 与最终验收        |         3–6 小时 | 中高 | 本地/CI Node 漂移、Turbo 编排和多版本锁定导致验收不一致                  |

总量级约为 **35–75 小时有效工作量**，更适合拆成多次接力，而不是一次长会话强行完成。外部 agent 接手时必须先读本表、`agent-progress.md` 和 `agent-findings.md`。

## CP-00：工件审核门

预估：0.5–1 小时。主要困难是确认破坏性范围和双轨策略；若用户改变目标，先更新工件，不进入实现。

- [ ] 审核 `proposal.md`、`design.md`、三份 delta spec、`tasks.md`、`agent-progress.md`、`agent-findings.md` 的范围和风险。
- [ ] 审核决定是否允许进入 CP-01；在获得明确确认前不得修改源码、依赖、锁文件或测试配置。
- 验证：仅检查 OpenSpec 状态和工件静态格式，不运行升级或修复命令。
- 停止条件：用户要求调整目标、保留双轨或删除某个能力时，先更新工件再继续。

## CP-01：基线与测试边界盘点

预估：3–6 小时。主要故障点是既有测试失败与迁移回归混杂、`packages/*` 发现范围过宽以及 Vite 多版本来源难以一次收敛。

- [ ] 重新记录 Node、pnpm、Vite、Vitest、VitePress、VuePress bundler 的声明与锁定版本。
- [ ] 建立包入口、`exports`、源码文件、`dist` 产物和测试引用的对应清单。
- [ ] 将 `packages/*` 的实际测试发现范围改造方案落到显式 project 清单，但不先修业务代码。
- 验证：`pnpm install --frozen-lockfile`、版本树检查、根 Vitest 列表命令及失败分类记录。
- 停止条件：无法区分既有基线失败与迁移回归时，冻结范围并补充证据。

## CP-02：修复基础包与陈旧测试契约

预估：6–12 小时。主要困难是判断 `@ruan-cat/*/src/...` 到底是缺文件、陈旧测试还是有意的源码入口；任何公开 API 变化都必须停下审核。

- [ ] 以 `@ruan-cat/utils` 为基础包，逐项确认源码子路径是否应恢复、测试是否应迁移到现有 API，或测试是否陈旧。
- [ ] 修复包 `exports` 与实际文件不同步的问题，保持公开入口与源码入口的意图清晰。
- [ ] 清理确认过的陈旧测试引用；不为通过测试凭空恢复已删除 API。
- 验证：utils 的定向 Vitest、构建和 entrypoints 检查，并保留变更前后的失败证据。
- 停止条件：发现行为契约不明确或涉及公开 API 破坏时，暂停并请求审核。

## CP-03：构建顺序与包级依赖完整性

预估：4–8 小时。主要故障点是测试需要 `dist` 但包尚未构建，以及补依赖后改变发布面；不能用根依赖提升掩盖包声明缺失。

- [ ] 为依赖 `dist` 的包入口测试声明可复现的构建前置步骤。
- [ ] 将测试直接使用的 `del`、`cpy`、`mkdirp` 等依赖按实际使用位置补齐或替换，并确认版本来源。
- [ ] 单独处理 VitePress 配置测试依赖构建产物的问题，不用根 alias 隐藏缺失产物。
- 验证：相关包 build、定向 test、干净安装后的重复运行。
- 停止条件：依赖声明会改变发布面或公开入口时，先更新 proposal/design 再实施。

## CP-04：Vitest 3.2 等价 projects 迁移

预估：4–8 小时。主要困难是让 node/jsdom、包级配置和根 reporters 保持边界，同时消除 workspace 的隐式发现。

- [ ] 在保持 Vite 6 的前提下，把 workspace glob 收敛为显式 project 配置。
- [ ] 为 node、jsdom、包级配置分别声明 include、setup、继承和命名。
- [ ] 让无独立配置的包不再被隐式发现，同时保留必要的显式测试入口。
- 验证：逐 project list/run、根命令、utils entrypoints 和 CI 等价测试。
- 停止条件：项目发现或配置继承语义无法解释时，不升级 Vitest 4。

## CP-05：Vitest 4 升级

预估：3–6 小时。主要故障点是 Vitest 4 的 Module Runner、pool、reporter、coverage/UI 行为变化；必须保持 CP-04 的 project 边界不变。

- [ ] 升级 `vitest` 与 `@vitest/ui` 到 Vitest 4 兼容版本，保持项目边界不变。
- [ ] 检查 Module Runner、pool、coverage、reporter 等受影响选项；只处理仓库实际使用项。
- [ ] 更新脚本和文档中的 workspace 术语，保留可回滚的依赖变更边界。
- 验证：冻结安装、逐 project run、根 UI/CI 等价命令和版本树检查。
- 停止条件：Vitest 4 失败无法归因于配置或既有基线时，回退本 checkpoint。

## CP-06：核心非文档包 Vite 8 试运行

预估：6–12 小时。主要困难是 Rolldown/Oxc 与现有 Rollup 选项、自有插件和 dts 构建的组合回归。

- [ ] 升级根核心 Vite 与已确认兼容的插件，先覆盖自有 Vite 插件、学习组件和 dts 构建。
- [ ] 检查 Rolldown/Oxc 下的 `rollupOptions`、external、target 和插件行为。
- [ ] 保留 VitePress/VuePress 旧版本轨道，不把文档构建混入核心收敛。
- 验证：核心包 build、插件 smoke test、版本树和产物检查。
- 停止条件：插件 peer 或构建回归未解决时，不进入文档轨道升级。

## CP-07：文档框架兼容性决策

预估：6–16 小时。主要故障点是 VitePress 2/VuePress 新版仍可能处于预发布，主题、插件和构建结果不能只靠 peer 版本判断。

- [ ] 独立评估 VitePress 2 与 VuePress bundler 新版本的稳定性、主题和插件兼容性。
- [ ] 只有在上游 peer 和真实文档构建证据都满足时，才提出文档轨道收敛到 Vite 8。
- [ ] 若仍需双轨，补充锁定原因、维护边界和后续收敛条件。
- 验证：`pnpm turbo build:docs`、VuePress 文档构建、VitePress 文档构建和版本链路。
- 停止条件：预发布框架引入不可接受风险时，保留双轨并结束本阶段。

## CP-08：CI 收敛与最终验收

预估：3–6 小时。主要困难是本地 Node 22 与 CI Node 24 的漂移、多版本 Vite 的合理保留，以及 CI 未覆盖全仓 Vitest 的现状。

- [ ] 统一本地与 CI 的 Node/pnpm 矩阵，避免环境漂移掩盖工具链问题。
- [ ] 将核心 build、docs build、显式 projects test、entrypoints 和版本树检查纳入等价验收路径。
- [ ] 复核锁文件中的保留旧 Vite 版本都有明确依赖链和文档说明。
- 验证：冻结安装、Turbo build/docs、全量显式 projects、entrypoints、CI 等价命令。
- 停止条件：任一关键层缺少真实输出证据时，只报告阶段性结果。
