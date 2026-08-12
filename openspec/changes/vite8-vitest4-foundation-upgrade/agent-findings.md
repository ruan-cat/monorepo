# 长任务发现记录

## 当前已确认

- 原 superpowers 设计草案的有效内容已吸收到 `design.md`、三份 delta spec 和 `tasks.md`；草案已删除，后续只以本 change 工件为准。
- 根工具链声明为 Vite 6 / Vitest 3；锁文件实际存在 Vite 5、6 多版本来源。
- `vitest.workspace.ts` 使用 `packages/*`，会把没有独立 Vitest 配置的包带入发现范围。
- Vitest 基线列表已经暴露源码子路径缺失、未构建 `dist`、缺失直接依赖和 VitePress 配置产物入口问题。
- `@ruan-cat/*/src/...` 在本仓库属于 package `exports` 子路径契约，不应简单当作 TypeScript alias 问题处理。
- VitePress 1.x 与 VuePress bundler rc20 仍分别牵引旧 Vite 主版本；全仓单版本 Vite 8 需要先完成文档框架兼容性决策。
- 当前没有发现错误位置的 `agent-progress.md` 或 `agent-findings.md`；仓库已有的 `AGENT_LONGTASK.md` 是技能说明，不是垃圾工件。

## 约束与风险

- 既有工作区包含用户的未提交修改和临时文件；本 change 不删除、不覆盖、不提交这些文件。
- “修复基线问题”与“升级 Vite/Vitest”必须保持 checkpoint 分离，否则无法判断回归来源。
- 不通过根目录依赖提升、宽泛 alias、无说明 override 或自动全仓构建掩盖包契约问题。
- 在用户审核 CP-00 前，不运行 checkpoint 1，不修改源码、依赖、锁文件或测试配置。

## 工期与接力提示

- 当前规划为 8 个实现 checkpoint，总量级约 35–75 小时有效工作量；CP-02、CP-06、CP-07 是高风险长段，不能按普通依赖升级估算。
- CP-02 最容易陷入误区：把缺失的 `@ruan-cat/*/src/...` 文件一律恢复，或把陈旧测试一律删除。必须先确认 exports、历史 API 和测试意图。
- CP-03 最容易出现假修复：把 `del` 等依赖提升到根目录、先全仓 build 再跑测试，导致包级声明和顺序问题继续隐藏。
- CP-04/CP-05 的主要风险是 project 配置继承和 Vitest 4 行为变化；必须先保留 CP-04 的等价迁移证据，再升级版本。
- CP-06/CP-07 的主要风险是把 Vite 8 核心轨道误写成全仓统一；文档框架可能长期保持 Vite 5/6 双轨。
- 任何 agent 接手时都应从 `tasks.md` 第一个未勾选任务开始，并把命令、失败输出和停止原因回写到本目录；禁止只在聊天中报告进度。

## 待后续验证

- utils 源码子路径对应的真实 API 契约与陈旧测试处置方式。
- 各包 exports、dist 产物和测试入口的构建顺序。
- Vitest 4 projects 的配置继承与 reporter/UI 行为。
- Vite 8 Rolldown/Oxc 对现有插件和文档框架的真实构建结果。
