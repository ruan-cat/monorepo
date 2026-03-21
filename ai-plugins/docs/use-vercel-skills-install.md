# 使用 `npx skills` 安装本仓库技能

你可以使用 [`npx skills`](https://github.com/vercel-labs/skills) 从 GitHub 远程安装本仓库外发技能。

## 重要原则

不要直接对整个仓库做通配安装：

```bash
# 不推荐：会扫描整仓，混入本仓库内部技能
npx skills add ruan-cat/monorepo --skill '*' -g -y
```

本仓库是 monorepo，存在大量仅供仓库内部使用的技能。请将安装源严格限制在 `ai-plugins` 下。

## 批量安装 `common-tools` 全部技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills --list
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills --skill '*' -g -y
```

## 批量安装 `dev-skills` 全部技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills --list
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills --skill '*' -g -y
```

## 单独安装某个技能

```bash
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/common-tools/skills/<skill-name> -g -y
npx skills add https://github.com/ruan-cat/monorepo/tree/main/ai-plugins/dev-skills/skills/<skill-name> -g -y
```

## 常见问题

- **开发分支安装**：把 URL 中的 `main` 改为 `dev`。
- **误装了整仓技能**：使用 `npx skills remove` 或手动清理全局技能目录后，按本文的子目录 URL 重新安装。

## 相关文档

- 多平台总览：[`./README.md`](./README.md)
- Claude 插件安装：[`../../.claude-plugin/README.md`](../../.claude-plugin/README.md)
- Cursor 插件安装：[`../../.cursor-plugin/README.md`](../../.cursor-plugin/README.md)
