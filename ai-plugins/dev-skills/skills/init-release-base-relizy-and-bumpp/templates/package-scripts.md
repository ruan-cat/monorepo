# 根包 package.json scripts 模板

> 本模板提供 relizy + bumpp 组合发版方案所需的全部 scripts。复制到目标仓库根 `package.json` 的 `scripts` 字段中，按需调整 `format:changelog` 的 glob 匹配路径。

## 完整 scripts 模板

```json
{
	"scripts": {
		"release:bumpp": "bumpp --push",
		"release:changelogen": "changelogen --bump --release --push",
		"release": "pnpm run release:sub && pnpm run release:root && pnpm run git:push",
		"release:sub": "relizy-runner release --no-publish --no-provider-release --no-push --yes",
		"release:root": "bumpp --no-push --yes --release patch",
		"release:dry": "relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes",
		"changelog": "relizy-runner changelog",
		"changelog:dry": "relizy-runner changelog --dry-run",
		"format:changelog": "pnpm exec prettier --experimental-cli --write CHANGELOG.md \"apps/*/CHANGELOG.md\"",
		"changelog:root": "changelogen --output CHANGELOG.md",
		"git:push": "git push --follow-tags"
	}
}
```

## 命令详解

| 命令                  | 说明                                                                   |
| --------------------- | ---------------------------------------------------------------------- |
| `release:bumpp`       | 单独根包发版：手动选择版本号，并立即 push 根包 commit + tag            |
| `release:changelogen` | 自动化根包发版：从 commits 自动推断版本号                              |
| `release`             | **主发版命令**：依次执行子包发版 → 根包发版 → 推送                     |
| `release:sub`         | 子包发版：relizy-runner 处理所有子包的 bump + changelog + tag，不 push |
| `release:root`        | 串行主链路中的根包发版：bumpp 自动 patch + changelogen + tag，不 push  |
| `release:dry`         | relizy dry-run 模式，用于测试                                          |
| `changelog`           | relizy 批量生成全部 CHANGELOG.md（根包 + 子包）                        |
| `changelog:dry`       | changelog 的 dry-run 模式                                              |
| `format:changelog`    | 格式化 CHANGELOG.md 文档                                               |
| `changelog:root`      | 手动重建根包 CHANGELOG.md；正常发版由 bumpp 的 `execute` 自动调用      |
| `git:push`            | 一次性推送所有 commits + tags 到远程                                   |

## 需要按项目调整的部分

1. **`format:changelog`** 的 glob 路径：`"apps/*/CHANGELOG.md"` 需替换为目标仓库实际的子包目录，如 `"packages/*/CHANGELOG.md"` 或 `"apps/*/CHANGELOG.md" "packages/*/CHANGELOG.md"`。
2. 若仓库不使用 prettier，可移除 `format:changelog` 并同步修改 `relizy.config.ts` 中的 `formatCmd`。
3. `release:root` 与 `release:bumpp` 分别对应两种合法入口：前者服务串行主链路并显式 `--no-push`，后者服务单独根包发版并显式 `--push`。
