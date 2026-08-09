---
name: init-prettier-git-hooks
description: >-
  初始化或补强 Node.js 项目的 Prettier、lint-staged、simple-git-hooks 与 LF
  行尾配置。适用于 prettier、git hooks、EOL、CRLF/LF 和幽灵修改问题。
user-invocable: true
metadata:
  version: "2.0.0"
---

# 初始化 Prettier + Git Hooks

本技能完全由 AI 按后续流程审计目标项目，再直接、精准地修改目标配置；只分发操作说明与五份配置模板。不得创建或调用独立迁移程序，也不得绕过审计批量覆盖或自动盲改。

## 1. 先确认操作根与现状

1. 从当前目录向上定位根 package.json。pnpm monorepo 以 `pnpm-workspace.yaml` 所在目录为根；npm/yarn workspace 以声明 `workspaces` 的 `package.json` 所在目录为根。
2. 读取根 `package.json`、五个目标配置，并用 `git status --short`、`git diff`、`git diff --cached` 检查 Git 状态。已有改动默认属于用户，禁止覆盖、回滚或纳入无关修改。
3. 扫描并逐个读取所有 Prettier 配置候选：根 `package.json` 的 `prettier` 字段、`prettier.config.*` 与 `.prettierrc*`。统计实际有效的配置来源；发现多个活跃来源、配置继承关系不明或无法判断哪个配置生效时，停止修改并请用户确认，禁止直接创建新配置造成双配置。
4. 先向用户列出将创建、覆盖或定点修改的文件。依赖安装、Git Hook 安装、`git add --renormalize .` 等会修改 package、lockfile、`.git/hooks` 或暂存区的动作，必须获得用户明确授权后才能执行。

## 2. 五份模板

- `templates/.editorconfig`
- `templates/.gitattributes`
- `templates/prettier.config.mjs`
- `templates/lint-staged.config.mjs`
- `templates/simple-git-hooks.mjs`

目标文件不存在时可直接复制对应模板。目标文件存在时逐文件精准合并，保留项目特化规则与事故说明注释；不要整文件覆盖。

## 3. 精确依赖与命令

在根 `devDependencies` 检查 `prettier`、`@prettier/plugin-oxc`、`prettier-plugin-lint-md`、`lint-staged`、`simple-git-hooks`。只有项目已有有效 commitlint 配置时，才检查并使用 `@commitlint/cli`，否则不生成 `commit-msg`。

`prettier-plugin-lint-md` 必须精确安装为 `prettier-plugin-lint-md@1.0.1`。仅在用户授权后安装缺失依赖，例如：

```powershell
pnpm add -Dw prettier @prettier/plugin-oxc prettier-plugin-lint-md@1.0.1 lint-staged simple-git-hooks
```

`package.json` 的活动命令应为：

```json
{
	"scripts": {
		"format": "prettier --experimental-cli --write --no-parallel .",
		"prepare": "simple-git-hooks"
	}
}
```

已有 `prepare` 时保留原命令并串联 `simple-git-hooks`。所有包含 `--experimental-cli` 的活动命令必须在同一命令内带且只带一个 `--no-parallel`；这是避免 lint-staged/pre-commit 场景出现 `WorkTankWorkerError` 的事故规则。

## 4. 逐文件处理

### Prettier

保留已有项目风格与 overrides，并保证 `endOfLine: "lf"`。lint-md 1.0.1 必须以对象形式注册：

```js
import prettierPluginLintMd from "prettier-plugin-lint-md";

export default {
	plugins: [prettierPluginLintMd],
};
```

只有在唯一有效旧配置是采用 ESM 的 JavaScript/MJS 文件，并且能够合法加入上述 default import 时，才允许自动迁移。其顶层 `plugins` 还必须是静态数组，且数组中包含精确字符串元素 `"prettier-plugin-lint-md"`；AI 可以定点加入上述 default import，并只把该字符串元素替换为 `prettierPluginLintMd`。同一数组可以包含其他字面量插件；必须保留其他元素、原有顺序和注释。

若字符串插件位于 `package.json#prettier`、JSON/JSONC/YAML `.prettierrc*`、CJS 配置或其他不能合法使用 ESM default import 的载体中，必须停止修改并请用户决定：迁移为 `prettier.config.mjs`，或采用用户指定的人工方案。遇到动态 plugins、spread、computed key、变量间接引用、多个 Prettier 配置或无法唯一定位顶层配置时，同样停止修改并请用户人工处理；不得把 import 插入非 JavaScript 载体，也不得用正则猜测迁移。

带注释 JSON 只添加精确文件列表的 `parser: "jsonc"` override，禁止把全部 `**/*.json` 改为 JSONC，也不得删除事故说明注释来绕过格式化问题。

### LF 三层

1. `.gitattributes` 的全局文本规则收敛为 `* text=auto eol=lf`，保留二进制与路径特化规则。
2. `.editorconfig` 的 `[*]` 区块收敛为 `end_of_line = lf`，保留其他区块。
3. `prettier.config.mjs` 收敛为 `endOfLine: "lf"`。

只改 `.gitattributes` 不会刷新 Git index。`git add --renormalize .` 会改变暂存区，必须先展示影响并获得授权；多分支需要分别处理。

### lint-staged 与 Hooks

`lint-staged.config.mjs` 使用 `prettier --experimental-cli --write --no-parallel`。`simple-git-hooks.mjs` 默认只配置 `pre-commit`；仅在确认项目已有有效 commitlint 配置后保留或加入 `commit-msg`。遇到 Husky、lefthook、自定义 `core.hooksPath` 或其他 Hook 管理器时停止并请用户决定，不得覆盖。

模板中的可选 `post-commit` 事故注释必须保留；该命令可能覆盖同一文件的未暂存改动，默认不得启用。

## 5. 验证

配置编辑后先运行只读验证：

```powershell
pnpm exec prettier --check <本次修改的文件>
pnpm exec prettier --check <中英文与数字混排的 Markdown 样例>
node --check lint-staged.config.mjs
git diff --check
git status --short
```

需要验证 VSCode 时，用项目实际 `prettier.config.mjs` 格式化同一小型样例，确认 lint-md 对象插件生效。不得用全仓 `pnpm format` 代替定点检查。

`pnpm exec lint-staged --debug` 不是只读检查：它会执行 lint-staged 任务，可能改写文件、暂存区并触发 stash 流程。只有用户授权后，才运行该命令、`pnpm exec simple-git-hooks`、真实提交验证或 `git add --renormalize .`；执行前后必须展示 `git status --short`、`git diff` 和 `git diff --cached`。
