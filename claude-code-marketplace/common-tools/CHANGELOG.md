# Changelog

`common-tools` Claude Code 插件的所有重要变更都将记录在此文件中。

本文档格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
项目遵循[语义化版本规范](https://semver.org/lang/zh-CN/)。

## [2.5.0] - 2026-02-28

### Changed

- **🔧 技能迭代**: `init-prettier-git-hooks` - 新增严谨的开发依赖检查步骤 (v0.13.4 → v0.14.0)
  - **功能增强**：在初始化格式化流程前，新增了「定位根 package.json 并检查依赖」的核心步骤
  - **Monorepo 支持**：能够智能识别 pnpm 和 npm/yarn 的 workspaces 项目架构，并确保在正确的 monorepo 根目录下执行依赖检查和安装
  - **精准查漏补缺**：要求逐一扫描并核对 6 个必需的 Node.js 开发依赖包（`prettier`, `@prettier/plugin-oxc`, `prettier-plugin-lint-md`, `lint-staged`, `simple-git-hooks`, `commitlint`）是否已经存在
  - **安装策略优化**：仅安装报告中缺失的依赖，不再盲目执行全量依赖安装，确保不过度污染项目环境与覆盖版本

### Technical Details

#### init-prettier-git-hooks 技能版本变更

- **版本号**: 0.13.4 → 0.14.0
- **变更说明**: 从单纯的「提供安装命令」升级至了具备环境感知、执行依赖检查、以及智能缺失补全的完整初始化流

## [2.4.0] - 2026-02-28

### Changed

- **🔧 技能迭代**: `openspec` - 拓展细化任务清单质量规范并重构技能文件结构 (v1.1.0 → v1.2.0)

  #### 功能增强：补充 tasks.md 编写规范（v1.1.0）

  针对长任务执行时 `tasks.md` 质量不足的问题，新增两项强制性规范：
  1. **任务必须落实到单文件级别**：每个任务条目必须同时包含 `[操作类型]`、文件完整相对路径、具体改动描述三要素。禁止编写无法定位到具体文件的模糊任务（如「更新配置」、「处理相关文件」）
  2. **试点任务分层机制**：任务总数 ≥ 5 时，必须在主体任务前设计「试点批次（Pilot Batch）」。试点任务满足：代表性（覆盖核心变更模式）、最小化（1-3 个）、低风险（避免基础设施文件）、可验证（构建/测试可验证）。验证通过后才推进主体任务

  **正确格式示例**：

  ```markdown
  - [ ] [修改] `packages/utils/src/index.ts` - 在 exports 列表末尾新增 `export * from "./foo"`
  ```

  #### 技能文件重构：按渐进式加载规范拆分（v1.2.0）

  按照 skill-creator 的 Progressive Disclosure 规范，对 openspec 技能文件进行分层重构：
  - **SKILL.md 主体精简**：从 450 行压缩至 166 行（↓ 63%），保留核心工作流和两条最关键的 tasks 规范
  - **新增 `references/` 目录**，将详细文档按需加载：
    - `references/tasks-writing-guide.md`：tasks.md 完整编写规范（文件级粒度详解 + 试点批次结构模板）
    - `references/delta-specs-format.md`：Delta Specs 完整格式规范
    - `references/configuration.md`：config.yaml 配置、自定义 Schema、故障排除
  - **description 字段增强**：将触发场景和适用范围移入 frontmatter description，提升技能触发准确性

### Technical Details

#### openspec 技能版本变更

| 变更               | 版本          | 详情                                                   |
| ------------------ | ------------- | ------------------------------------------------------ |
| 补充 tasks.md 规范 | 1.0.0 → 1.1.0 | 新增文件级粒度要求 + 试点批次规范                      |
| 渐进式加载重构     | 1.1.0 → 1.2.0 | 拆分 references/ 目录，SKILL.md 从 450 行精简至 166 行 |

#### 新增文件

- `claude-code-marketplace/common-tools/skills/openspec/references/tasks-writing-guide.md`
- `claude-code-marketplace/common-tools/skills/openspec/references/delta-specs-format.md`
- `claude-code-marketplace/common-tools/skills/openspec/references/configuration.md`

## [2.3.0] - 2026-02-28

### Added

- **📝 新增模板文件**: `init-ai-md` 技能新增 `07.简单任务的高效执行原则.md`
  - **内容概要**：
    1. 判断任务规模的决策表（@文件引用/简单任务 → 直接行动；多包架构 → 先侦察）
    2. 禁止行为清单：禁止对简单任务连续执行超过 3 次 `git log`、禁止扫描整个目录等
    3. 用户纠偏信号识别与响应机制（"太复杂了"、"不要反复查询"等）
    4. 简单任务的标准执行路径示例（以"写 changeset"任务为例，3 步完成）
  - **变更原因**：AI 在处理明确范围的简单任务时，容易陷入过度侦察模式，浪费大量 token 和时间。本模板旨在从根源上约束该行为
  - **效果**：项目内的 AI 在处理简单任务时能够快速识别任务规模，优先利用用户提供的上下文，避免不必要的大范围查询

### Technical Details

#### init-ai-md 技能版本更新

- **版本号**: 0.14.0 → 0.15.0
- **变更说明**: 新增 `07.简单任务的高效执行原则.md` 模板文件

## [2.2.0] - 2026-02-27

### Added

- **📝 新增模板文件**: `init-ai-md` 技能新增 `06.终端操作注意事项（防卡住）.md`
  - **内容概要**:
    1. 避免超长单行命令（PowerShell 可能挂起）
    2. 优先使用 `pnpm run` 而非 `npx`（避免交互提示卡住）
    3. 及时止损，不要反复轮询
    4. 合理的等待超时设置建议
  - **变更原因**: 帮助用户在 Windows PowerShell 环境下正确执行终端命令，减少因命令卡住导致的浪费时间
  - **效果**: 用户在使用本技能时能获得 Windows 终端操作的最佳实践指导

### Technical Details

#### init-ai-md 技能版本更新

- **版本号**: 0.13.4 → 0.14.0
- **变更说明**: 本次新增模板文件，通过版本号记录此次变更

## [2.1.0] - 2026-02-16

### Changed

- **🦄 技能文档重构**: `init-claude-code-statusline` - 优化 SKILL.md 文档写法
  - **变更类型**: 技能文档重构，未增加新功能
  - **变更内容**:
    1. 参考 `init-prettier-git-hooks` 的结构，明确列出需要创建的配置文件模板
    2. 使用编号层级组织文档结构（1. 必须创建/修改的配置文件 → 1.1 / 1.2）
    3. 在每个配置文件章节明确标注模板来源：`从模板复制：参见 [templates/xxx](./templates/xxx)`
    4. 展示关键模板内容（settings.json 的 JSON 结构、statusline.sh 的功能列表）
    5. 优化目录结构展示，更清晰地呈现模板文件位置
  - **变更原因**: 原文档模板文件引用不够明确，执行步骤与具体模板文件未一一对应，用户难以快速理解需要复制哪些文件
  - **效果**: 用户现在可以更清晰地了解每个配置文件的模板来源和用途，文档结构与 `init-prettier-git-hooks` 保持一致

### Technical Details

#### 变更前后对比

| 变更项       | 变更前                                          | 变更后                                                                           |
| ------------ | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 文档结构     | 核心功能 → 执行流程 → 注意事项                  | 状态栏功能 → 技能目录结构 → 配置文件 → 执行流程 → 自检清单 → 注意事项 → 触发场景 |
| 模板引用方式 | 末尾笼统提及「详细的模板内容请查看 templates/」 | 在具体配置章节明确标注「从模板复制：参见 [templates/xxx]」                       |
| 模板内容展示 | 无                                              | 展示关键 JSON 结构和功能列表                                                     |
| 章节层级     | 使用多级标题（H2 → H3 → H4）                    | 使用编号层级（1. → 1.1. → 1.2.）                                                 |

#### init-claude-code-statusline 技能版本更新

- **版本号**: 0.13.4 → 0.14.0
- **变更说明**: 本次文档重构通过版本号记录此次变更

## [2.0.3] - 2026-02-15

### Fixed

- **🐞 修复 git-commit 技能在 Windows/PowerShell 环境下中文乱码问题**
  - **问题原因**: Cursor IDE 的 Shell 工具在通过 `-m` 参数传递中文时存在编码问题，导致中文提交信息出现乱码
  - **修复方案**: 增加使用 `-F` 参数文件方式提交的备选方案
    - 创建临时提交信息文件（如 `commit-message.txt`）
    - 使用 `git commit -F commit-message.txt` 提交
    - 提交完成后删除临时文件
  - **效果**: 用户现在可以选择文件方式提交，解决 Windows/PowerShell 环境下的中文乱码问题
  - **相关文件**: `skills/git-commit/SKILL.md`

### Changed

- **git-commit 技能版本更新**: 0.0.2 → 0.0.3
  - 本次修复通过版本号记录此次变更

## [2.0.2] - 2026-02-13

### Fixed

- **🐞 修复 task-complete-notifier 后台进程阻塞 Claude Code hook 导致通知无法弹出的问题**
  - **根因分析**: 后台进程继承了父进程的 stdout 文件描述符，Claude Code 的 hook 执行器会等待所有 stdout 关闭后才认为 hook 完毕。但 `claude-notifier` 需要 ~15 秒完成，导致 hook 超时，Claude Code 强制终止整个进程组，通知进程被杀死。
  - **修复方案**:
    1. 后台子 shell 完全关闭继承的 FD：`</dev/null >>"$LOG_FILE" 2>&1 &`
       - `</dev/null`：关闭对父进程 stdin 的继承
       - `>>"$LOG_FILE" 2>&1`：stdout/stderr 重定向到日志文件，不再持有父进程的 stdout
       - Claude Code 可立即读取 JSON 响应并结束 hook，无需等待后台进程
    2. 移除 `set -euo pipefail`，防止任何命令失败导致脚本在输出 JSON 前意外退出
    3. 新增 `trap EXIT` 安全保障，确保无论脚本在何处退出都一定输出 JSON 响应
    4. `log()` 函数只写文件不输出 stdout，保持 stdout 干净只包含 JSON
    5. 移除不可靠的 Windows/Unix 平台分支（`start //b cmd //c`），改用跨平台统一的 `( ... ) &` 模式
    6. 新增 `command -v claude-notifier` 检测，日志记录 notifier 是否可用及路径
    7. 后台进程输出完整记录到日志（`[NOTIFIER START]` → 输出 → `[NOTIFIER DONE]`），便于排查问题
  - **效果**: 通知进程完全脱离 hook 生命周期，Claude Code 立即收到 JSON 响应并结束 hook，通知在后台正常弹出
  - **相关文件**: `scripts/task-complete-notifier.sh`

### Technical Details

#### 根因：后台进程 FD 继承导致 hook 超时

**问题机制**：

```plain
Claude Code Hook 执行器
    ↓ 启动脚本，等待 stdout 关闭
task-complete-notifier.sh
    ├─ (claude-notifier ...) &     ← 后台进程继承了父进程的 stdout
    ├─ echo '{"continue": true}'   ← JSON 写入 stdout
    └─ exit 0                      ← 脚本退出，但 stdout 仍被后台进程持有
    ↓
Claude Code 继续等待 stdout 关闭...
    ↓ ~15 秒后（notifier 完成）或 45 秒超时
Claude Code 终止整个进程组 → 通知被杀死
```

**修复后**：

```plain
Claude Code Hook 执行器
    ↓ 启动脚本，等待 stdout 关闭
task-complete-notifier.sh
    ├─ (claude-notifier ...) </dev/null >>"$LOG_FILE" 2>&1 &
    │                         ↑ stdin/stdout/stderr 全部重定向
    │                         ↑ 不再持有父进程的 stdout
    ├─ exit 0 → trap EXIT → echo '{"continue": true}'
    └─ stdout 立即关闭 ✅
    ↓
Claude Code 立即读取 JSON，hook 完成 ✅
后台 claude-notifier 独立运行 → 通知正常弹出 ✅
```

#### 脚本架构重构

| 对比项        | v2.0.1                                      | v2.0.2                                         |
| ------------- | ------------------------------------------- | ---------------------------------------------- |
| 错误处理      | `set -euo pipefail`（脆弱）                 | 无 `set -e` + `trap EXIT`（健壮）              |
| 平台分支      | Windows（`start //b cmd`）/ Unix（`nohup`） | 统一 `( ... ) </dev/null >>"$LOG_FILE" 2>&1 &` |
| stdout 输出   | log 函数同时写文件和 stdout                 | log 只写文件，stdout 干净                      |
| JSON 响应保障 | 仅在末尾 echo                               | `trap EXIT` 保障一定输出                       |
| FD 继承       | 后台进程继承父 stdout（阻塞 hook）          | 完全关闭 FD 继承（不阻塞）                     |
| notifier 诊断 | 无检测                                      | `command -v` + 路径日志 + 完整输出日志         |
| 脚本行数      | 99 行                                       | 119 行                                         |

### References

- 修复的脚本：`scripts/task-complete-notifier.sh`
- 诊断依据：`%TEMP%/claude-code-task-complete-notifier-logs/` 日志文件分析

## [2.0.1] - 2026-02-13

### Fixed

- **🐞 修复 task-complete-notifier 在 Windows 下异步调用 claude-notifier 无法触发的问题**
  - **问题原因**: 原实现仅针对 Unix 使用后台进程，在 Git Bash/MSYS2 等 Windows 环境下无法正确异步执行
  - **修复方案**:
    1. 新增 Windows/Unix 环境检测逻辑（检测 `Msys`、`WINDIR`、`MSYSTEM` 环境变量）
    2. Windows 分支：使用 `cygpath -w` 转换路径格式，通过 `start //b cmd //c` 启动独立进程
    3. Unix 分支：使用 `nohup` 双 fork 模式（`( nohup ... & ) &`），确保子进程完全脱离父进程
    4. 移除冗余的 cleanup trap，简化错误处理逻辑
  - **效果**: Windows 环境下 claude-notifier 现在能够正确异步触发，不再阻塞 Stop hooks 执行
  - **相关文件**: `scripts/task-complete-notifier.sh`

### Technical Details

#### 修复前的问题

```bash
# 仅支持 Unix 后台执行
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  claude-notifier task-complete --message "任务已完成" 2>&1 || {
    log "Notifier failed with exit code: $?"
  }
) &
```

**问题**：在 Windows Git Bash/MSYS2 环境下，后台进程管理不可靠，可能导致通知无法触发。

#### 修复后的实现

**Windows 分支**（新增）：

```bash
# 将项目路径转换为 Windows 格式
PROJECT_DIR_WIN=$(cygpath -w "$PROJECT_DIR" 2>/dev/null || echo "$PROJECT_DIR")

# 使用 start 命令异步启动通知（完全独立进程，不等待）
start //b cmd //c "cd /d \"$PROJECT_DIR_WIN\" && claude-notifier task-complete --message \"任务已完成\""
```

**Unix 分支**（改进）：

```bash
# 使用 nohup + 双 fork 确保进程完全独立
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  nohup claude-notifier task-complete --message "任务已完成" >> "$LOG_FILE" 2>&1 &
) &
```

#### 跨平台兼容性

| 环境            | 检测方式                                    | 执行方式            |
| --------------- | ------------------------------------------- | ------------------- |
| Git Bash (MSYS) | `uname -o` 返回 "Msys" 或存在 `WINDIR` 变量 | `start //b cmd //c` |
| MSYS2           | 存在 `MSYSTEM` 环境变量                     | `start //b cmd //c` |
| Cygwin          | 存在 `WINDIR` 环境变量                      | `start //b cmd //c` |
| WSL             | `uname -o` 返回 "GNU/Linux"，无 `WINDIR`    | `nohup` + 双 fork   |
| macOS/Linux     | 不满足 Windows 检测条件                     | `nohup` + 双 fork   |

### References

- 修复的脚本：`scripts/task-complete-notifier.sh`（第 60-89 行）
- 相关 Commit：`9d28019`

## [2.0.0] - 2026-02-13

### Breaking Changes

⚠️ **重大变更**: 完全移除 Gemini AI 智能总结功能

本版本完全移除了 Gemini AI 智能总结相关代码，这是一个破坏性变更。

**变更原因**：

- 同步调用 `claude-notifier` 导致 Stop hooks 阻塞其他并行钩子
- 出现重复通知问题（调用 2 次 `claude-notifier`）
- 复杂的代码逻辑导致维护困难
- 简化通知流程，只需在任务完成时发送简单通知

**移除的功能**：

- Gemini AI 总结生成逻辑（`gemini-2.5-flash`、`gemini-2.5-pro` 调用）
- transcript-reader.ts 对话上下文提取
- parse-hook-data.ts 钩子数据解析
- remove-task.ts 任务删除逻辑
- 重复的立即通知逻辑

**迁移指南**：

- 如果你需要 Gemini 智能总结功能，请继续使用 v1.0.0 版本
- v2.0.0 版本只发送简单的"任务已完成"通知
- 不再支持通过 `GEMINI_SUMMARY_ENABLED=true` 环境变量启用 Gemini 总结

### Changed

- **通知调用优化**: 从同步阻塞改为异步非阻塞
  - 修改前：同步调用 `claude-notifier`，需等待通知关闭才能继续
  - 修改后：使用后台进程 `&` 异步调用，脚本立即返回
  - 效果：不再阻塞其他 Stop hooks 执行

- **重复通知修复**: 从 2 次调用改为 1 次
  - 修改前：先发送"立即通知"，再发送"总结通知"（2 次弹框）
  - 修改后：只发送 1 次"任务已完成"通知
  - 效果：消除重复弹框打扰

- **脚本精简**: 代码量大幅减少
  - 修改前：451 行
  - 修改后：85 行
  - 减少：366 行（-81%）

### Technical Details

#### 修复前后对比

| 场景            | v1.0.0                      | v2.0.0     |
| --------------- | --------------------------- | ---------- |
| 通知调用次数    | 2 次（立即通知 + 总结通知） | 1 次       |
| 调用方式        | 同步阻塞                    | 异步非阻塞 |
| Gemini 总结     | 可通过环境变量启用          | 已移除     |
| 脚本行数        | 451 行                      | 85 行      |
| Stop hooks 阻塞 | 是（需手动关闭通知框）      | 否         |

#### 新架构

```bash
# 使用后台进程异步调用，不阻塞
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  claude-notifier task-complete --message "任务已完成" 2>&1 || {
    log "Notifier failed with exit code: $?"
  }
) &

NOTIFIER_PID=$!
log "Notifier started with PID: $NOTIFIER_PID"

# 立即返回，不等待通知关闭
echo '{"continue": true, "stopReason": "任务完成通知已发送"}'
exit 0
```

### References

- 相关脚本：`scripts/task-complete-notifier.sh`
- 关联 Issue：修复 Stop hooks 阻塞问题

## [1.0.0] - 2026-02-03

### Breaking Changes

⚠️ **重大变更**: Gemini 智能总结功能现默认关闭

本版本将 Gemini AI 智能总结功能从默认启用改为默认禁用，这是一个破坏性变更。

**变更原因**：

- 减少对外部 API 的依赖
- 提升任务完成通知的响应速度
- 降低网络请求失败导致的通知延迟

**迁移指南**：

如需继续使用 Gemini 智能总结功能，请设置环境变量：

```bash
export GEMINI_SUMMARY_ENABLED=true
```

### Changed

- **Gemini 总结功能开关**: 新增 `ENABLE_GEMINI_SUMMARY` 配置开关
  - 默认值：`false`（关闭 Gemini 总结）
  - 可通过环境变量 `GEMINI_SUMMARY_ENABLED=true` 启用
  - 开关位置：`scripts/task-complete-notifier.sh:8-11`

- **通知消息优化**: 简化任务完成通知的消息内容
  - 修改前：`非gemini总结：任务完成`
  - 修改后：`已完成任务`
  - 更简洁、更专业的通知文案

### Technical Details

#### 开关实现机制

```bash
# scripts/task-complete-notifier.sh

# ====== Gemini 总结功能开关 ======
# 设置为 true 启用 Gemini AI 智能总结，设置为 false 禁用
# 可通过环境变量 GEMINI_SUMMARY_ENABLED 覆盖此设置
ENABLE_GEMINI_SUMMARY="${GEMINI_SUMMARY_ENABLED:-false}"
```

#### 行为对比

| 场景        | v0.15.0                      | v1.0.0                               |
| ----------- | ---------------------------- | ------------------------------------ |
| 默认行为    | 调用 Gemini API 生成智能摘要 | 直接显示"已完成任务"                 |
| 立即通知    | "非 gemini 总结：任务完成"   | "已完成任务"                         |
| 启用 Gemini | 默认启用                     | 需设置 `GEMINI_SUMMARY_ENABLED=true` |
| 禁用 Gemini | 需修改脚本                   | 默认禁用                             |

### References

- 相关脚本：`scripts/task-complete-notifier.sh`
- 相关配置：环境变量 `GEMINI_SUMMARY_ENABLED`

## [0.15.0] - 2026-02-03

### Changed

- **Skill 重做**: `openspec` - OpenSpec 规范驱动开发助手技能 (v1.0.0)
  - **完全重写技能文档**，从 `@org-hex/openspec-chinese` 工具文档升级为基于 OPSX 工作流的 AI 辅助编程框架
  - **核心理念变更**：从工具使用指南转变为规范驱动开发框架
  - **新增核心原则**：
    - 流动而非僵化 - 随时处理任何工件，无阶段门控
    - 迭代而非瀑布 - 边构建边完善理解
    - 简单而非复杂 - 最小化设置和仪式
    - 棕地优先 - Delta 方式修改现有系统
  - **新增工作流模式**：
    - 快速功能流：`/opsx:new → /opsx:ff → /opsx:apply → /opsx:verify → /opsx:archive`
    - 探索式流程：`/opsx:explore → /opsx:new → /opsx:continue → ... → /opsx:apply`
    - 增量式流程：`/opsx:new → /opsx:continue (重复) → /opsx:apply → /opsx:archive`
  - **新增工件系统说明**：
    - 默认 Schema: spec-driven
    - 工件依赖关系：proposal → specs → design → tasks → implement
    - 工件状态转换：BLOCKED → READY → DONE
  - **新增 Delta Specs 格式规范**：ADDED/MODIFIED/REMOVED 标记系统
  - **新增项目配置说明**：config.yaml 配置项和 Schema 优先级
  - **新增自定义 Schema 创建指南**
  - **新增验证命令说明**：Completeness/Correctness/Coherence 三维度检查
  - **新增执行长任务注意事项**：主从代理调度、并行子代理等
  - **新增故障排除指南**
  - **更新斜杠命令列表**：完整的 `/opsx:*` 命令速查表
  - **更新 CLI 命令参考**

### Technical Details

#### openspec 技能 v1.0.0 主要变更

**v0.9.0 版本**（旧版）：

- 面向 `@org-hex/openspec-chinese` CLI 工具的使用指南
- 侧重于命令行操作和规格文档格式

**v1.0.0 版本**（新版）：

- 完整的规范驱动开发框架文档
- 包含工作流、工件系统、配置和自定义 Schema
- 更强调开发理念和最佳实践
- 与 OpenSpec 官方 OPSX 工作流保持一致

### References

- OpenSpec 仓库: https://github.com/Fission-AI/OpenSpec
- OPSX 工作流文档: https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md

## [0.14.0] - 2026-02-01

### Added

- **新增 Skill**: `git-commit` - Git 提交助手技能
  - 位置：`skills/git-commit/`
  - 核心功能：
    - 创建高质量的 git 提交，引导用户审查、暂存和拆分变更
    - 强制使用 Conventional Commits 规范，并支持 Emoji
    - 提交信息必须使用中文编写
    - 自动查阅项目级 `commit-types.ts` 配置，确保 Emoji 和 Type 规范一致
  - 包含文件：
    - `SKILL.md` - 技能主文件，定义工作流程和规范
    - `references/commit-message-template.md` - 提交信息模板和 Emoji 对照表
  - 来源说明：该技能是 `agent-toolkit/skills/commit-work` 的中文改写版，适应本地化需求

### References

- Agent Skills 规范文档: https://agentskills.io/specification#metadata-field
- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills

## [0.13.4] - 2026-02-01

### Added

- **Skills 文档版本管理**: 为所有 skills 文档添加 `metadata.version` 字段
  - 遵循 Agent Skills 规范（https://agentskills.io/specification#metadata-field）
  - 版本号与插件商城版本保持同步
  - 涉及的 skills 文档：
    - `skills/openspec/SKILL.md`
    - `skills/init-prettier-git-hooks/SKILL.md`
    - `skills/init-claude-code-statusline/SKILL.md`
    - `skills/init-ai-md/SKILL.md`
    - `skills/nitro-api-development/SKILL.md`

### Changed

- **版本升级操作规范增强**: 更新 `claude-code-marketplace` 项目级别技能文档
  - 新增"Skills 文档的 metadata.version 字段"章节，明确需要更新的 skills 文档列表
  - 更新"升级流程步骤"，增加同步更新 skills 文档版本号的要求
  - 更新"验证一致性"步骤，增加 skills 文档版本号一致性检查
  - 更新示例，展示完整的版本升级流程
  - 更新注意事项，强调 skills 文档同步的重要性

### References

- Agent Skills 规范文档: https://agentskills.io/specification#metadata-field
- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills

## [0.13.3] - 2026-01-28

### Changed

- **Hooks 优化**: 进一步精简钩子配置
  - 移除了 `UserPromptSubmit` 中的 `claude-notifier check-and-notify` 调用
  - **原因**: 深度分析日志发现，在 Gemini 等模型下，`UserPromptSubmit` 与 `Stop` 事件之间存在竞态条件。当用户高频交互时，任务清理脚本尚未执行完毕，下一次交互的 `UserPromptSubmit` 就会触发 `check-and-notify`，导致其读取到旧的任务文件并误报"长任务已运行"。移除此检查点彻底解决了"时长计数错误"和"频繁通知"的问题，仅保留 `SessionStart` 和 `SessionEnd` 作为必要的定时检查点。

## [0.13.2] - 2026-01-28

### Changed

- **Hooks 优化**: 移除了 `PreToolUse` 钩子
  - 移除了在每次工具调用前执行 `claude-notifier check-and-notify` 的配置
  - **原因**: 在使用 Gemini 等模型时，高频的工具调用会导致钩子被频繁触发，产生大量干扰性的 "Running PreToolUse hooks..." 提示，且该检查在 `UserPromptSubmit` 和 `SessionStart` 中已有覆盖，移除后不影响定时提醒功能，但能显著提升交互体验。

### Fixed

- **任务清理逻辑增强**: 优化 `task-complete-notifier.sh` 中的任务删除逻辑
  - 改进了 Monorepo 根目录的查找算法，优先使用 `CLAUDE_PROJECT_DIR` 环境变量
  - 增加了更详细的调试日志，帮助排查任务无法删除导致的 "时长计数错误" 问题
  - 解决了在 Gemini 模型下可能因路径解析失败导致任务文件残留，进而引发通知混乱的问题

## [0.13.1] - 2026-01-28

### Added

- **状态栏增强**: 状态栏脚本增加了新的计费字段统计
  - 在 `init-claude-code-statusline` 技能的 `statusline.sh` 模板中
  - 新增计费统计显示块，帮助用户更直观地监控 API 使用成本

## [0.13.0] - 2026-01-27

### Added

- **新增 Skill**: `nitro-api-development` - Nitro v3 接口开发技能规范
  - 位置：`skills/nitro-api-development/`
  - 用于指导使用 Nitro v3 框架编写服务端接口，包括项目初始化、配置、接口编写规范等完整流程
  - 适用场景：
    - 纯后端 Nitro 项目初始化
    - Vite 项目全栈化（赋予 Vite 项目服务端能力）
    - 接口开发与维护
  - 核心规范：
    - 导入来源必须是 `nitro/h3` 而非 `h3`
    - 使用 `defineHandler` 而非 `defineEventHandler`
    - 统一的响应格式 `{ success, message, data }`
  - 包含三个文档：
    - `SKILL.md` - 主技能规范文档，包含完整的开发规范和检查清单
    - `templates.md` - 项目初始化代码模板集合
    - `reference.md` - 函数速查、配置选项和常用类型参考手册

### References

- Nitro v3 官方文档: https://v3.nitro.build/

## [0.12.0] - 2026-01-27

### Changed

- **Skill 重大增强**: `init-ai-md` - AI 记忆文件初始化和增量更新技能
  - **新增交互选择功能**：
    - 新增步骤 2「扫描分析」：扫描目标文件的二级标题，建立现存记忆项清单；扫描 templates 目录，建立可用记忆项清单
    - 新增步骤 3「交互选择」：使用 `AskUserQuestion` 工具的 `multiSelect: true` 模式，让用户选择需要处理的记忆项
    - 选项状态标注：`[缺失]`（目标文件中不存在）、`[需更新]`（存在但内容不完整）、`[已完整]`（内容一致）
  - **改进差异对比策略**：
    - 将原来的「智能合并策略」改为「差异对比与增量补全」
    - 逐行对比原则：深度阅读并逐行/逐段落对比文本差异
    - 识别差异类型：缺失行、缺失段落、缺失子标题、内容差异
    - 增量补全策略：仅补全缺失内容，保持用户自定义内容不变
  - **新增核心原则**：
    - 交互优先：处理前必须与用户交互确认，不得自动全量处理
    - 增量补全：仅补全缺失内容，不全量替换
    - 保护自定义：用户自定义内容不得被覆盖
    - 禁止脚本：不得使用任何脚本进行批处理
  - **新增禁止事项清单**：
    - 禁止未经用户选择直接处理所有记忆项
    - 禁止使用 Python/TypeScript/Shell 等脚本批量处理
    - 禁止一股脑复制粘贴整个模板文件内容
    - 禁止覆盖用户在 CLAUDE.md 中的自定义内容
    - 禁止跳过交互选择步骤直接执行更新
  - **新增执行示例**：场景 3「差异对比补全示例」，演示完整的差异识别和补全流程
  - **新增详细说明**：AskUserQuestion 调用规范、选项状态标注规则、用户选择后的处理

### Technical Details

#### init-ai-md 技能执行流程变更

**v0.11.0 流程**（4 步骤）：

1. 检查 CLAUDE.md 文件
2. 读取模板文件
3. 智能合并策略（相似度检测 + 替换/插入）
4. 同步其他 AI 记忆文件

**v0.12.0 流程**（5 步骤）：

1. 检查 CLAUDE.md 文件
2. **扫描分析**（新增）：扫描目标文件和模板目录，对比分析
3. **交互选择**（新增）：使用 AskUserQuestion 让用户选择
4. **差异对比与增量补全**（改进）：逐行对比，仅补全缺失
5. 同步其他 AI 记忆文件

#### 差异对比示例

假设目标文件 `CLAUDE.md` 中「获取技术栈对应的上下文」章节缺少部分内容：

```markdown
## 获取技术栈对应的上下文

### claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
```

模板文件包含完整内容：

```markdown
## 获取技术栈对应的上下文

在处理特定技术栈相关的问题时，你应该主动获取对应的上下文文档和最佳实践。

### claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档： https://agentskills.io/home
```

**正确处理方式**：识别并补全缺失的描述段落和「规范文档」链接，而非全量替换整个章节。

### References

- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills
- 技能最佳实践: https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- Agent Skills 规范: https://agentskills.io/home

## [0.11.0] - 2026-01-22

### Added

- **新增 Skill**: `init-claude-code-statusline` - Claude Code 状态栏配置初始化技能
  - 位置：`skills/init-claude-code-statusline/SKILL.md`
  - 用于在任何项目中快速初始化、更新或覆盖 Claude Code 状态栏配置
  - 配置文件：`.claude/settings.json` 和 `.claude/statusline.sh`
  - 状态栏显示内容：当前目录、Git 分支（🌿）、模型名称（🤖）、版本号、上下文窗口剩余百分比（🧠）
  - 上下文窗口颜色编码：绿色（>40%）、黄色（20%-40%）、红色（<20%）
  - 支持 jq 可用性检测和优雅降级
  - 当用户提及初始化状态栏、配置 Claude Code 状态栏等关键词时自动激活

- **新增 Skill**: `init-prettier-git-hooks` - Prettier + Git Hooks 格式化流程初始化技能
  - 位置：`skills/init-prettier-git-hooks/SKILL.md`
  - 用于在任何 Node.js 项目中快速搭建代码格式化和 git 钩子配置
  - 集成：`lint-staged` + `simple-git-hooks` + `prettier`
  - 模板文件：
    - `templates/prettier.config.mjs` - Prettier 配置（含 @prettier/plugin-oxc 和 prettier-plugin-lint-md）
    - `templates/lint-staged.config.js` - lint-staged 配置
    - `templates/simple-git-hooks.mjs` - git hooks 配置（pre-commit 和 commit-msg）
  - 提供完整的自检清单和工作流程说明

- **新增模板文件**: `skills/init-claude-code-statusline/templates/` 目录
  - `settings.json` - Claude Code 状态栏设置模板
  - `statusline.sh` - 状态栏 Bash 脚本模板（100 行，功能丰富）

### Changed

- **Skill 配置更新**: `init-ai-md` 技能启用用户主动调用
  - 添加 `user-invocable: true` 配置项
  - 用户现在可以通过 `/init-ai-md` 命令直接调用此技能

- **状态栏脚本优化**: 更新 `.claude/statusline.sh` 配置
  - 改进颜色代码定义，使用更清晰的 ANSI 256 色
  - 优化上下文窗口计算逻辑

### Technical Details

#### init-claude-code-statusline 技能执行流程

1. **检查目标目录**：确保 `.claude/` 目录存在
2. **处理 settings.json**：支持合并配置、全量覆盖或跳过
3. **处理 statusline.sh**：询问用户是否覆盖现有脚本
4. **验证配置**：确认文件格式正确

#### init-prettier-git-hooks 技能执行流程

1. **安装依赖**：`pnpm add -D prettier @prettier/plugin-oxc prettier-plugin-lint-md lint-staged simple-git-hooks commitlint`
2. **创建配置文件**：复制模板到项目根目录
3. **更新 package.json**：添加 `format` 和 `prepare` scripts
4. **初始化 Git Hooks**：运行 `npx simple-git-hooks`

#### 状态栏脚本功能

|  显示项目  | 图标 |              说明               |
| :--------: | :--: | :-----------------------------: |
|  当前目录  |  无  | 工作目录路径（~替换用户主目录） |
|  Git 分支  |  🌿  |        当前 Git 分支名称        |
|  模型名称  |  🤖  |     当前使用的 Claude 模型      |
|   版本号   |  v   |        Claude Code 版本         |
| 上下文窗口 |  🧠  |      剩余上下文窗口百分比       |

### References

- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills
- 技能最佳实践: https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- Agent Skills 规范: https://agentskills.io/home

## [0.10.0] - 2026-01-20

### Added

- **新增 Skill**: `init-ai-md` - AI 记忆文件初始化和增量更新技能
  - 位置：`skills/init-ai-md/SKILL.md`
  - 用于在项目中快速初始化和增量更新 AI 记忆文件（CLAUDE.md、AGENTS.md、GEMINI.md）
  - 将预设的通用提示词模板按顺序插入到记忆文件中
  - 支持检测现有内容相似度，智能合并或替换
  - 支持同步更新 AGENTS.md 和 GEMINI.md（需用户确认）
  - 当用户提及初始化记忆文件、更新 CLAUDE.md、同步 AI 记忆等关键词时自动激活

- **新增模板文件**: `skills/init-ai-md/templates/` 目录
  - `01.主动问询实施细节.md` - 引导 AI 主动询问用户实施细节
  - `02.编写测试用例规范.md` - Vitest 测试用例编写规范
  - `03.报告编写规范.md` - Markdown 报告编写规范
  - `04.生成发版日志的操作规范.md` - Changeset 发版日志规范及术语说明
  - `05.沟通协作要求.md` - 计划模式等协作要求
  - `99.获取技术栈对应的上下文.md` - 技术栈文档链接

### Technical Details

#### init-ai-md 技能执行流程

1. **检查 CLAUDE.md**：检测项目根目录是否存在，如无则先执行 `/init` 命令
2. **读取模板**：按数字前缀顺序（01→99）读取 templates 目录下的模板文件
3. **智能合并**：检测相似内容，决定替换或在现有二级目录之前插入
4. **同步确认**：检测 AGENTS.md/GEMINI.md，询问用户是否同步替换

#### 模板文件规范

- 模板文件只包含二级目录，不包含一级目录
- 文件命名格式：`XX.描述名称.md`（XX 为两位数字）
- 内容使用简体中文编写
- 便于直接插入到记忆文件中

### References

- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills
- 技能最佳实践: https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices

## [0.9.2] - 2026-01-05

### Fixed

- **🐞 Windows + WSL 环境下的 Hook 路径解析错误**: 修复了插件 hooks 在 Windows + WSL/Git Bash 环境下无法正确执行的关键问题
  - **问题原因**: hooks.json 中的命令使用了 `bash` 前缀，导致路径解析错误
    - 命令格式：`bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh`
    - `bash` 被解释为 `/usr/bin/bash`（WSL 或 Git Bash 的 bash）
    - `${CLAUDE_PLUGIN_ROOT}` 展开为 Windows 路径（`C:\Users\pc\.claude\plugins\cache\...`）
    - WSL bash 无法正确处理 Windows 路径与 Unix 路径的混用
  - **错误表现**:
    - `Plugin hook error: /usr/bin/bash: C:\Users\pc\.claude\plugins\cache\ruan-cat-tools\common-tools\0.9.1/scripts/task-complete-notifier.sh: No such file or directory`
    - Stop hook 和 UserPromptSubmit hook 完全无法执行
    - 插件的通知功能失效
  - **修复方案**: 移除 hooks 命令中的 `bash` 前缀
    - 修复前：`"command": "bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh"`
    - 修复后：`"command": "${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh"`
    - 脚本文件已有正确的 shebang (`#!/bin/bash`)，系统会自动使用正确的解释器
    - Claude Code 会正确处理 `${CLAUDE_PLUGIN_ROOT}` 环境变量的展开和路径转换
  - **影响的文件**:
    - `hooks/hooks.json:9` - Stop hook 的 task-complete-notifier.sh 调用
    - `hooks/hooks.json:20` - UserPromptSubmit hook 的 user-prompt-logger.sh 调用

### Technical Details

#### 路径解析问题分析

在 Windows + WSL/Git Bash 环境下，直接在命令中使用 `bash` 前缀会导致：

1. **解释器选择错误**：`bash` 被解析为 `/usr/bin/bash`，这是 WSL 或 Git Bash 的 bash，而不是 Windows 原生的 shell
2. **路径格式冲突**：`${CLAUDE_PLUGIN_ROOT}` 展开为 Windows 路径格式（`C:\...`），但 WSL bash 期望 Unix 路径格式（`/mnt/c/...` 或 `/c/...`）
3. **斜杠混用**：错误信息显示路径混用了反斜杠和正斜杠：`C:\Users\pc\.claude\plugins\cache\ruan-cat-tools\common-tools\0.9.1/scripts/...`

#### 为什么移除 bash 前缀能解决问题？

1. **系统自动选择解释器**：脚本文件以 `#!/bin/bash` 开头，当直接执行时，系统会根据 shebang 自动选择正确的解释器
2. **Claude Code 处理路径转换**：移除 `bash` 前缀后，Claude Code 会正确处理 `${CLAUDE_PLUGIN_ROOT}` 的展开，并根据当前环境自动转换路径格式
3. **跨平台兼容性**：这种方式在 Windows、macOS 和 Linux 上都能正常工作，无需特殊处理

#### Claude Code 环境变量说明

根据 Claude Code 官方文档，`${CLAUDE_PLUGIN_ROOT}` 是标准的环境变量：

- **Windows**: `C:\Users\<username>\.claude\plugins\cache\<marketplace>_<plugin-name>\<version>`
- **macOS/Linux**: `~/.claude/plugins/cache/<marketplace>_<plugin-name>/<version>`

这是获取插件根目录的**唯一正确方式**，在 hooks 和 MCP 配置中都应该使用此变量。

### References

- Claude Code Plugins Reference: https://code.claude.com/docs/en/plugins-reference.md#environment-variables
- Claude Code Hooks Reference: https://code.claude.com/docs/en/hooks.md#plugin-hooks
- 修复的文件：`hooks/hooks.json`（第 9 行和第 20 行）

## [0.9.1] - 2025-12-20

### Changed

- **SubagentStop 钩子移除**: 删除了 SubagentStop 钩子配置
  - 移除了 `claude-notifier check-and-notify` 在 SubagentStop 事件中的执行
  - 简化了钩子配置，避免潜在的重复通知
  - 相关文件：`hooks/hooks.json`（第 64-76 行）

## [0.9.0] - 2025-12-11

### Added

- **新增 Skill**: `openspec` - OpenSpec 中文版规范助手技能
  - 位置：`skills/openspec/SKILL.md`
  - 帮助用户使用 OpenSpec 中文版（`@org-hex/openspec-chinese`）工具
  - 提供项目初始化、创建提案、编写规格文档的完整指导
  - 包含规格文档格式要求（Delta 分区、Requirement 语句、Scenario 场景）
  - 提供常用命令速查和问题排查指南
  - 支持规格全生命周期流程管理
  - 当用户提及 `openspec`、规范文档、需求管理等关键词时自动激活

### Changed

- **插件结构优化**: 新增 `skills/` 目录用于存放技能文件
- **文档优化**: 在 README.md 中新增 Skills 部分，说明 OpenSpec 规范助手技能

## [0.8.4] - 2025-11-28

### Added

- **新增 Agent**: `add-git-mcp` - 用于在 `.mcp.json` 文件内配置满足 git-mcp 格式的 MCP 服务器
  - 支持通过 GitHub 仓库地址自动生成 git-mcp 配置
  - 实现对 GitHub 仓库源码和文件的精准索引，避免代码幻觉
  - 提供标准化的 MCP 服务器命名格式：`gitmcp__{repo}__{owner}`
  - 支持命令行和手动配置两种添加方式

### Changed

- **插件配置更新**: 在 `plugin.json` 中新增 `add-git-mcp.md` agent 引用
- **文档优化**: 更新 README.md 中的 agents 列表，包含新增的 git-mcp 配置代理

## [0.8.3] - 2025-11-20

### Changed

- **项目根目录检测逻辑优化**: 优化了 `task-complete-notifier.sh` 脚本中的项目根目录检测逻辑
  - 将项目根目录检测逻辑移动到脚本前面，在立即通知阶段就完成检测
  - 避免了在脚本末尾重复执行相同的检测逻辑
  - 添加了 `Detected project directory: $PROJECT_DIR` 日志记录，便于调试
  - 提升了脚本执行效率，减少了重复代码

## [0.8.2] - 2025-11-20

### Changed

- **通知超时时间优化**: 调整通知弹框的超时时间以确保完整显示
  - 立即通知超时：1s → 8s（`task-complete-notifier.sh:90`）
  - Gemini 总结后通知超时：2s → 8s（`task-complete-notifier.sh:301`）
  - Stop 钩子总超时：20s → 45s（`hooks.json:10`）
  - 脚本全局超时：18s → 43s（`task-complete-notifier.sh:11`）
  - **原因**: 通知弹框从打开到完全关闭至少需要 8 秒
  - **效果**: 确保通知有足够时间完整显示，不会被过早中断

## [0.8.1] - 2025-11-20

### Fixed

- **🐞 修复 Stop hooks 的 stdin 超时中止问题**: 彻底解决了 `● Stop hook failed: The operation was aborted` 的持续性故障
  - **核心问题**: Stop hooks 中第二个钩子 `claude-notifier task-complete` 与第一个钩子存在 stdin 竞争
    - 第一个钩子（`task-complete-notifier.sh`）已经消费了所有 stdin 数据
    - 第二个钩子虽然不需要 stdin，但在某些情况下等待超时
    - 两个钩子串行执行，总耗时接近或超过 Claude Code 的容忍范围
  - **解决方案**:
    1. 将第二个钩子的通知功能整合到 `task-complete-notifier.sh` 开头
    2. 添加立即通知（1 秒超时），在 Gemini 总结前发送
    3. 删除 hooks.json 中多余的第二个钩子
  - **修复效果**:
    - ✅ 消除 stdin 竞争，不再有多个钩子争抢输入流
    - ✅ 避免重复通知（原第二个钩子会导致双重通知）
    - ✅ 缩短总执行时间，不再超时中止
    - ✅ 保留双重通知体验（立即通知 + Gemini 智能总结）
  - **相关文件**:
    - 修改：`scripts/task-complete-notifier.sh`（新增立即通知逻辑）
    - 修改：`hooks/hooks.json`（删除第二个 Stop 钩子）

### Changed

- **Stop hooks 通知机制优化**: 重新设计通知流程，提升用户体验
  - 立即通知（~1 秒内）: "非 gemini 总结：任务完成"（快速反馈）
  - Gemini 总结（~5-15 秒后）: 智能生成的任务摘要（详细描述）
  - 单一钩子内完成所有通知逻辑，避免进程间竞争

### Technical Details

#### 问题机制分析

**修复前的配置**（存在 stdin 竞争）：

```json
"Stop": [
  {
    "hooks": [
      {"command": "bash .../task-complete-notifier.sh", "timeout": 20},  // 消费 stdin
      {"command": "claude-notifier task-complete ...", "timeout": 5}     // stdin 已空，可能超时
    ]
  }
]
```

**修复后的配置**（单一钩子，无竞争）：

```json
"Stop": [
  {
    "hooks": [
      {"command": "bash .../task-complete-notifier.sh", "timeout": 20}  // 内部完成所有通知
    ]
  }
]
```

#### 新增的立即通知逻辑

在 `task-complete-notifier.sh` 第 81-104 行新增：

```bash
# ====== 立即发送初始通知（无需等待 Gemini） ======
log "====== Sending Immediate Notification ======"
log "发送立即通知: 非gemini总结：任务完成"

IMMEDIATE_START=$(date +%s)

# 同步调用，1 秒超时
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  timeout 1s claude-notifier task-complete --message "非gemini总结：任务完成" 2>&1 || {
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 124 ]; then
      echo "⚠️ Immediate notifier timed out (1s)"
    else
      echo "⚠️ Immediate notifier failed with exit code $EXIT_CODE"
    fi
  }
) >> "$LOG_FILE"

IMMEDIATE_END=$(date +%s)
IMMEDIATE_DURATION=$((IMMEDIATE_END - IMMEDIATE_START))

log "立即通知已发送，耗时: ${IMMEDIATE_DURATION}s"
```

#### 执行流程对比

**修复前**（双钩子，存在竞争）：

```plain
Stop Event
    ↓
Hook 1: task-complete-notifier.sh (读取 stdin)
    ├─ 读取 stdin ✅
    ├─ Gemini 总结 (~5-15s)
    └─ 发送通知
    ↓
Hook 2: claude-notifier task-complete
    ├─ 尝试读取 stdin ❌（已空）
    ├─ 可能等待超时
    └─ 发送通知（重复！）
    ↓
总耗时: 20+ 秒，可能超时中止
```

**修复后**（单钩子，无竞争）：

```plain
Stop Event
    ↓
Hook 1: task-complete-notifier.sh
    ├─ 读取 stdin ✅
    ├─ 立即通知 (~1s) ✅
    ├─ Gemini 总结 (~5-15s)
    └─ Gemini 通知 ✅
    ↓
总耗时: ~6-16 秒，稳定完成
```

### References

- 问题分析：本次对话中的详细排查
- 修复脚本：
  - `scripts/task-complete-notifier.sh`（第 81-104 行：新增立即通知）
  - `hooks/hooks.json`（第 4-14 行：删除第二个钩子）

## [0.8.0] - 2025-11-19

### Fixed

- **🔧 修复 Stop hooks 的 stdin 竞争问题**: 解决了任务删除失败和重复通知的根本原因
  - **核心问题**: 多个钩子竞争读取单一 stdin 流，导致 `check-and-notify` 无法获取事件数据
  - **解决方案**:
    1. 创建 `remove-task.ts` 脚本用于直接删除任务（不依赖 stdin）
    2. 在 `task-complete-notifier.sh` 中添加任务删除逻辑
    3. 从 Stop hooks 中移除 `check-and-notify`（避免 stdin 竞争）
  - **修复文件**:
    - 新增：`packages/claude-notifier/src/scripts/remove-task.ts`
    - 修改：`scripts/task-complete-notifier.sh`（添加删除任务逻辑）
    - 修改：`hooks/hooks.json`（移除 Stop 中的 check-and-notify）
  - **效果**:
    - ✅ 任务完成后正确删除，不再产生误报通知
    - ✅ Stop hooks 不再超时或失败
    - ✅ 避免 6 分钟、10 分钟的错误长任务提醒

### Changed

- **Stop hooks 架构优化**: 重新设计 Stop hooks 的钩子组成
  - 移除：`claude-notifier check-and-notify`（避免 stdin 竞争）
  - 保留：`task-complete-notifier.sh`（读取 stdin，生成总结，删除任务）
  - 保留：`claude-notifier task-complete`（发送独立通知）
  - 环境变量支持：`check-and-notify` 新增环境变量降级策略（`CLAUDE_CWD`, `CLAUDE_HOOK_EVENT`）

### Breaking Changes

⚠️ **重要变更**: Stop hooks 配置方式变更

**旧配置**（v0.7.3 及之前）：

```json
"Stop": [
  {
    "hooks": [
      {"command": "bash .../task-complete-notifier.sh", "timeout": 20},
      {"command": "claude-notifier task-complete ...", "timeout": 5},
      {"command": "claude-notifier check-and-notify", "timeout": 5}  // ❌ 已移除
    ]
  }
]
```

**新配置**（v0.8.0）：

```json
"Stop": [
  {
    "hooks": [
      {"command": "bash .../task-complete-notifier.sh", "timeout": 20},
      {"command": "claude-notifier task-complete ...", "timeout": 5}
    ]
  }
]
```

**迁移指南**:

- 如果你自定义了 Stop hooks 配置，请**移除** `claude-notifier check-and-notify`
- `task-complete-notifier.sh` 现在会自动删除任务，无需额外配置
- 其他 hooks（UserPromptSubmit, PreToolUse 等）仍保留 `check-and-notify`

### Technical Details

#### stdin 竞争问题分析

**问题机制**：

1. Claude Code 向每个钩子传递相同的 stdin 数据
2. Node.js stdin 流只能被消费一次（流式读取特性）
3. 第一个钩子（`task-complete-notifier.sh`）读取 stdin 成功
4. 第三个钩子（`check-and-notify`）尝试读取 stdin，但流已被消费
5. `readHookInput()` 500ms 超时后返回 `null`
6. `check-and-notify` 提前返回，删除任务的代码永远不会执行

**新架构**：

```plain
Stop Event
    ↓
┌─────────────────────────────────────────────────────┐
│ Hook 1: task-complete-notifier.sh                  │
│   ✅ 读取 stdin（Session ID, Transcript Path）       │
│   ✅ 提取对话上下文（transcript-reader.ts）          │
│   ✅ 生成 Gemini 总结                                │
│   ✅ 删除任务（tsx remove-task.ts）                  │
├─────────────────────────────────────────────────────┤
│ Hook 2: claude-notifier task-complete              │
│   ✅ 发送独立通知（不依赖 stdin）                    │
└─────────────────────────────────────────────────────┘
```

**对比旧架构**：

- ❌ 第三个钩子无法读取 stdin → 任务无法删除 → 误报通知
- ✅ 现在只有一个钩子读取 stdin → 避免竞争 → 任务正确删除

### References

- 详细分析：`docs/reports/2025-11-19-stop-hooks-failure-analysis.md`
- 修复脚本：
  - `packages/claude-notifier/src/scripts/remove-task.ts`（新增）
  - `scripts/task-complete-notifier.sh`（修改）
  - `hooks/hooks.json`（修改）

## [0.7.3] - 2025-11-19

### Fixed

- **🐞 修复 Stop hooks 超时导致的中止错误**: 解决了 `● Stop hook failed: The operation was aborted` 的核心问题
  - **问题原因**:
    - `task-complete-notifier.sh` 中的 `claude-notifier` 以后台进程运行（`&`）
    - 在 Windows 环境下，后台子进程未被完全清理
    - 脚本退出时遗留的进程导致 Claude Code 钩子系统超时
  - **修复方案**:
    1. **改为同步调用**: 移除后台运行 `&`，直接执行并等待完成
    2. **新增进程清理函数**: `cleanup_processes()` 强制终止所有子进程
       - 使用 `pgrep -P $$` 查找子进程，`kill -9` 强制终止
       - Windows 特定：使用 `pkill -9 -f "claude-notifier"` 清理残留
    3. **三重清理保障**:
       - 执行后立即清理（notifier 运行完毕）
       - 脚本退出前再次清理（确保无残留）
       - 错误捕获时清理（trap ERR EXIT）
    4. **优化超时时间**: notifier timeout 从 3s 降到 2s（更激进）
  - **效果**: Stop hooks 不再超时，所有 3 个钩子都能正常完成
  - **相关文件**: `scripts/task-complete-notifier.sh:50-65, 260-297, 304-307`

### Changed

- **进程管理策略优化** (`task-complete-notifier.sh`):
  - 后台进程 `(timeout 3s claude-notifier ...) &` → 同步调用 `(timeout 2s claude-notifier ...)`
  - 移除复杂的进程等待逻辑（不再需要 wait、kill -0 检查）
  - 简化脚本结构，提升可靠性

### Technical Details

#### 修复前的问题

**后台进程管理**（第 253-307 行）：

```bash
# 后台运行
(timeout 3s claude-notifier ...) &
NOTIFIER_PID=$!

# 尝试等待 4 秒，检查进程状态
for i in $(seq 1 20); do
  if ! kill -0 $NOTIFIER_PID 2>/dev/null; then
    break
  fi
  sleep 0.2
done

# 非阻塞等待（可能遗留子进程）
wait $NOTIFIER_PID 2>/dev/null || true
```

**问题**：

- Windows Git Bash 环境下，`wait` 可能无法正确等待子进程
- `timeout` 命令的子进程清理不彻底
- 脚本退出时，后台进程可能仍在运行

#### 修复后的实现

**同步调用 + 强制清理**：

```bash
# 1. 新增清理函数
cleanup_processes() {
  # 清理所有子进程
  if command -v pgrep &> /dev/null; then
    CHILD_PIDS=$(pgrep -P $$ 2>/dev/null || true)
    if [ -n "$CHILD_PIDS" ]; then
      kill -9 $CHILD_PIDS 2>/dev/null || true
    fi
  fi

  # Windows 特定清理
  if [ "$(uname -o 2>/dev/null || echo '')" = "Msys" ] || [ -n "${WINDIR:-}" ]; then
    pkill -9 -f "claude-notifier" 2>/dev/null || true
  fi
}

# 2. 错误捕获
trap 'cleanup_processes; log "Script interrupted..."; exit 0' ERR EXIT

# 3. 同步调用（不用 &）
(timeout 2s claude-notifier ...) >> "$LOG_FILE"

# 4. 立即清理
cleanup_processes

# 5. 退出前再次清理
cleanup_processes
echo "$OUTPUT_JSON"
exit 0
```

#### 清理保障机制

| 清理时机     | 触发条件          | 代码位置                  |
| ------------ | ----------------- | ------------------------- |
| 执行后清理   | notifier 运行完毕 | 第 295 行                 |
| 退出前清理   | 脚本正常退出      | 第 306 行                 |
| 错误捕获清理 | 脚本异常/中断     | trap ERR EXIT（第 67 行） |

#### Windows 环境特殊处理

Windows Git Bash (MSYS) 环境下的进程管理问题：

- 子进程可能不会被父进程的 `wait` 正确回收
- `timeout` 命令的实现与 Linux 不同
- 需要额外使用 `pkill -f` 按名称强制清理

**检测逻辑**：

```bash
if [ "$(uname -o 2>/dev/null || echo '')" = "Msys" ] || [ -n "${WINDIR:-}" ]; then
  pkill -9 -f "claude-notifier" 2>/dev/null || true
fi
```

### Testing

验证修复效果的方法：

1. **观察钩子执行**：不应再出现 `running stop hooks… 3/4` 卡住
2. **检查日志**：查看 `/tmp/claude-code-task-complete-notifier-logs/` 最新日志
   - 应该看到 `Cleanup verified` 和 `All child processes terminated`
   - notifier 应该在 2 秒内完成
3. **检查进程残留**：
   ```bash
   ps aux | grep claude-notifier  # 应该无残留进程
   ```

### References

- 问题排查：本次对话中的详细分析
- 修复脚本：`scripts/task-complete-notifier.sh`
- 相关日志：`/tmp/claude-code-task-complete-notifier-logs/2025-11-19__21-42-27__*.log`（旧版本）

## [0.7.2] - 2025-11-19

### Fixed

- **🐞 修复 `check-and-notify` 在 Stop 事件的逻辑错误**
  - **问题**: 当 hookInput 为 null 时，仍然执行后续逻辑，导致不必要的处理
  - **修复**: 添加提前返回逻辑，当 hookInput 为 null 时立即返回，避免执行无效操作
  - **效果**: 提升 Stop hooks 的执行性能和稳定性
  - **相关包**: `@ruan-cat/claude-notifier@0.8.2`

### Changed

- **Stop hooks 配置优化** (`hooks.json`):
  - 调整钩子执行顺序：`check-and-notify` 现在在 `task-complete-notifier.sh` 之前执行
  - 移除 `cleanup-orphan-processes.sh`（已不再需要）

### Removed

- **移除进程清理脚本**: 删除 `cleanup-orphan-processes.sh`
  - `@ruan-cat/claude-notifier` 的改进已解决进程清理问题
  - 简化 Stop hooks 配置，减少不必要的复杂性

## [0.7.1] - 2025-11-19

### Fixed

- **🐞 修复 Stop hooks 超时和逻辑错误**
  - **问题 1**: `check-and-notify` 在 Stop 事件时执行了错误的逻辑
    - **原因**: 代码要求 `stop_hook_active === true`，但 Claude Code 传递的值总是 `false`
    - **影响**: Stop 事件时没有删除任务，反而执行了"清理和通知"逻辑
    - **修复**: 移除对 `stop_hook_active === true` 的判断，只要是 Stop/SubagentStop 事件就删除任务
    - **相关包**: `@ruan-cat/claude-notifier@0.8.1`

  - **问题 2**: `cleanup-orphan-processes.sh` 执行超时（14 秒 > 10 秒 timeout）
    - **原因**: PowerShell 查找到 52 个长时间运行的 npx 进程，逐个尝试杀死，每次失败都耗费时间
    - **优化**:
      1. 限制最多处理 10 个进程（`Select-Object -First 10`）
      2. 使用后台并行执行 `taskkill`，不等待每个命令输出
      3. 只等待 1 秒让 taskkill 完成
    - **效果**: 执行时间从 14 秒降低到 3-5 秒
    - **配置**: timeout 从 10 秒增加到 15 秒（保险起见）

### Changed

- **Stop hooks 配置调整** (`hooks.json`):
  - `cleanup-orphan-processes.sh` 的 timeout: `10` → `15` 秒

- **性能优化** (`cleanup-orphan-processes.sh`):
  - 预期清理时间: `8` → `6` 秒
  - 批量并行处理进程，显著提升效率

## [0.7.0] - 2025-11-19

### Fixed

- **🐞 进程堆积问题**: 修复了高强度使用钩子后导致大量 node/npx 进程堆积的严重性能问题
  - **问题原因**:
    1. `PostToolUse` 钩子触发频率过高，每次工具调用都会启动新进程
    2. 所有钩子使用 `pnpm dlx` 每次都下载包，创建多个进程链
    3. 后台进程管理使用强制 `kill`，导致子进程变成孤儿进程
    4. Windows 平台的 `timeout` 命令无法正确清理进程树
  - **影响范围**:
    - 使用 100 次工具 = ~200 次 `pnpm dlx` 调用
    - 任务管理器显示大量僵尸 node.exe/npx.exe 进程
    - 系统性能下降，内存占用增加
  - **修复方案**:
    1. ✅ 移除 `PostToolUse` 钩子（保留 `PreToolUse`）
    2. ✅ 所有钩子改用预安装的全局包 `claude-notifier`
    3. ✅ 改进后台进程管理，不再强制 kill
    4. ✅ 新增进程清理脚本 `cleanup-orphan-processes.sh`

### Added

- **进程清理脚本**: 新增 `cleanup-orphan-processes.sh`
  - 自动检测并清理孤儿 node/npx 进程
  - 支持 Windows 和 Unix-like 系统
  - 针对性清理 claude-notifier、gemini、长时间运行的 npx 进程
  - 在 Stop 钩子中自动调用，确保进程不堆积

### Changed

- **钩子配置优化**:
  - ❌ 移除 `PostToolUse` 钩子（触发频率过高）
  - ✅ 保留 `PreToolUse` 钩子
  - 🔄 所有钩子命令从 `pnpm dlx @ruan-cat/claude-notifier@latest` 改为 `claude-notifier`
  - ➕ Stop 钩子新增清理脚本调用

- **后台进程管理改进** (`task-complete-notifier.sh`):
  - 使用预安装的 `claude-notifier` 而非 `pnpm dlx`
  - 不再强制 kill 进程，让 `timeout` 命令自然处理超时
  - 优化超时时间：5 秒 → 3 秒
  - 改进的等待策略，避免创建孤儿进程

### Breaking Changes

⚠️ **需要手动安装全局依赖**

本版本改用预安装的全局包，使用前必须安装：

```bash
# 必需：安装 claude-notifier
pnpm add -g @ruan-cat/claude-notifier
# 或使用 npm
npm install -g @ruan-cat/claude-notifier

# 必需：安装 tsx
pnpm add -g tsx

# 可选：安装 gemini（用于 AI 摘要）
npm install -g @google/generative-ai-cli
```

验证安装：

```bash
claude-notifier --version
tsx --version
gemini --version  # 可选
```

### Performance

**性能提升**:

- 进程创建减少 ~50%（移除 PostToolUse）
- 僵尸进程几乎为 0（自动清理）
- 响应速度更快（使用预安装包）

### Technical Details

#### 修复前后对比

**修复前** (hooks.json):

```json
{
	"PostToolUse": [{ "command": "pnpm dlx @ruan-cat/claude-notifier@latest ..." }],
	"PreToolUse": [{ "command": "pnpm dlx @ruan-cat/claude-notifier@latest ..." }]
}
```

- 每次工具调用 = 2 次 `pnpm dlx` = ~4-6 个进程

**修复后**:

```json
{
	"PreToolUse": [{ "command": "claude-notifier ..." }],
	"Stop": [{ "command": "bash .../task-complete-notifier.sh" }, { "command": "bash .../cleanup-orphan-processes.sh" }]
}
```

- PreToolUse: 1 次轻量级调用
- Stop: 自动清理孤儿进程

#### 进程管理改进

**修复前** (task-complete-notifier.sh:248-274):

```bash
# 后台运行，然后强制 kill
pnpm dlx ... &
NOTIFIER_PID=$!
# 6 秒后
kill $NOTIFIER_PID  # ❌ 只杀父进程，子进程变孤儿
```

**修复后**:

```bash
# 使用预安装包 + timeout 自然超时
timeout 3s claude-notifier ... &
# 不再强制 kill，让 timeout 处理
# cleanup-orphan-processes.sh 会清理残留
```

### References

- 问题分析：`.github/prompts/index.md` (任务截图和排查过程)
- 修复的脚本：
  - `hooks/hooks.json` (移除 PostToolUse，改用全局包)
  - `scripts/task-complete-notifier.sh` (改进进程管理)
  - `scripts/cleanup-orphan-processes.sh` (新增)

## [0.6.7] - 2025-11-19

### Fixed

- **🐞 Plugin Hooks 重复加载错误**: 修复了 `Duplicate hooks file detected` 错误
  - **问题原因**: Claude Code 会自动加载标准位置的 `hooks/hooks.json`，无需在 `plugin.json` 中显式引用
  - **错误表现**:
    - `Hook load failed: Duplicate hooks file detected`
    - 插件加载失败，所有 hooks 功能无法使用
  - **修复方案**: 删除 `plugin.json` 中的 `"hooks": "./hooks/hooks.json"` 配置
  - **技术说明**:
    - Claude Code 插件系统会**自动加载** `hooks/hooks.json`
    - `plugin.json` 的 `hooks` 字段仅用于引用**额外的** hooks 文件（非标准位置）
    - 引用标准位置的 hooks 文件会导致重复加载

## [0.6.6] - 2025-11-17

### Added

- **新增 Agent**: `migrate-iconify-use-pure-admin` - 用于将 pure-admin 的 iconify 图标方案迁移到任意 vite+vue3 项目
  - 帮助项目快速集成在线和离线的 iconify 图标系统
  - 提供完整的迁移指南和最佳实践建议
  - 支持离线图标预加载、在线图标和 useRenderIcon Hook

## [0.6.5] - 2025-11-17

### Fixed

- **🐞 Hook 输出格式兼容性问题**: 修复了 Claude Code 版本升级后导致的 `● Stop hook failed: The operation was aborted` 错误
  - **问题原因**: Claude Code 新版本改变了 Hook 输出格式规范
    - **旧格式**: 使用 `{"decision": "approve"}` 表示允许继续
    - **新规范**: `decision` 字段只接受 `"block"` 或不设置（undefined）
    - **结果**: 使用 `"approve"` 导致 hook 被中止并报错
  - **影响范围**:
    - `task-complete-notifier.sh` (Stop hook): 2 处返回格式错误
    - `user-prompt-logger.sh` (UserPromptSubmit hook): 1 处返回格式错误
    - 所有使用这些 hooks 的功能都会失败
  - **修复方案**: 更新为符合新规范的输出格式
    - 错误陷阱: `{"decision": "approve"}` → `{}`（空 JSON）
    - 正常输出: `{"decision": "approve", "additionalContext": "..."}` → `{"continue": true, "stopReason": "..."}`
    - UserPromptSubmit: `{"decision": "approve"}` → `{}`

### Technical Details

#### Hook 输出格式规范变更

根据 Claude Code 最新文档（https://code.claude.com/docs/en/hooks.md）：

**Stop/SubagentStop 事件**:

```json
{
  "decision": "block" | undefined,  // 只接受 "block" 或不设置
  "reason": "阻塞原因"               // decision 为 "block" 时必需
}
```

**通用字段**（所有事件适用）:

```json
{
	"continue": true, // 明确指示是否继续执行
	"stopReason": "string" // 可选的停止原因说明
}
```

**要点**:

- ❌ `"approve"` 和 `"proceed"` 不再是有效的 decision 值
- ✅ 允许继续时应该不设置 `decision` 字段，或使用 `{"continue": true}`
- ✅ 返回空 JSON `{}` 或 exit code 0 也表示允许继续

#### 修复前后对比

**修复前** (task-complete-notifier.sh:48, 259):

```bash
# 错误陷阱
trap 'echo "{\"decision\": \"approve\"}"; exit 0' ERR EXIT  # ❌

# 正常输出
OUTPUT_JSON="{\"decision\": \"approve\", \"additionalContext\": \"✅ 任务总结: ${SUMMARY}\"}"  # ❌
```

**修复后**:

```bash
# 错误陷阱
trap 'echo "{}"; exit 0' ERR EXIT  # ✅ 返回空 JSON

# 正常输出
OUTPUT_JSON="{\"continue\": true, \"stopReason\": \"✅ 任务总结: ${SUMMARY}\"}"  # ✅ 使用新格式
```

**修复前** (user-prompt-logger.sh:60):

```bash
echo "{\"decision\": \"approve\"}"  # ❌
```

**修复后**:

```bash
echo "{}"  # ✅ 返回空 JSON，允许继续处理
```

### Testing

修复后应该验证：

1. Stop hook 正常执行，不再出现 "operation was aborted" 错误
2. UserPromptSubmit hook 正常执行
3. 任务完成通知功能正常工作
4. Gemini 总结功能正常工作
5. 日志正常记录

### References

- Claude Code Hooks 文档: https://code.claude.com/docs/en/hooks.md
- 修复的脚本:
  - `scripts/task-complete-notifier.sh` (2 处修复)
  - `scripts/user-prompt-logger.sh` (1 处修复)

## [0.6.4] - 2025-11-07

### Changed

- **任务总结提示词优化**: 新增强制中文输出要求，确保 Gemini 生成的任务摘要始终使用中文，避免出现英文或其他语言

## [0.6.3] - 2025-11-07

### Fixed

- **🐞 对话历史解析格式错误**: 修复了 transcript-reader.ts 无法正确解析 Claude Code transcript.jsonl 文件格式的关键问题
  - **问题原因**: 解析逻辑期望的消息格式与 Claude Code 实际生成的格式不匹配
    - **期望格式**: 每行直接是 `{role: "user", content: "..."}`
    - **实际格式**: 每行是 `{type: "user", message: {role: "user", content: "..."}}`
  - **影响范围**:
    - `analyzeConversation` 函数无法找到任何有效消息
    - `userMessages` 和 `assistantMessages` 数组始终为空
    - `generateSummary` 总是返回默认值 "任务处理完成"
    - 钩子无法提取有效的对话上下文供 Gemini 使用
  - **修复方案**:
    1. 新增 `TranscriptLine` 接口定义真实的 JSONL 格式
    2. 修改 `readTranscript` 函数正确解析嵌套的消息结构
    3. 只提取 `type === "user"` 或 `type === "assistant"` 的行
    4. 从 `transcriptLine.message` 中获取真正的消息对象

### Technical Details

#### 修复前的解析逻辑

```typescript
// 错误：直接解析为 Message，期望顶层就有 role 字段
const msg = JSON.parse(line) as Message;
messages.push(msg);

// analyzeConversation 检查
if (msg.role === "user") { ... }  // ❌ role 不在顶层
```

#### 修复后的解析逻辑

```typescript
// 正确：先解析为 TranscriptLine，再提取嵌套的 message
const transcriptLine = JSON.parse(line) as TranscriptLine;

if ((transcriptLine.type === "user" || transcriptLine.type === "assistant") && transcriptLine.message) {
	messages.push(transcriptLine.message); // ✅ 提取真正的消息对象
}
```

#### Claude Code 实际的 transcript.jsonl 格式

```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "你好？你是什么模型啊？"
  },
  "uuid": "3c37859f-a9f2-40aa-a98c-9edc831847d9",
  "timestamp": "2025-11-06T21:06:26.835Z"
}

{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "content": [
      {"type": "text", "text": "你好！我是 Claude Code..."}
    ],
    "model": "kimi-k2-turbo-preview"
  },
  "uuid": "5ff8f34b-b284-4229-970b-bab98195825a"
}
```

### Testing

测试结果确认修复成功：

**测试文件 1**: `d2de3058-8439-4374-803c-0db866cb1ede.jsonl`

```plain
✅ 修复前: "任务处理完成" (6 字符)
✅ 修复后: "你好？你是什么模型啊？\n\n我是 Claude Code，使用的是 Claude 3.5 Sonnet 模型。"
```

**测试文件 2**: `300b35d9-f468-4005-9811-2f6edf73b351.jsonl`

```plain
✅ 修复前: "任务处理完成" (6 字符)
✅ 修复后: "运行 vue-tsc --build 命令...\n\n已完成类型检查，发现 403 个类型错误..."
```

**关键词提取测试**:

```bash
tsx transcript-reader.ts <file> --format=keywords
✅ 输出: "Claude, 你好, 我是, Code, Sonnet, 模型, ..."
```

### References

- 修复的脚本：`scripts/transcript-reader.ts:43-48, 186-213`
- 相关日志分析：
  - `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs\2025-11-07__00-03-46__*.log`
  - 所有日志显示 "Extracted Context Length: 6 characters" (仅包含默认文本)

## [0.6.2] - 2025-11-06

### Fixed

- **🐞 钩子上下文读取失败**: 修复了 transcript-reader.js 因 ES Module 错误无法读取对话上下文的问题
  - **问题原因**: `transcript-reader.js` 使用 CommonJS 的 `require()` 语法，但父级 package.json 设置了 `"type": "module"`
  - **错误信息**: `ReferenceError: require is not defined in ES module scope`
  - **影响范围**:
    - `task-complete-notifier.sh`: 无法提取对话上下文，导致 Gemini 总结失败
    - 所有日志显示错误信息而非有效的任务摘要
  - **修复方案**:
    1. 将 `transcript-reader.js` 改为 `transcript-reader.ts`，使用 TypeScript + ES Module
    2. 创建 `parse-hook-data.ts` 解析钩子 JSON 输入（支持 Windows 路径转义）
    3. 使用全局 `tsx` 命令运行 TypeScript 文件
    4. 添加降级机制：tsx 不存在时使用 grep/sed 提取

### Changed

- **脚本迁移至 TypeScript**:
  - `transcript-reader.js` → `transcript-reader.ts`
  - 新增 `parse-hook-data.ts` 用于 JSON 解析
  - 添加完整的 TypeScript 类型定义
  - 改进错误处理和日志记录

- **Windows 路径支持增强**:
  - 修复 JSON 解析器无法处理 Windows 路径中的反斜杠问题
  - 实现智能转义：自动将单反斜杠转为双反斜杠
  - 兼容 Git Bash 和 PowerShell 环境

### Technical Details

#### 修复前的错误

日志显示的错误信息：

```plain
file:///C:/Users/pc/.claude/plugins/.../transcript-reader.js:15
const fs = require("fs");
           ^
ReferenceError: require is not defined in ES module scope
```

Gemini 收到的是错误信息而非上下文，导致总结失败。

#### 修复后的实现

**新文件结构**：

- `transcript-reader.ts` - TypeScript 版本，使用 `import` 语法
- `parse-hook-data.ts` - JSON 解析器，处理 Windows 路径转义

**运行方式**：

```bash
# 使用 tsx 运行 TypeScript 文件
tsx transcript-reader.ts "$TRANSCRIPT_PATH" --format=summary
tsx parse-hook-data.ts session_id < hook-data.json
```

**降级策略**：

```bash
# 检查 tsx 是否可用
if command -v tsx &> /dev/null; then
  # 使用 TypeScript 版本
  tsx transcript-reader.ts "$TRANSCRIPT_PATH" --format=summary
else
  # 记录 tsx 不存在的情况到日志
  log "WARNING: tsx not available, using default summary"
  SUMMARY="任务处理完成"
fi
```

#### Windows 路径转义问题

**问题**：钩子传入的 JSON 包含未转义的反斜杠

```json
{ "transcript_path": "C:\Users\pc\.claude\projects\..." }
```

**解决方案**：智能转义算法

```typescript
// 1. 暂存已转义的双反斜杠
input = input.replace(/\\\\/g, "\x00");
// 2. 将所有单反斜杠转为双反斜杠
input = input.replace(/\\/g, "\\\\");
// 3. 恢复双反斜杠
input = input.replace(/\x00/g, "\\\\");
```

### Testing

测试结果确认修复成功：

- ✅ JSON 解析正常（Session ID、Transcript Path 正确提取）
- ✅ transcript-reader.ts 成功执行
- ✅ 对话上下文正确提取
- ✅ Gemini 总结功能恢复正常
- ✅ Windows 路径正确处理

### References

- 修复的脚本：
  - `scripts/transcript-reader.ts` (新)
  - `scripts/parse-hook-data.ts` (新)
  - `scripts/task-complete-notifier.sh` (更新)
- 删除的文件：
  - `scripts/transcript-reader.js` (已废弃)

## [0.6.1] - 2025-11-04

### Fixed

- **🐞 钩子决策类型错误**: 修复了钩子返回值导致 Claude Code 内部故障的严重问题
  - **问题原因**: 钩子脚本返回了 `{"decision": "proceed"}`，但 Claude Code 只接受 `approve` 或 `block` 两种决策类型
  - **错误信息**: `Error: Unknown hook decision type: proceed. Valid types are: approve, block`
  - **影响范围**:
    - `user-prompt-logger.sh`: UserPromptSubmit 钩子无法正常工作
    - `task-complete-notifier.sh`: Stop 钩子导致 Claude Code 崩溃
  - **修复方案**: 将所有钩子脚本的返回值从 `"proceed"` 改为 `"approve"`
    - `user-prompt-logger.sh:60`: 快速返回时的决策类型
    - `task-complete-notifier.sh:48`: 错误陷阱中的决策类型
    - `task-complete-notifier.sh:247`: 正常输出时的决策类型

### Technical Details

#### 修复前的代码（导致崩溃）

```bash
# user-prompt-logger.sh:60
echo "{\"decision\": \"proceed\"}"  # ❌ 错误的决策类型

# task-complete-notifier.sh:48
trap 'echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT  # ❌ 错误的决策类型

# task-complete-notifier.sh:247
OUTPUT_JSON="{\"decision\": \"proceed\", ...}"  # ❌ 错误的决策类型
```

#### 修复后的代码（正常工作）

```bash
# user-prompt-logger.sh:60
echo "{\"decision\": \"approve\"}"  # ✅ 正确的决策类型

# task-complete-notifier.sh:48
trap 'echo "{\"decision\": \"approve\"}"; exit 0' ERR EXIT  # ✅ 正确的决策类型

# task-complete-notifier.sh:247
OUTPUT_JSON="{\"decision\": \"approve\", ...}"  # ✅ 正确的决策类型
```

#### 钩子决策类型规范

根据 Claude Code 官方文档，钩子返回的 JSON 必须包含 `decision` 字段，且只支持两种值：

| 决策类型  | 说明                       | 使用场景                     |
| --------- | -------------------------- | ---------------------------- |
| `approve` | 允许操作继续               | 正常执行，不阻塞 Claude Code |
| `block`   | 阻止操作继续，显示阻塞消息 | 需要用户确认或满足特定条件   |

**重要**: `proceed` 不是有效的决策类型，会导致 Claude Code 抛出异常并崩溃。

### References

- 修复的脚本：
  - `scripts/user-prompt-logger.sh`
  - `scripts/task-complete-notifier.sh`
- 官方文档：[Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

## [0.6.0] - 2025-11-04

### Added

- **完整对话历史读取**: 新增 `transcript-reader.js` JSONL 解析器
  - 读取完整的对话历史，不再限制消息数量
  - 支持三种输出格式：summary（摘要）、full（完整）、keywords（关键词）
  - 智能提取用户消息、Agent 响应、工具调用信息
  - 智能截断长文本，避免超过 Gemini token 限制

- **双钩子协作机制**: 实现 UserPromptSubmit 和 Stop 钩子协作
  - `user-prompt-logger.sh`: 在 UserPromptSubmit 钩子中初始化会话日志，记录用户输入
  - `task-complete-notifier.sh`: 在 Stop 钩子中读取完整上下文，生成总结
  - 快速返回（UserPromptSubmit < 1s，Stop < 15s），不阻塞 Claude Code

- **增强的总结生成**: 改进 Gemini 总结策略
  - 基于完整对话历史生成上下文（不再只读取最后 5 条）
  - 三级降级策略：gemini-2.5-flash → gemini-2.5-pro → 关键词提取
  - 提取第一个用户请求、最近交互、最后响应，构建结构化上下文
  - 更准确的总结结果，显著减少"任务处理完成"的空洞摘要

### Changed

- **上下文提取优化**: 从"读取最后 5 条，每条 500 字符"改为"读取全部，智能截断"
  - 旧实现：`lines.slice(-5)` + `substring(0, 500)`
  - 新实现：读取所有消息，按重要性智能截断（第一个请求 800 字符，最近交互 600 字符，最后响应 800 字符）
  - 总上下文限制：3000 字符（可配置）

- **日志记录增强**: 更详细的日志信息
  - 记录提取的上下文长度
  - 记录 Gemini 原始输出（便于调试）
  - 记录每次尝试的结果和耗时

- **钩子配置更新**: 在 hooks.json 中添加 UserPromptSubmit 钩子
  - 保留原有的所有钩子配置
  - 添加 `user-prompt-logger.sh` 到 UserPromptSubmit
  - 更新 Stop 钩子超时时间为 15 秒

### Fixed

- **上下文缺失问题**: 修复 Gemini 总结总是生成"任务处理完成"的根本原因
  - 问题原因：只读取最后 5 条消息且每条只截取 500 字符，导致上下文不足
  - 解决方案：读取完整对话历史，智能提取关键部分
  - 结果：Gemini 现在能基于完整上下文生成有意义的总结

- **关键词提取改进**: 优化降级策略中的关键词提取
  - 移除常见停用词（中文和英文）
  - 统计词频，返回前 10 个高频关键词
  - 作为 Gemini 失败时的兜底方案

### Technical Details

#### 新增文件

1. **transcript-reader.js** - 对话历史解析器

   ```javascript
   // 使用方式
   node transcript-reader.js /path/to/transcript.jsonl --format=summary
   ```

2. **user-prompt-logger.sh** - UserPromptSubmit 钩子
   ```bash
   # 记录到会话日志
   session_{SESSION_ID}_{TIMESTAMP}.log
   ```

#### 核心改进对比

| 对比项     | v0.5.1                   | v0.6.0                          |
| ---------- | ------------------------ | ------------------------------- |
| 上下文读取 | 最后 5 条，每条 500 字符 | 完整历史，智能截断 3000 字符    |
| 钩子数量   | 1 个（Stop）             | 2 个（UserPromptSubmit + Stop） |
| 解析方式   | 内联 Node.js 脚本        | 独立 transcript-reader.js       |
| 总结质量   | 经常返回"任务处理完成"   | 基于完整上下文的有意义总结      |

#### 架构设计

```plain
UserPromptSubmit  ──→  user-prompt-logger.sh
                        ├─ 初始化会话日志
                        └─ 记录用户输入

[Claude Code 处理中...]

Stop              ──→  task-complete-notifier.sh
                        ├─ 调用 transcript-reader.js
                        ├─ 生成 Gemini 总结
                        └─ 发送桌面通知
```

### Migration Guide

无需手动迁移。更新到 0.6.0 后，所有改进将自动生效：

1. UserPromptSubmit 钩子会自动开始记录用户输入
2. Stop 钩子会自动使用新的解析器读取完整上下文
3. Gemini 总结质量将显著提升

### References

- 设计文档：`docs/reports/2025-11-04-claude-code-conversation-context-improvement.md`
- 核心脚本：`scripts/transcript-reader.js`, `scripts/user-prompt-logger.sh`
- 改进的 Stop 钩子：`scripts/task-complete-notifier.sh`

## [0.5.1] - 2025-11-03

### Fixed

- **🐞 Stop hook 阻塞问题**: 修复了 `● Stop hook prevented continuation` 导致 Claude Code 无法继续执行的严重问题
  - **问题原因 1**：`tee` 命令导致 I/O 管道阻塞
    - 在 Gemini API 调用中使用 `2>&1 | tee -a "$LOG_FILE"` 同时记录日志和捕获输出
    - 管道操作在 Windows Git Bash 环境中可能挂起
  - **问题原因 2**：`pnpm dlx` 调用挂起
    - 通知器使用 `pnpm dlx` 可能需要下载包，时间不可控
    - Windows 环境下 `timeout` 命令对进程组的控制不可靠
  - **问题原因 3**：缺少全局错误处理
    - 没有错误陷阱确保脚本总是返回成功
    - 异常情况下会阻塞 Claude Code

- **修复方案**：
  1. 移除 `tee` 命令，改用分离的日志记录方式
     - 先捕获完整输出到变量
     - 再分别写入日志文件和提取结果
     - 避免管道阻塞
  2. 通知器后台运行
     - 使用子进程 `(...)&` 在后台执行
     - 不等待通知器完成，主脚本立即继续
     - 添加 8 秒超时保护
  3. 添加错误陷阱
     - 使用 `trap` 捕获 `ERR` 和 `EXIT` 信号
     - 确保脚本总是返回 `{"decision": "proceed"}`
     - 防止异常导致 hook 阻塞
  4. 优化超时时间
     - Gemini flash: 5s（快速响应）
     - Gemini pro: 5s（从 8s 优化）
     - Default model: 4s（更短超时）
     - 通知器: 8s（后台运行）

- **测试结果**：
  - ✅ 脚本在约 17 秒内完成（包括 3 次 Gemini 调用）
  - ✅ 返回有效的 JSON 输出：`{"decision": "proceed", "additionalContext": "..."}`
  - ✅ 即使 Gemini 和通知器失败，也能正常返回
  - ✅ 不再阻塞 Claude Code

### Technical Details

#### 修复前的代码（会阻塞）

```bash
# 问题 1: tee 命令导致管道阻塞
SUMMARY=$(timeout 5s gemini ... 2>&1 | tee -a "$LOG_FILE" | head -n 1)

# 问题 2: pnpm dlx 可能挂起，且等待完成
NOTIFIER_OUTPUT=$(pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" 2>&1)

# 问题 3: 缺少错误处理
# 如果任何步骤失败，脚本就会挂起或返回错误
```

#### 修复后的代码（不阻塞）

```bash
# 修复 1: 分离日志记录和输出捕获
GEMINI_OUTPUT=$(timeout 5s gemini ... 2>&1 || echo "")
echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')

# 修复 2: 通知器后台运行
(
  cd "$PROJECT_DIR" 2>/dev/null || cd /
  timeout 8s pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" >> "$LOG_FILE" 2>&1
) &
log "Notifier started in background (PID: $!)"

# 修复 3: 错误陷阱确保总是成功返回
trap 'log "Script interrupted, returning success"; echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT
```

### References

- 问题分析：参见 `.github/prompts/index.md` 第 86-151 行
- 修复代码：`scripts/task-complete-notifier.sh`

## [0.5.0] - 2025-11-03

### Added

- **完整日志记录机制**: 新增自动日志记录系统
  - 日志位置：`%TEMP%\claude-code-task-complete-notifier-logs\`（Windows）或 `/tmp/claude-code-task-complete-notifier-logs/`（Linux/Mac）
  - 日志文件命名：`YYYY-MM-DD__HH-mm-ss__工作目录.log`
  - 记录内容：Hook 输入数据、对话上下文、Gemini prompt、响应、执行时间统计
  - 日志函数：`log()` 函数同时输出到控制台和日志文件

- **对话历史解析功能**: 从 `transcript_path` 读取对话历史
  - 支持 JSONL 格式解析（每行一个 JSON 对象）
  - 提取最近 5 条消息的用户和助手内容
  - 限制每条消息 500 字符，避免 prompt 过长
  - 智能组合成有意义的上下文摘要

- **多模型降级策略**: 实现三级模型选择机制
  - 级别 1：`gemini-2.5-flash`（5 秒超时，快速响应）
  - 级别 2：`gemini-2.5-pro`（8 秒超时，高质量总结）
  - 级别 3：默认模型（5 秒超时）
  - 降级策略：使用对话上下文前 50 字符

- **执行时间统计**: 记录每个 Gemini 调用的执行时间
  - 帮助分析和优化模型选择
  - 监控性能表现

- **详细功能文档**: 新增 `TASK_COMPLETE_NOTIFIER_README.md`
  - 完整的问题分析和解决方案说明
  - 模型选择建议和性能对比
  - 使用方法和调试指南
  - 示例日志展示

### Fixed

- **🐞 核心问题修复**: 修复了 Gemini 总结总是返回"任务已完成"的根本问题
  - **问题原因**：Stop 钩子不包含 `tool_input` 字段
  - **原始代码**：错误地尝试从 `data.tool_input?.description` 提取任务描述
  - **导致结果**：`TASK_DESCRIPTION` 始终为默认值"任务"，Gemini 收到的 prompt 过于简单
  - **解决方案**：从 `transcript_path` 读取完整对话历史并提取有意义的上下文

- **对话上下文提取**: 实现正确的数据提取逻辑
  - 使用 Node.js 解析 JSONL 格式的会话历史
  - 提取用户消息和助手响应的文本内容
  - 支持数组和字符串两种内容格式
  - 过滤空消息和无效数据

- **Gemini Prompt 优化**: 改进发送给 Gemini 的 prompt
  - 提供实际的对话内容而非空洞的"任务"
  - 包含明确的输出格式要求和示例
  - 清晰的字数限制（5-20 字）
  - 增强的上下文描述

### Changed

- **摘要长度调整**: 将最大长度从 20 字符扩展到 50 字符
  - 允许更详细的任务描述
  - 超过 50 字符时自动截断并添加 `...`

- **错误处理增强**: 改进 Gemini 调用的错误处理
  - 使用 `2>&1` 捕获错误输出并记录到日志
  - 使用 `tee` 同时输出到控制台和日志文件
  - 检查结果长度判断是否需要重试

- **超时策略优化**: 调整不同模型的超时时间
  - flash 模型：5 秒（符合快速响应需求）
  - pro 模型：8 秒（留出更多时间保证质量）
  - 默认模型：5 秒

### Technical Details

#### Stop 钩子的实际数据格式

```json
{
	"session_id": "abc123",
	"transcript_path": "~/.claude/projects/.../session.jsonl",
	"permission_mode": "default",
	"hook_event_name": "Stop",
	"stop_hook_active": true
}
```

**重要发现**：Stop 钩子**不包含** `tool_input`、`cwd` 或 `conversationMessages` 字段。

#### 对话历史文件格式

transcript_path 指向的 JSONL 文件格式：

```jsonl
{"role":"user","content":[{"type":"text","text":"用户消息"}]}
{"role":"assistant","content":[{"type":"text","text":"助手响应"}]}
```

#### 模型性能对比

| 模型             | 平均响应时间 | 总结质量 | 推荐场景               |
| ---------------- | ------------ | -------- | ---------------------- |
| gemini-2.5-flash | 1-3 秒       | 良好     | 快速通知，简单任务     |
| gemini-2.5-pro   | 3-6 秒       | 优秀     | 复杂任务，需要精准表达 |

**实施策略**：优先使用 flash（速度），失败时切换 pro（质量），确保在 5-8 秒内完成。

### Breaking Changes

无破坏性变更。所有改进都向后兼容。

### Migration Guide

无需迁移。现有用户更新到 0.5.0 后将自动享受改进的总结功能。

### Debugging

如果遇到总结问题，可以查看详细日志：

```powershell
# Windows
cd $env:TEMP\claude-code-task-complete-notifier-logs
Get-Content (Get-ChildItem | Sort-Object LastWriteTime -Descending | Select-Object -First 1).FullName

# Linux/Mac
tail -f /tmp/claude-code-task-complete-notifier-logs/$(ls -t /tmp/claude-code-task-complete-notifier-logs | head -1)
```

日志包含：

1. Hook 输入数据（完整 JSON）
2. 提取的对话上下文
3. 发送给 Gemini 的 prompt
4. Gemini 的原始响应
5. 执行时间统计
6. 最终通知结果

### References

- 详细说明：[scripts/TASK_COMPLETE_NOTIFIER_README.md](./scripts/TASK_COMPLETE_NOTIFIER_README.md)
- 官方文档：[Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks)

## [0.4.1] - 2025-11-03

### Fixed

- **钩子重复执行问题**: 修复了插件钩子重复运行两次的严重 bug
  - 问题原因：`plugin.json` 中 `hooks` 字段使用了不受支持的数组格式 `["./hooks/hooks.json"]`
  - 修复方案：将 `hooks` 字段改为官方支持的字符串格式 `"./hooks/hooks.json"`
  - 影响范围：所有钩子事件（SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、Stop、SessionEnd、SubagentStop）
  - 参考文档：[Claude Code 插件参考文档 - hooks 字段定义](https://docs.claude.com/en/docs/claude-code/plugins-reference.md)
  - 详细分析：参见 `docs/reports/claude-code-hooks-duplicate-execution-issue.md`

### Technical Details

修复前的配置：

```json
{
	"hooks": ["./hooks/hooks.json"] // ❌ 不支持的数组格式
}
```

修复后的配置：

```json
{
	"hooks": "./hooks/hooks.json" // ✅ 正确的字符串格式
}
```

**影响**：修复后，每个钩子事件只会执行一次，解决了之前出现的 `Running PostToolUse hooks… (1/2 done)` 的问题。

## [0.4.0] - 2025-11-03

### Added

- **完整钩子系统**: 实现了基于 Claude Code 各个钩子事件的通知系统
  - `Stop`: 任务完成时触发通知，支持 Gemini AI 智能生成任务摘要
  - `SessionStart`: 会话开始时的定时检查通知
  - `SessionEnd`: 会话结束时的定时检查通知
  - `UserPromptSubmit`: 用户提交消息时的定时检查通知
  - `PreToolUse`: 工具使用前的定时检查通知
  - `PostToolUse`: 工具使用后的定时检查通知
  - `SubagentStop`: 子代理停止时的定时检查通知

- **通知功能**: 集成 `@ruan-cat/claude-notifier` 包提供通知能力
  - `task-complete`: 任务完成通知
  - `check-and-notify`: 定时检查并发送通知
  - 支持 Gemini AI 智能总结任务内容

- **脚本支持**: 新增 `task-complete-notifier.sh` 脚本
  - 使用环境变量 `CLAUDE_PLUGIN_ROOT` 定位插件目录
  - 提供更灵活的通知触发机制

### Changed

- 将所有通知钩子整合到 `Stop` 事件中，统一管理

### Fixed

- 修复了 `task-complete-notifier.sh` 脚本缺失 `CLAUDE_PROJECT_DIR` 环境变量的问题

## Previous Versions

### [0.3.x] - 2025-10-22 ~ 2025-11-01

早期版本包含了以下核心功能：

- **Commands**:
  - `markdown-title-order`: 设置并维护 Markdown 文档的标题序号
  - `close-window-port`: 关闭指定端口的窗口进程

- **Agents**:
  - `format-markdown`: 格式化 Markdown 文档的专用子代理

- **插件架构**: 基于 [claude-code-marketplace](https://github.com/ananddtyagi/claude-code-marketplace) 的代码结构设计

---

## 维护说明

### 报告问题

如果您在使用插件时遇到问题，请：

1. 查看详细的问题分析报告：`docs/reports/claude-code-hooks-duplicate-execution-issue.md`
2. 在 GitHub 仓库提交 Issue：[ruan-cat/monorepo](https://github.com/ruan-cat/monorepo/issues)

### 版本升级

本插件遵循语义化版本规范：

- **Major (x.0.0)**: 破坏性变更
- **Minor (0.x.0)**: 新增功能，向后兼容
- **Patch (0.0.x)**: Bug 修复，向后兼容

### 更新插件

如果您已安装此插件，请使用以下命令更新到最新版本：

```bash
# 更新插件市场
/plugin marketplace update ruan-cat/monorepo

# 或重新安装插件
/plugin uninstall common-tools
/plugin install common-tools@ruan-cat-tools
```

---

**维护者**: ruan-cat (1219043956@qq.com)

**仓库**: [https://github.com/ruan-cat/monorepo](https://github.com/ruan-cat/monorepo)

**许可证**: MIT
