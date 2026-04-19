# 2026-04-19 release-ai-plugins 剪切迁移与双根技能感知设计

## 目标

将 `release-ai-plugins` 从仓库局部技能剪切迁移为 `common-tools` 对外分发技能，并明确后续只保留一个真实来源：

- 保留：`ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
- 删除：`.claude/skills/release-ai-plugins/`

同时补齐“项目局部技能”和“对外分发技能”并存时的双根感知，避免迁移完成后出现以下断链：

- 根级 AI 记忆文档仍指向旧路径
- `init-ai-md` 仍只扫描 `.claude/skills/`
- 技能表继续误报仓库内真实技能来源
- `common-tools` 对外说明缺少新技能入口

## 非目标

- 不借本次变更把所有 `.claude/skills/*` 全量迁入 `ai-plugins/*/skills/*`
- 不重构 `.claude/skills` 目录下其他项目局部技能的职责边界
- 不在本次迁移中同步提升 marketplace 或 plugin manifest 主版本
- 不批量改写历史 `docs/plan/**`、`docs/reports/**` 中作为历史快照的旧路径引用

## 现状

当前仓库存在两套事实正在发生冲突：

1. `release-ai-plugins` 的真实文件仍位于 `.claude/skills/release-ai-plugins/SKILL.md`
2. `ai-plugins/common-tools/skills/` 已经是仓库对外分发技能的稳定根目录

这导致 `release-ai-plugins` 在职责上已经属于 `ai-plugins` 发布链路，但在存储位置上仍被当作仓库局部技能维护。

进一步侦察后，可以确认以下影响面：

- `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 都把 `release-ai-plugins` 登记为 `.claude/skills/release-ai-plugins/SKILL.md`
- 这些根级 AI 记忆文档的总述也默认“本仓库在 `.claude/skills/` 下维护 Claude Code 技能”
- `ai-plugins/common-tools/skills/init-ai-md/SKILL.md` 将“技能表管理”写死为扫描 `.claude/skills/`
- `init-ai-md` 的技能表模板示例路径也写死为 `.claude/skills/...`
- `ai-plugins/common-tools/README.md` 的 Skills 列表和目录树尚未包含 `release-ai-plugins`

如果只做文件移动，不同步修改这些发现逻辑和文档入口，迁移会立刻留下结构性错误。

## 方案选择

### 方案 A：最小剪切迁移

只移动 `SKILL.md`，删除旧目录，并修复直接引用旧路径的文档。

优点：

- 改动最少
- 落地最快

缺点：

- `init-ai-md` 下次运行仍会漏扫该技能
- 根级 AI 记忆文档很容易再次漂移回旧结构
- 对仓库而言，迁移只是“表面完成”，发现链路没有跟上

### 方案 B：剪切迁移 + 双根感知

移动 `SKILL.md` 并删除旧目录，同时将“技能表”和“AI 记忆文档”的技能发现逻辑升级为双根模型：

- 项目局部技能：`.claude/skills/**/SKILL.md`
- 对外分发技能：`ai-plugins/*/skills/**/SKILL.md`

优点：

- 迁移后结构闭环完整
- 根级 AI 记忆文档能够反映真实来源
- `init-ai-md` 后续可以稳定维护双根技能表
- 为未来继续迁移其他技能提供现成框架

缺点：

- 改动面比纯移动文件更大
- 需要同时修改技能文档、模板文档和 AI 记忆文档

### 方案 C：全量规范化

借本次机会全面重写仓库技能体系，将更多 `.claude/skills/*` 一并迁移到 `ai-plugins/*/skills/*`。

优点：

- 最终形态最整齐

缺点：

- 明显超出当前任务范围
- 风险和改动面都不成比例

### 结论

采用方案 B。

本次迁移的关键不是“把一个文件换个目录”，而是要让仓库对技能来源的认知从单根模型升级为双根模型。

## 设计

### 1. 真实来源切换

`release-ai-plugins` 迁移后只保留一个真实来源：

- `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`

以下旧目录直接删除，不保留 shim、转发壳或兼容副本：

- `.claude/skills/release-ai-plugins/`

该技能在语义上从“仓库局部技能”切换为“`common-tools` 对外分发技能”，其 `metadata.version` 应随这次迁移上调一版，原因是：

- 来源路径发生变化
- 使用边界发生变化
- 后续应由 `common-tools` 负责登记与发布说明

### 2. 根级 AI 记忆文档改为双根表述

以下文件都要更新：

- `CLAUDE.md`
- `AGENTS.md`
- `GEMINI.md`

需要同步修改两部分：

1. 顶部总述
2. 「本项目的技能表」章节

总述不再写成“本仓库在 `.claude/skills/` 下维护 Claude Code 技能”，而改为显式区分：

- 项目局部技能位于 `.claude/skills/`
- 对外分发技能位于 `ai-plugins/*/skills/`

### 3. 技能表改为双分组

根级 AI 记忆文档中的「本项目的技能表」采用双分组，不再使用单列表混排：

- `### 项目局部技能（仓库内维护）`
- `### 对外分发技能（ai-plugins）`

分组规则按真实路径决定：

- 命中 `.claude/skills/` 前缀的技能，进入“项目局部技能”
- 命中 `ai-plugins/*/skills/` 前缀的技能，进入“对外分发技能”

`release-ai-plugins` 迁移后必须出现在“对外分发技能（ai-plugins）”分组内。

组内排序采用稳定排序，不按最近改动时间排序，避免每次重生成时无意义抖动。推荐按：

1. 路径前缀分组
2. 技能名字典序排序

### 4. init-ai-md 升级为双根感知

`ai-plugins/common-tools/skills/init-ai-md/SKILL.md` 需要区分两类操作：

#### 4.1 本地内置技能部署

这一部分保持现状，仍然只面向 `.claude/skills/`：

- 例如部署 `record-bug-fix-memory`
- 例如创建 `.claude/skills/fix-bug/record-bug-fix-memory/`

原因是这些属于仓库局部技能模板，不属于对外分发插件树。

#### 4.2 技能表扫描

这一部分改为双根扫描：

- `.claude/skills/**/SKILL.md`
- `ai-plugins/*/skills/**/SKILL.md`

读取规则不变，仍从每个 `SKILL.md` 的 YAML frontmatter 和正文中提取：

- `name`
- `description`
- 触发时机
- 参考作用
- 约束

但输出结构需要改成双分组，不能再默认所有技能都来自 `.claude/skills/`。

### 5. 技能表模板改为通用路径

`ai-plugins/common-tools/skills/init-ai-md/templates/08.本项目的技能表.md` 需要从“写死 `.claude/skills/...` 示例路径”改为“按真实扫描结果回填路径”的通用模板。

模板至少要体现以下约束：

- 技能条目允许来自不同根目录
- 路径字段必须直接写真实相对路径
- 技能表分组必须与真实来源一致

### 6. common-tools 对外说明补登记

以下文件需要将 `release-ai-plugins` 正式纳入 `common-tools` 技能树：

- `ai-plugins/common-tools/README.md`
- `ai-plugins/common-tools/CHANGELOG.md`

其中：

- README 需要补 Skills 列表与目录树
- CHANGELOG 需要记录本次迁移与双根感知改造

这样后续从 `common-tools` 视角查看技能时，`release-ai-plugins` 才是可见且可追踪的。

## 数据流与发现链路

迁移后的技能发现链路统一为：

1. 技能文件存在于两个根之一
   - `.claude/skills/**/SKILL.md`
   - `ai-plugins/*/skills/**/SKILL.md`
2. `init-ai-md` 扫描双根
3. `init-ai-md` 按路径前缀将技能分为两组
4. 根级 AI 记忆文档按双分组更新技能表
5. Agent 读取根级 AI 记忆文档时，可直接理解每个技能的真实来源与职责边界

对 `release-ai-plugins` 而言，这条链路会变成：

`ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
→ 被 `init-ai-md` 识别为“对外分发技能”
→ 写入 `CLAUDE.md / AGENTS.md / GEMINI.md`
→ 后续 agent 不再误指向 `.claude/skills/release-ai-plugins`

## 实施顺序

按以下顺序落地，避免中途出现路径断档：

1. 在 `ai-plugins/common-tools/skills/` 下创建 `release-ai-plugins/` 并迁入 `SKILL.md`
2. 更新 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md`
3. 更新 `init-ai-md/SKILL.md` 与 `templates/08.本项目的技能表.md`
4. 更新 `ai-plugins/common-tools/README.md` 与 `CHANGELOG.md`
5. 删除 `.claude/skills/release-ai-plugins/`
6. 清理活文档中的旧路径残留

## 错误处理与约束

### 明确约束

1. 本次迁移是剪切迁移，不允许保留第二份真实来源
2. `.claude/skills/release-ai-plugins/` 删除后，不添加 shim
3. AI 记忆文档必须在同一次迁移中完成更新，不能留到后续补
4. `init-ai-md` 必须显式区分：
   - 本地内置技能部署
   - 双根技能表扫描

### 不做的事

1. 不在本次迁移中同步修改 marketplace / plugin manifest 的版本号
2. 不要求立即重跑一次 `init-ai-md` 自动重建整份 AI 记忆文档
3. 不批量改写历史 plan / report 文档中的旧路径

## 验证方案

### 静态验证

确认以下事实同时成立：

- `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md` 存在
- `.claude/skills/release-ai-plugins/` 不存在
- `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 中 `release-ai-plugins` 的路径都已改为新位置
- 根级 AI 记忆文档技能表为双分组
- `init-ai-md` 文本规则已改为双根扫描
- 技能表模板不再写死 `.claude/skills/...`
- `ai-plugins/common-tools/README.md` 已补 `release-ai-plugins`

### 搜索验证

使用全文搜索确认活文档中不再把 `release-ai-plugins` 的真实来源写成旧路径：

```bash
rg -n "release-ai-plugins|\\.claude/skills/release-ai-plugins" CLAUDE.md AGENTS.md GEMINI.md ai-plugins .claude README.md docs
```

判定标准：

- 根级 AI 记忆文档和活 README 不再依赖旧路径
- 历史 `docs/plan/**`、`docs/reports/**` 可保留旧引用，不视为失败

## 风险

1. 如果只移动文件，不升级 `init-ai-md`，下次运行技能表生成时会把仓库重新拉回单根认知。
2. 如果 AI 记忆文档仍保留“本仓库只在 `.claude/skills/` 下维护技能”的描述，后续 agent 会继续被误导。
3. 如果 `common-tools/README.md` 不补登记，技能已经进入对外分发树，但对外说明仍然不可见。
4. 如果混淆“本地内置技能部署”和“技能表扫描”，后续会把 `.claude/skills` 与 `ai-plugins/*/skills` 的职责再次揉在一起。

## 完成标准

满足以下条件，视为本次设计落地完成：

- `release-ai-plugins` 的唯一真实来源变为 `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`
- `.claude/skills/release-ai-plugins/` 被彻底删除
- `CLAUDE.md`、`AGENTS.md`、`GEMINI.md` 全部改为双根表述
- 根级 AI 记忆文档技能表采用双分组
- `init-ai-md` 明确支持双根技能表扫描
- `common-tools` 的 README / CHANGELOG 已登记该技能
- 活文档中不再把 `release-ai-plugins` 的真实来源写成旧路径

## 下一步

1. 用户审阅本设计文档
2. 若无修改，进入 `writing-plans` 阶段，将本设计展开为实施计划
3. 计划获批后，再执行实际迁移与验证
