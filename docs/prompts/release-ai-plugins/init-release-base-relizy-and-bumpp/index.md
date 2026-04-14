针对 `docs\plan\11comm-relizy-init-workflow-skill-plan.md` 和 `docs\plan\eams-frontend-monorepo-init-relizy-monorepo-skill-plan.md` 的冲突项，这样处理：

1. 技能名称与路径不同。统一将要新建的技能命名为 `init-relizy` 技能，在本项目的 `ai-plugins\dev-skills` 目录内新建技能。
2. 目录组织： 需要同时结合优点来完成。同时 templates/ 和 references/ 目录。
3. 案例定位权重不同。两个 plan 对应的落地项目，都是最先开始的落地案例。都要一同学习。
4. 新建 skills 时，注意确保通用化，不要过分强调这两个案例，这两个案例不一定都是开源项目。转换成通用的实施落实技能写法。

---

# 新建 init-relizy 技能

在 `ai-plugins\dev-skills` 内新建技能，新建 `init-relizy` 技能。

**落盘路径**：`ai-plugins/dev-skills/skills/init-relizy/`（含 `SKILL.md`、`templates/`、`references/`、`evals/evals.json`）。

## 001 <!-- 已完成：见 init-relizy metadata 1.2.0 --> 重大迭代 `ai-plugins\dev-skills\skills\init-relizy\SKILL.md` 技能

### 不再手动新建具体的脚本了

init-relizy 需要使用来自 utils 包提供的脚本。不再考虑让这个技能，实现本地临时新建脚本了。

具体使用的是这款 `https://raw.githubusercontent.com/ruan-cat/monorepo/refs/heads/dev/packages/utils/src/node-esm/scripts/relizy-runner/index.md` ，注意阅读这个文档，用这个包提供的脚本来完成任务。用 `@ruan-cat/utils` 提供的 `relizy-runner` 脚本来完成运行。

### 补充配置

relizy 的 配置文件应该增加以下配置 ：

```txt
	release: {
		changelog: true,
		commit: true,
		push: true,
		gitTag: true,
		clean: true,
		noVerify: false,
		publish: false,
		providerRelease: false,
		social: false,
		prComment: false,
	},
```

## 002 <!-- 已完成：SKILL.md 1.3.0 + templates/references 同步 --> 对 --yes 参数的情况做出说明，并要求 init-relizy 技能主动传递该参数

## 003 <!-- 已完成 --> 大范围重构 `init-relizy` 技能，改名为 `init-release-base-relizy-and-bumpp`

全面的重构，拓展 `ai-plugins\dev-skills\skills\init-relizy` 技能。

1. 文件夹重命名为 `init-release-base-relizy-and-bumpp`
2. 仍旧是给项目补齐，增加发版能力。但是现在发版能力使用的是 relizy + bumpp 共同实现的方案。而不是单独的使用 relizy 来完成的方案。具体的做法一定要深刻研究清楚 `D:\code\ruan-cat\01s-11comm\apps\admin\src\docs\reports\2026-04-09-monorepo-release-workflow-implementation-guide.md` 文档，和 `D:\code\ruan-cat\01s-11comm` 目录的项目做法。

### 明确清楚 `init-release-base-relizy-and-bumpp` 技能的 templates 目录应该提供哪些固定的配置文件模板

`init-release-base-relizy-and-bumpp` 技能的触发条件也差不多。现在 `init-release-base-relizy-and-bumpp` 技能需要一次性初始化这些配置文件：

- bump.config.ts
- changelog.config.ts
- changelogithub.config.ts
- relizy.config.ts
- .github\workflows\release.yaml

这些配置文件，你应该完全照抄 `D:\code\ruan-cat\01s-11comm` 目录的项目做法。包括内部的注释信息。不要丢失。

### 对齐依赖

需要补齐的开发依赖 devDependencies 至少应该包括：

- bumpp
- changelogen
- changelogithub
- relizy
- conventional-changelog
- @ruan-cat/commitlint-config
- @ruan-cat/utils
- @types/node
- pnpm-workspace-yaml

### 根包 package.json 提供的命令

其一次性提供的发版命令，参考如下：

```json
{
	"scripts": {
		"release:bumpp": "bumpp",
		"release:changelogen": "changelogen --bump --release --push",
		"release": "pnpm run release:sub && pnpm run release:root && pnpm run git:push",
		"release:sub": "relizy-runner release --no-publish --no-provider-release --no-push --yes",
		"release:root": "bumpp --yes --release patch",
		"release:dry": "relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes",
		"changelog": "relizy-runner changelog",
		"changelog:dry": "relizy-runner changelog --dry-run",
		"format:changelog": "pnpm exec prettier --experimental-cli --write CHANGELOG.md \"apps/*/CHANGELOG.md\"",
		"changelog:conventional-changelog": "conventional-changelog -p angular -i CHANGELOG.md -s",
		"git:push": "git push --follow-tags"
	}
}
```

命令详解：

- `release:bumpp` 允许用户直接用 bumpp 交互式的方式，对根包生成 git tag 和 CHANGELOG.md 信息。
- `release:changelogen` 允许用户用自动化的方式，自动识别 git commit 信息，自动化生成根包的 git tag 和 CHANGELOG.md 信息。
- `release:sub` 用 @ruan-cat/utils 提供的 relizy-runner 命令，对子包生成 git tag 和 CHANGELOG.md 信息，且不会自动 push。
- `release:root` 用 bumpp 跳过默认交互式选择，直接默认生成固定的 patch 根包 git tag 和 CHANGELOG.md 信息。
- `release:dry` relizy 的 --dry-run 模式。用于自主测试。
- `changelog` relizy 批量生成全部的 CHANGELOG.md 信息，包括根包和子包。
- `changelog:dry` relizy 生成 CHANGELOG.md 信息的 --dry-run 模式。用于自主测试。
- `format:changelog` 格式化全部 CHANGELOG.md 文档的。这里的匹配写法应该看情况写。
- `git:push` 推送到远程仓库。
- `changelog:conventional-changelog` bumpp 补充生成根目录 CHANGELOG.md 信息的命令。
- `release` 在本地由用户收到点击，完成 git tag 和 CHANGELOG.md 信息的生成与 push 远程推送。

### 增加关于 commit-and-tag-version 导致依赖版本错位的故障预检资料，建立内部的依赖检查机制

`commit-and-tag-version` 很容易干扰开发，其带来的低版本依赖会干扰开发，深刻地阅读以下文档，了解清楚可能的隐患故障。并设计制定好清晰的配置自检流程，确保 `conventional-changelog -p angular -i CHANGELOG.md -s` 命令的 angular 模板能够正常导入。

1. D:\code\ruan-cat\notes\docs\ruan-cat-notes\docs\bug\026-fuck-commit-and-tag-version-2026-4-9\index.md
2. D:\code\ruan-cat\notes\docs\ruan-cat-notes\docs\bug\026-fuck-commit-and-tag-version-2026-4-9\2026-04-09-conventional-changelog-angular-loader-analysis.md
3. D:\code\ruan-cat\notes\docs\ruan-cat-notes\docs\bug\026-fuck-commit-and-tag-version-2026-4-9\2026-04-09-conventional-changelog-angular-version-conflict-analysis.md
