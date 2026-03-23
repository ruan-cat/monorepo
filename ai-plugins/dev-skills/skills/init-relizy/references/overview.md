# 技能知识地图与落地顺序

## 知识分层

1. **流程与阻断**：`SKILL.md` 中五阶段与显式阻断条件。
2. **可填表格与骨架**：`templates/` — 侦察、确认、配置骨架、兼容记录、README。
3. **决策与原理**：`references/` — versionMode、private、tag、Windows、验证。

## 推荐实现顺序（在任意目标仓库中落地时）

1. 填 `templates/workspace-discovery.md`，对照 [`discovery-checklist.md`](discovery-checklist.md) 补全信号。
2. 跑 [`version-mode-decision.md`](version-mode-decision.md) 与 [`package-visibility.md`](package-visibility.md)，完成 `templates/package-eligibility.md`。
3. 按 [`config-templates.md`](config-templates.md) + [`type-compatibility.md`](type-compatibility.md) 落盘配置。
4. 按 [`windows-compatibility.md`](windows-compatibility.md) 与 [`baseline-tags.md`](baseline-tags.md) 处理兼容与 tag，记录 `templates/runtime-compat.md`。
5. 执行 [`verification-matrix.md`](verification-matrix.md)，再填 `templates/docs-sync.md`。
6. 若遇止损条件，见 [`rollback-and-risks.md`](rollback-and-risks.md)。

## 与「原型」的关系

[`validated-archetypes.md`](validated-archetypes.md) 提供两条已验证路线，用于**对照决策**，不替代本仓库的独立侦察。
