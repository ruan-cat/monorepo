# 2026-07-31 Codex 插件市场设计

## 目标

为 `ai-plugins/common-tools` 与 `ai-plugins/dev-skills` 提供可由 Codex CLI 发现、安装和卸载的仓库级插件市场，同时保持既有 Claude Code 与 Cursor 分发行为不变。

## 背景与约束

- 已有 Claude Code 市场位于 `.claude-plugin/marketplace.json`，Cursor 市场位于 `.cursor-plugin/marketplace.json`。
- Codex 使用仓库根的 `.agents/plugins/marketplace.json` 发现市场；每个插件使用插件根的 `.codex-plugin/plugin.json` 作为清单。
- `codex plugin marketplace add <仓库根>` 以仓库根解析 `source.path`，因此两个条目分别使用 `./ai-plugins/common-tools` 与 `./ai-plugins/dev-skills`。
- 现有插件版本均为 `8.0.1`。本次仅补齐第三个平台分发，不单独提高发布版本；后续发布时三个平台的市场与 manifest 必须一起同步版本。
- Codex manifest 只声明 `skills: "./skills"`。`common-tools/hooks/hooks.json`、`commands/`、`agents/` 是 Claude Code 专用能力，不得声明为 Codex 插件组件。
- 测试必须使用本机真实 `codex plugin` CLI；测试完成后必须移除两个临时插件和临时 marketplace。

## 方案比较

1. 只在安装文档中提供 `npx skills` 命令：无法让 Codex 的插件市场发现、安装和管理整包插件，不满足目标。
2. 为 Codex 另建一套技能副本：会造成三份内容漂移，且现有 `skills/` 已是跨客户端的共享分发单元。
3. 复用两个插件目录，在其中增加 Codex manifest，并在根级添加 Codex marketplace：复用现有技能树，只暴露 Codex 支持的组件，维护成本最低。采用此方案。

## 结构设计

```text
.agents/plugins/
├── marketplace.json
└── README.md

ai-plugins/
├── common-tools/
│   └── .codex-plugin/plugin.json
└── dev-skills/
    └── .codex-plugin/plugin.json
```

市场名为 `ruan-cat-tools`，展示名为“阮喵喵开发工具集”。每个条目均设置 `policy.installation: "AVAILABLE"`、`policy.authentication: "ON_INSTALL"` 与 `category: "开发工具"`。

两个 manifest 均保留现有插件名和版本，写入作者、仓库、许可、关键词、`skills` 与 Codex 必需的 `interface` 元数据。所有可见说明使用中文，并补充短描述、长描述、开发者、分类、能力、默认提示、官网和品牌色；没有真实隐私政策、服务条款或图标资源时不伪造字段。

## 安装与更新体验

用户从远程仓库安装时使用：

```powershell
codex plugin marketplace add ruan-cat/monorepo --ref main
codex plugin add common-tools@ruan-cat-tools
codex plugin add dev-skills@ruan-cat-tools
```

更新 Git 市场快照使用 `codex plugin marketplace upgrade ruan-cat-tools`，再按需重新安装插件。卸载分别使用 `codex plugin remove <plugin>@ruan-cat-tools` 与 `codex plugin marketplace remove ruan-cat-tools`。

## 文档与维护规则

- 根 README 和 `ai-plugins/docs/README.md` 说明 Codex 已与 Claude Code、Cursor 并列支持。
- `.agents/plugins/README.md` 作为 Codex 专属安装、更新、卸载说明；Claude/Cursor 专属 README 互相链接到它。
- 两个插件 README 的目录树新增 `.codex-plugin/`，并说明 Codex 只提供 skills。
- 两个 CHANGELOG 增加 `Unreleased` 条目，记录新增 Codex 市场支持。
- `release-ai-plugins` 将三平台的 marketplace/manifest、Codex CLI 校验和文档入口纳入发版清单。
- `init-ai-md` 的 Karpathy 模板和本仓库 `skill-hardening-from-incidents` 均要求插件市场变更同步平台差异、安装文档和真实 CLI 验证。

## 验收标准

1. 两个 Codex manifest 和 marketplace JSON 均可由 JSON 解析器读取。
2. `validate_plugin.py` 对两个插件目录均返回成功。
3. `codex plugin marketplace add D:\\code\\ruan-cat\\monorepo --json` 能加载 `ruan-cat-tools`。
4. `codex plugin list --available --json --marketplace ruan-cat-tools` 可列出 `common-tools` 和 `dev-skills`。
5. 两个 `codex plugin add <plugin>@ruan-cat-tools --json` 都能完成安装，随后 `codex plugin list --json` 显示它们。
6. 测试结束后，两个插件和 `ruan-cat-tools` marketplace 均通过 CLI 移除，并由 list 命令确认无残留。
