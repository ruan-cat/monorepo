# 配置落盘骨架（模板）

> 插槽语义、字段约束与类型收口见 [`references/config-templates.md`](../references/config-templates.md) 与 [`references/type-compatibility.md`](../references/type-compatibility.md)。
> Runner 落地原理见 [`references/windows-compatibility.md`](../references/windows-compatibility.md) 与 [`references/baseline-tags.md`](../references/baseline-tags.md)。

## 1. 依赖（根 `package.json`）

```json
{
	"devDependencies": {
		"relizy": "...",
		"tsx": "..."
	}
}
```

`tsx` 用于执行 runner（`tsx scripts/relizy-runner.ts`）。若已通过 `pnpm patch` 路线且不使用 runner，可省略 `tsx`。

## 2. 根 `package.json` 脚本

**推荐（使用 runner）**：

```json
{
	"scripts": {
		"release": "tsx scripts/relizy-runner.ts release",
		"release:dry": "tsx scripts/relizy-runner.ts release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes",
		"changelog": "tsx scripts/relizy-runner.ts changelog"
	}
}
```

所有发版入口都经过 runner，保证 Windows 兼容与 baseline tag 预检始终生效。

**备选（已验证无需 runner，且仅 Linux 环境）**：

```json
{
	"scripts": {
		"release": "pnpm exec relizy release",
		"changelog": "pnpm exec relizy changelog"
	}
}
```

## 3. `scripts/relizy-runner.ts`

复制 [`templates/relizy-runner.ts`](relizy-runner.ts) 到仓库 `scripts/relizy-runner.ts`，然后**只修改 `getWorkspacePackages()` 中的扫描目录**，使其覆盖 `relizy.config.ts` 中 `monorepo.packages` 所指向的所有子包目录。

## 4. `changelog.config.ts`（骨架）

```ts
import { defineConfig } from "changelogen/config";

export default defineConfig({
	// types / templates 等：按仓库与 changelogen 约定填写
});
```

导入策略：优先使用**包根导出**（`package.json` 的 `exports`），避免不必要的 `src/*` 深路径。

## 5. `relizy.config.ts`（骨架）

```ts
import { defineConfig } from "relizy";
import changelogConfig from "./changelog.config";

export default defineConfig({
	types: changelogConfig.types,
	templates: {
		...(changelogConfig.templates ?? {}),
	},
	monorepo: {
		versionMode: "independent",
		// ⚠️ 必须与真实 pnpm-workspace.yaml 对齐，禁止照抄其他仓库
		packages: ["apps/*", "packages/*"],
	},
	changelog: {
		rootChangelog: true,
		includeCommitBody: true,
		formatCmd: "pnpm run format:changelog",
	},
});
```

## 6. `pnpm-workspace.yaml`

仅在需要调整工作区范围时修改；`monorepo.packages` 与 workspace glob 保持一致。

## 7. pnpm patch（若不使用 runner 而改用 patch）

在 `package.json` 中记录 `pnpm.patchedDependencies`，补丁文件放在 `patches/` 下，并在 README 说明维护方式与升级重评流程。注意：patch 不解决 baseline tag 问题，需另行处理（见 [`references/baseline-tags.md`](../references/baseline-tags.md)）。

## 8. 最小根 `tsconfig`（可选）

仅在根目录配置文件需被 tsc 消费且现网无合适 include 时添加；限制 `include` 范围，避免把整仓拉进类型检查。
