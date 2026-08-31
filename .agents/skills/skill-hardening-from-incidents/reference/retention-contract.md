# 知识保留契约

## 目标

技能可以压缩入口，但不能压缩掉未来 agent 需要的判断依据。任何删除都必须是“迁移后删除”，并能从当前参考文件或历史 archive 恢复原规则、证据来源和验证方式。

## 不可逆操作门禁

1. **盘点**：编辑前列出当前章节、规则、示例、命令和异常分支。
2. **分配**：为每个条目标记 `inline`、`reference`、`archive`、`root-memory` 或 `external-skill` 唯一去向。
3. **先迁移**：当前仍有效规则先写入当前 reference；只为保留旧版本原貌的内容先写入 `reference/archive/<skill>/`，再修改入口。
4. **登记**：在 `reference/README.md` 记录来源、目标、原因、日期和验证状态。
5. **回读**：迁移后回读目标文件，确认原规则、反例和命令都存在；不能只检查文件存在。
6. **审计**：对比编辑前后的标题和规则清单，解释每一项减少；扫描失效链接、孤立参考文件、archive 误入活跃导航和重复真值。

### 最小修改门禁

行为升级不自动授权正文重写。对已有 skill 做定点变更时：

- 先读取 `HEAD` 原文，并分别查看目标文件的 staged/unstaged diff。
- 把标题、段落、示例、分支、命令、标点和措辞列为默认保护内容。
- 每个 diff 块必须对应用户明确要求或解决真实冲突；无关润色、换引号、重排列表和压缩正常说明均禁止。
- 若出现无法解释的新增或删除，必须停止并回到基线，不得在重写稿上继续打补丁。
- 完成前检查 diff 统计、`git diff --check` 和保护内容回读；这些检查未通过时不得宣称迁移完成。

## 当前 reference 与 archive 的物理隔离

### 当前规范层

`reference/*.md` 顶层只放当前可执行规则、模板、验证方法和专题说明。正常执行 skill 时，只从这一层按需加载。

### 历史证据层

历史全文、pre-split 快照、旧模板和已被替代规则放在：

`reference/archive/<skill-name>/`

archive 必须满足：

- 标记为 **NON-NORMATIVE**；
- 默认不参与正常执行阅读路线；
- 只有知识保留审计、迁移追溯、旧规则比较时才定向读取；
- 原始快照可保持字节级/文本级原貌，不要求在正文内插入新标记；
- Deprecated 状态、归档日期、替代规则、废弃原因统一写在 `reference/archive/README.md` 或迁移台账。

这能同时满足“历史不丢失”和“旧规则不干扰当前执行”。

## 保留粒度

- 当前规则要保留“现象、根因、错误诱因、未来动作、验证方式”五个要素。
- 示例要保留足以触发正确判断的上下文；只有格式噪声可以删除。
- 失败案例要保留失败信号、错误边界和修复后的门禁，不能只保留结论。
- 过时规则不直接删除：若仍需解释当前行为，保留 Deprecated 说明；若仅用于历史审计，移动到 archive 并在索引登记替代关系。

## 版本与冲突

- `SKILL.md` 发生行为变化时递增 `metadata.version`，纯拼写修正可不升版本。
- 当前 `SKILL.md` 与当前 `reference/*.md` 是执行真值；archive 不是当前真值。
- 当前参考文件与入口出现冲突时，以最新且有验证证据的规则为准，并在台账记录冲突解决理由。
- archive 与当前规则冲突是允许的，因为 archive 只描述历史；不得据此覆盖当前规则。
- 同一当前规则不得在多个文件各自维护不同措辞；入口写摘要，当前参考文件写完整约束。

## 完成检查

```powershell
rg -n "TODO|TBD|待确认|file://|[A-Za-z]:\\\\|/Users/|/home/" .agents/skills/skill-hardening-from-incidents
rg -n "\\[.*\\]\\([^)]*\\)" .agents/skills/skill-hardening-from-incidents/SKILL.md
git diff --check -- .agents/skills/skill-hardening-from-incidents
```

另外检查：

- 活跃 `reference/README.md` 不把具体 archive 快照与当前规范并列成普通阅读入口；
- `reference/archive/README.md` 对每组历史快照标出 NON-NORMATIVE、归档日期、替代规则和原因；
- 正常执行路径没有要求加载 archive；
- 当前 skill 不依赖 archive 才能正确执行。

扫描命中必须逐项解释；`待确认` 只能表示真实未决证据，不能作为删除细节的替代品。
