# 使用 `npx skills` 安装本仓库技能

你可以使用 [`npx skills`](https://github.com/vercel-labs/skills)（npm 包名 [`skills`](https://www.npmjs.com/package/skills)）从 GitHub 远程安装本仓库外发技能。

## 本仓库维护者的 Agent 使用偏好

以下分类用于说明**个人使用频率**，不影响 `npx skills` 的安装目标：批量安装时仍可将技能同步到所列全部客户端；若你只想装到其中一部分，可删减对应的 `-a` 参数。

| 频率 | 产品                | `skills` CLI 的 `--agent` / `-a` 名称                  |
| ---- | ------------------- | ------------------------------------------------------ |
| 常用 | Claude Code         | `claude-code`                                          |
| 常用 | OpenAI Codex（CLI） | `codex`                                                |
| 常用 | Cursor              | `cursor`                                               |
| 低频 | Antigravity         | `antigravity`                                          |
| 低频 | Trae                | `trae`（国内版客户端若单独区分，官方还提供 `trae-cn`） |
| 低频 | Qoder               | `qoder`                                                |

**为何必须写 `-a`：** 在非交互场景使用 `-y` 时，若不指定 `-a`，CLI 可能将技能安装到其支持的**全部** agent。通过 repeated `-a` 显式列出本机会用的客户端，可避免向未安装的 IDE 目录写入或无意义的占位。

**仅常用三端时：** 可只保留 `-a claude-code -a codex -a cursor`。

下文示例中的 `-a` 列表按上表**六端全开**，与本仓库维护者偏好一致。

## 重要原则

不要直接对整个仓库做通配安装：

```bash
# 不推荐：会扫描整仓，混入本仓库内部技能；且缺少 -a 时，配合 -y 易装到全部 agent
npx skills add ruan-cat/monorepo --skill '*' -g -y
```

本仓库是 monorepo，存在大量仅供仓库内部使用的技能。请将安装源严格限制在 `ai-plugins` 下。

## 批量安装 `common-tools` 全部技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills --list
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills --skill '*' -g -y \
  -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

## 批量安装 `dev-skills` 全部技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills --list
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills --skill '*' -g -y \
  -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

## 单独安装某个技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills/<skill-name> -g -y \
  -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills/<skill-name> -g -y \
  -a claude-code -a codex -a cursor -a antigravity -a trae -a qoder
```

## 常见问题

- **开发分支安装**：把 URL 中的 `main` 改为 `dev`。
- **误装了整仓技能**：使用 `npx skills remove` 或手动清理全局技能目录后，按本文的子目录 URL 重新安装。
- **官方 agent 名称**：以 [skills 包 README / Supported Agents](https://github.com/vercel-labs/skills#supported-agents) 为准；`npx skills add --help` 可查看当前 CLI 版本支持的选项。

## 相关文档

- 多平台总览：[`./README.md`](./README.md)
- Claude 插件安装：[`../../.claude-plugin/README.md`](../../.claude-plugin/README.md)
- Cursor 插件安装：[`../../.cursor-plugin/README.md`](../../.cursor-plugin/README.md)
