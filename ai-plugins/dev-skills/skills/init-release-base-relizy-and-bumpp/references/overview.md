# 技能知识地图与推荐落地顺序

## 知识分层

1. **流程与阻断**：`SKILL.md` 中六阶段与显式阻断条件。
2. **可填表格与骨架**：`templates/` — 侦察、确认、配置文件模板、scripts 模板、兼容记录、README。
3. **决策与原理**：`references/` — versionMode、private、tag、Windows、验证、架构、依赖冲突预检。

## 推荐实现顺序（在任意目标仓库中落地时）

1. 填 `templates/workspace-discovery.md`，对照 [`discovery-checklist.md`](discovery-checklist.md) 补全信号。
2. 跑 [`version-mode-decision.md`](version-mode-decision.md) 与 [`package-visibility.md`](package-visibility.md)，完成 `templates/package-eligibility.md`。
3. 执行 [`dependency-conflict-precheck.md`](dependency-conflict-precheck.md) 故障预检，排除遗留依赖冲突。
4. 按 [`config-templates.md`](config-templates.md) + [`type-compatibility.md`](type-compatibility.md) 落盘配置（5 个配置文件 + scripts）。
5. 按 [`windows-compatibility.md`](windows-compatibility.md) 与 [`baseline-tags.md`](baseline-tags.md) 处理兼容与 tag，记录 `templates/runtime-compat.md`。
6. 执行 [`verification-matrix.md`](verification-matrix.md)，再填 `templates/docs-sync.md`。
7. 若遇止损条件，见 [`rollback-and-risks.md`](rollback-and-risks.md)。

## 与「原型」的关系

[`validated-archetypes.md`](validated-archetypes.md) 提供已验证路线，用于**对照决策**，不替代本仓库的独立侦察。

## 与 `release-workflow-architecture.md` 的关系

[`release-workflow-architecture.md`](release-workflow-architecture.md) 提供 relizy + bumpp 组合发版的**完整架构说明**，包括工具分工、执行流程、tag 格式与 GitHub Release 创建策略。
