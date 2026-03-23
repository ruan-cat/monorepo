# 配置落盘骨架（模板）

> 插槽语义、字段约束与类型收口见 [`references/config-templates.md`](../references/config-templates.md) 与 [`references/type-compatibility.md`](../references/type-compatibility.md)。
> `relizy-runner` 行为与参数见 `packages/utils/src/node-esm/scripts/relizy-runner/index.md`（或 [raw 文档](https://raw.githubusercontent.com/ruan-cat/monorepo/refs/heads/dev/packages/utils/src/node-esm/scripts/relizy-runner/index.md)）；兼容策略见 [`references/windows-compatibility.md`](../references/windows-compatibility.md) 与 [`references/baseline-tags.md`](../references/baseline-tags.md)。

## 1. 依赖（根 `package.json`）

**推荐（使用 `@ruan-cat/utils` 的 `relizy-runner`）**：在目标仓库**安装** npm 包 **`@ruan-cat/utils`** 与 **`relizy`**（版本以 registry 与团队约束为准），例如：

```bash
pnpm add -D @ruan-cat/utils relizy
```

（亦可用 `npm install -D`、`yarn add -D` 等与目标仓库一致的包管理器。）

安装完成后，根 `package.json` 的 `devDependencies` 中应出现上述两个包；具体版本范围以目标仓库的包管理器与锁文件为准。

**不再**为执行 runner 而添加 `tsx` 或新建 `scripts/relizy-runner.ts`；runner 由 `@ruan-cat/utils` 的 `bin` 提供。

若已通过 `pnpm patch` 路线且不使用 `relizy-runner`，可省略 `@ruan-cat/utils`，并须按 [`references/windows-compatibility.md`](../references/windows-compatibility.md) 处理 baseline tag。

## 2. 根 `package.json` 脚本

**推荐（使用 `relizy-runner` bin）**：

```json
{
	"scripts": {
		"release": "relizy-runner release --no-publish --no-provider-release",
		"release:dry": "relizy-runner release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes",
		"changelog": "relizy-runner changelog"
	}
}
```

等价写法：`pnpm exec relizy-runner …` 或 `npx relizy-runner …`。亦可使用文档中的 `npx ruan-cat-utils relizy-runner …` 统一入口。

所有发版入口都经过 `relizy-runner`，保证 Windows 兼容与 baseline tag 预检始终生效。

通过 pnpm 向 relizy 追加参数时使用 `--` 分隔，例如：`pnpm release -- --patch --dry-run`。

**备选（已验证无需 `relizy-runner`，且仅 Linux 环境）**：

```json
{
	"scripts": {
		"release": "pnpm exec relizy release",
		"changelog": "pnpm exec relizy changelog"
	}
}
```

## 3. 不在仓库内新建 runner 脚本

接入时**不要**复制或编写本地 `scripts/relizy-runner.ts`。基线 tag 预检与工作区包发现由 `@ruan-cat/utils` 内置实现（基于根目录 `pnpm-workspace.yaml` 解析，详见 [`references/baseline-tags.md`](../references/baseline-tags.md)）。

## 4. `changelog.config.ts`（骨架）

```ts
import { defineConfig } from "changelogen/config";

export default defineConfig({
	// types / templates 等：按仓库与 changelogen 约定填写
});
```

导入策略：优先使用**包根导出**（`package.json` 的 `exports`），避免不必要的 `src/*` 深路径。

## 5. `relizy.config.ts`（骨架）

须包含默认 **`release`** 配置块（与各子开关语义见 relizy 文档；此处为技能约定的基线）：

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
});
```

## 6. `pnpm-workspace.yaml`

仅在需要调整工作区范围时修改；`monorepo.packages` 与 workspace glob 保持一致。`relizy-runner` 的基线 tag 预检会依据根目录 `pnpm-workspace.yaml` 展开 `一级目录/*` 形式的 glob 发现子包（与实现一致时无需本地脚本）。

## 7. pnpm patch（若不使用 `relizy-runner` 而改用 patch）

在 `package.json` 中记录 `pnpm.patchedDependencies`，补丁文件放在 `patches/` 下，并在 README 说明维护方式与升级重评流程。注意：patch 不解决 baseline tag 问题，需另行处理（见 [`references/baseline-tags.md`](../references/baseline-tags.md)）。

## 8. 最小根 `tsconfig`（可选）

仅在根目录配置文件需被 tsc 消费且现网无合适 include 时添加；限制 `include` 范围，避免把整仓拉进类型检查。
