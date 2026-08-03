# CodeBuddy Skills Sync Implementation Plan

> For agentic workers: use the repository skill execution workflow and verify every change before completion.

**Goal:** 将 CodeBuddy 的全局 skills 根目录纳入现有同步器，从 ~/.agents/skills 通过目录级链接同步到 ~/.codebuddy/skills。

**Architecture:** 沿用 AgentPlatform 和 DEFAULT_PLATFORMS 注册表，不新增平台专用同步分支。Node 主脚本、两个 fallback 脚本和对外文档保持同一平台清单；install-skills 只维护可读快照，运行时权威仍是已安装同步技能中的 src/platforms.ts。

**Tech Stack:** TypeScript、Node.js path、Vitest、PowerShell/Bash fallback、Markdown skill 文档。

## Global Constraints

- 规范源目录保持为 ~/.agents/skills。
- CodeBuddy 目标目录固定为 ~/.codebuddy/skills。
- 目标只承担 skills 根目录职责时才使用目录级链接。
- 对外分发 skill 的文档使用安装后视角，不写 monorepo 内部测试路径或本机绝对路径。
- 测试使用 Vitest 的 describe 与 test，文件格式为 *.test.ts。
- 不修改与本次平台扩展无关的文件。

---

### Task 1: Register CodeBuddy Platform

Files: src/platforms.ts, scripts/sync.ts, fallback/sync.ps1, fallback/sync.sh

- [x] 在 TypeScript 注册表和两个 fallback 平台数组加入 CodeBuddy -> ~/.codebuddy/skills。
- [x] 保持现有 syncSkills、备份、dry-run 和 Windows junction 行为不变。

### Task 2: Align User-Facing Skill Documentation

Files: sync-local-global-agents-skills/SKILL.md, sync-local-global-agents-skills/README.md, install-skills/SKILL.md

- [x] 将 CodeBuddy 加入同步技能的触发说明、已支持平台表和 README，并将同步技能版本更新为 0.1.2。
- [x] 将 CodeBuddy 加入 install-skills 的已验证目标快照，并将版本更新为 1.0.3。

### Task 3: Add Regression Coverage

File: tests/sync-local-global-agents-skills/sync.test.ts

- [x] 使用 Vitest describe/test 断言 CodeBuddy 已注册且目标路径以 .codebuddy/skills 结尾。
- [x] 运行该测试文件，确认零失败。

### Task 4: Verify Complete Change

- [x] 运行目标 Markdown/TypeScript 的 Prettier check。
- [x] 运行测试和 tests/tsconfig.json 类型检查。
- [x] 运行 sync.ts help 与 dry-run，确认输出包含 CodeBuddy 且 dry-run 不写文件。
- [x] 运行对外 skill 路径污染扫描、git diff --check，并检查 git status 与目标 diff。
