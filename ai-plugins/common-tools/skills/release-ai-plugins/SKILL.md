---
name: release-ai-plugins
description: 管理 ai-plugins 多插件与多平台（Claude/Cursor）插件商城的版本升级，包括同步 marketplace/plugin 版本号、校验路径、维护更新日志与文档安装链接。在用户要求升级插件版本、发布插件、更新插件商城或更新日志时使用。触发关键词：release-ai-plugins、ai-plugins、插件升级、版本更新、发布插件、更新日志、cursor-plugin。
metadata:
  version: "0.16.0"
---

# AI Plugins 多平台发布助手

本技能是 `ai-plugins/common-tools` 下的对外分发 skill，唯一真实来源路径为 `ai-plugins/common-tools/skills/release-ai-plugins/SKILL.md`。

本技能用于自动化处理 `ai-plugins` 的多插件、多平台发布流程，确保单一主版本一致性和路径稳定性。

## 使用场景

当遇到以下情况时使用本技能：

- 需要发布 `common-tools` 或 `dev-skills` 插件的新版本
- 更新 Claude/Cursor 双平台 marketplace 版本号
- 同步多个 plugin manifest 的版本号
- 更新发布说明、安装文档、README 链接

## 核心职责

1. **版本号管理**：以主版本驱动双平台与双插件版本同步
2. **更新日志维护**：编写符合规范的版本更新说明
3. **清单校验**：校验 Cursor/Claude 清单路径与字段
4. **文档同步**：确保安装文档中的路径、命令、链接均指向 `ai-plugins`

## 相关文件目录

发布流程的核心文件位于：

- 根级 marketplace
  - `.claude-plugin/marketplace.json`
  - `.cursor-plugin/marketplace.json`
- 插件目录
  - `ai-plugins/common-tools`
  - `ai-plugins/dev-skills`
- 插件 manifest
  - `ai-plugins/common-tools/.claude-plugin/plugin.json`
  - `ai-plugins/common-tools/.cursor-plugin/plugin.json`
  - `ai-plugins/dev-skills/.claude-plugin/plugin.json`
  - `ai-plugins/dev-skills/.cursor-plugin/plugin.json`

## 主版本策略

采用单一总版本（Single Source of Truth）：

1. 主版本源：`.claude-plugin/marketplace.json` 的 `metadata.version`
2. 同步目标：
   - `.cursor-plugin/marketplace.json` 的 `metadata.version`
   - 两个插件在 Claude/Cursor 的 `plugin.json` 中 `version`

### Skills 文档的 metadata.version 字段

Skill 文档版本号保持独立演进：仅在该 Skill 内容有变更时更新，不强制随插件主版本同步。

**扫描范围**：

- `ai-plugins/common-tools/skills/**/SKILL.md`
- `ai-plugins/dev-skills/skills/**/SKILL.md`

### 主版本号格式

遵循语义化版本规范（Semantic Versioning）：

- `MAJOR.MINOR.PATCH`（例如：`2.12.1`）
- MAJOR：不兼容的 API 修改
- MINOR：向下兼容的功能性新增
- PATCH：向下兼容的问题修正

## README 与文档同步规则

发布时至少校验以下文档路径与命令：

- `ai-plugins/docs/README.md`
- `ai-plugins/docs/use-vercel-skills-install.md`
- `.claude-plugin/README.md`
- `.cursor-plugin/README.md`
- 根 `README.md`

所有安装命令必须使用 `ai-plugins/...` 路径，不允许出现 `claude-code-marketplace/...` 旧路径。

## 更新日志文件

每次版本更新的内容**必须**记录在以下文件中：

- `ai-plugins/common-tools/CHANGELOG.md`
- `ai-plugins/dev-skills/CHANGELOG.md`（如不存在则创建）

### 更新日志格式

遵循 [Keep a Changelog](https://keepachangelog.com/) 规范：

```markdown
## [版本号] - YYYY-MM-DD

### Added

- 新增的功能

### Changed

- 变更的功能

### Deprecated

- 即将废弃的功能

### Removed

- 已移除的功能

### Fixed

- 修复的问题

### Security

- 安全相关的修复
```

### 更新日志排版要求

写 `CHANGELOG.md` 时，**优先保证可读性，再保证信息完整**。不要把 4 到 6 个变化点硬堆进一条超长 bullet。

#### 必须遵守

1. 先写版本节与分类节，再写 bullet；不要先堆内容后补结构。
2. 一类变化尽量拆成多条 flat bullets，每条只承载一个独立信息块。
3. 技能或插件名放在 bullet 开头，版本变化紧跟其后，便于扫读。
4. 文件名、命令、版本号、字段名统一用反引号包裹。
5. “版本同步”与“功能变化”分开写，不能混进同一长句。
6. major 级变更优先按“行为变化 / 配置变化 / 风险边界变化 / 版本同步”拆开。

#### 明确禁止

- 禁止单条 bullet 同时塞入多个分号串联的大段说明。
- 禁止把多个文件、多个原因、多个效果揉成一个 3 到 5 行的大段落。
- 禁止为了“信息完整”牺牲扫读体验。
- 禁止生成视觉上发紧、读者必须逐字解析的 changelog。

#### 推荐写法

```markdown
## [5.0.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**（`metadata.version` `1.1.1` -> `2.0.0`，重大调整）：
- 根包 changelog 默认链路从 `conventional-changelog` 收口到 `changelogen`。
- `templates/bump.config.ts` 改为 `execute(newVersion)`，显式把目标版本传给根 `CHANGELOG.md` 生成流程。
- `templates/release.yaml` 保留原注释风格，仅补 `set +e` / `set -e` 提升 notes 提取容错。
- 预检范围从“旧 angular preset 冲突”收缩为“遗留根包发版工具是否还残留”。
- 根级 marketplace 中 `common-tools` / `dev-skills` 双平台 `plugin.json` 统一提升至 `5.0.0`。
```

#### 反例

```markdown
- **init-release-base-relizy-and-bumpp**（`metadata.version` `1.1.1` -> `2.0.0`，重大调整）：将根包 changelog 默认生成链路从 `conventional-changelog` 收口到 `changelogen`，并同步重写根包 `bumpp` 模板的执行方式与发版预检边界，`templates/bump.config.ts` 改为 `execute` 函数并传 `newVersion`，`templates/release.yaml` 保留既有注释风格，只最小补充 `set +e` / `set -e`，预检也从旧 angular preset 冲突收缩为遗留根包发版工具残留……
```

上面的反例信息并没有错，但排版是错的。以后生成 changelog 时，必须主动把这种长句拆开。

## 升级流程

执行版本升级时，按顺序执行：

1. **确定主版本号**
   - 根据变更类型确定主版本增量（MAJOR/MINOR/PATCH）
2. **同步双平台 marketplace**
   - 更新 `.claude-plugin/marketplace.json` 的 `metadata.version`
   - 更新 `.cursor-plugin/marketplace.json` 的 `metadata.version`
3. **同步双插件 manifest**
   - 更新 `ai-plugins/common-tools` 的 Claude/Cursor `plugin.json` 版本
   - 更新 `ai-plugins/dev-skills` 的 Claude/Cursor `plugin.json` 版本
4. **按需更新 Skills 版本**
   - 仅更新变更过的 `SKILL.md` 的 `metadata.version`
5. **更新文档与 changelog**
   - 修正安装命令路径与插件列表
   - 在对应 `CHANGELOG.md` 顶部追加新版本条目
   - 先把 changelog 草稿整理成易扫读的 Markdown 结构，再填充细节
   - 对 major 变更，至少检查一次是否仍存在“单条 bullet 过长”的问题
6. **一致性校验**
   - 校验 marketplace 与 plugin 版本是否一致
   - 校验 `source`/`pluginRoot` 指向是否存在
   - 校验文档命令路径是否只使用 `ai-plugins`
   - 校验 `CHANGELOG.md` 是否由短句 bullet 组成，而不是一整段拥挤长句
7. **提交发布改动**
   - 推荐提交信息：`chore(plugin): release version X.Y.Z`

## 注意事项

1. **主版本一致性**：双平台 marketplace + 双插件 manifest 必须一致。
2. **平台规范分离**：Cursor 与 Claude 字段可能不同，按各自规范维护。
3. **旧路径禁用**：发布前必须确认无 `claude-code-marketplace` 路径残留。
4. **Skills 独立版本**：Skill 的 `metadata.version` 只在该 Skill 变更时更新。
5. **更新日志优先可读性**：如果 changelog 一眼看上去像“压成一团的说明书”，说明写法失败，需要重排。

## 相关资源

- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/)
- [Cursor Plugins Reference](https://cursor.com/docs/reference/plugins)
