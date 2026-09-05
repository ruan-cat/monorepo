# low-frequency-skill

阮喵喵低频使用与低频维护的技能合集。这些技能不参与日常高频开发流程，但属于不可缺失的排错、初始化与清理工具；集中收纳在本插件内统一升级维护。

## 安装

三平台安装命令与 `common-tools`、`dev-skills` 一致，安装入口见 [ai-plugins/docs/README.md](../docs/README.md)。

### Skills （技能）

- **init-playwright**: pnpm monorepo 初始化 Playwright 三件套，含 e2e/视觉测试骨架、MCP 配置、AI skills 生成与 AI 记忆更新，内置无头浏览器 CPU 过载事故复盘。
- **clone-ruancat-repo**: 按固定清单克隆 GitHub 用户 ruan-cat 的常用仓库到约定目录名，支持浅克隆与多分支抓取。
- **get-git-branch**: 诊断并修复 Git 仓库看不到所有远程分支的问题，将受限 fetch refspec 恢复为通配符模式。
- **init-claude-code-statusline**: 初始化、更新或覆盖 Claude Code 状态栏配置文件，展示目录、Git 分支、模型、版本和上下文窗口。
- **init-simple-memorix**: 精简 Memorix MCP 的 hooks 配置，处理项目级/全局 hooks 噪音、MCP 工具缺失、full 模式与 WorkBuddy MCP 启动失败等问题。
- **init-tsconfig**: 通过 tsconfig.json 的合理配置降低 VSCode tsserver 的运行时内存占用，附 14 仓库实证策略矩阵。
- **factory-reset-vscode-fork-ide**: 将基于 VSCode 二次开发的 IDE（Qoder CN IDE、Trae、Cursor、Windsurf、Cline 类）还原出厂状态。

## 维护约定

本插件的技能低频运行、低频维护：技能内容变更时仍按 `release-ai-plugins` 技能的发布流程同步版本号、CHANGELOG 与 `skill-registry.json`，不做豁免。
