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
