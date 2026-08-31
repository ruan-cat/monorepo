---
name: init-prettier-git-hooks
description: >-
  Use when 初始化或纠偏 Node.js 项目的 Prettier、lint-staged、simple-git-hooks、LF
  行尾配置，或需要在 GitHub PR 云端任务中安装 Node/pnpm 环境并安全格式化 PR 改动；适用于
  prettier-plugin-lint-md 版本漂移、插件加载失败、git hooks、EOL、CRLF/LF 和幽灵修改问题。
user-invocable: true
metadata:
  version: "4.0.0"
---

# 初始化 Prettier + Git Hooks

本技能由 AI 审计目标项目后逐文件定点修改；只分发操作说明、六份配置模板和历史引用。不得创建或调用迁移 CLI、运行时代码或批量覆盖工具。先确认配置所有权和用户改动，再执行最小修改。

## 最高优先级契约

1. `prettier-plugin-lint-md` 必须精确使用 `1.0.1`：`package.json` 声明、lockfile 解析版本与运行时解析版本必须一致。禁止 `^1.0.1`、`~1.0.1` 或 `1.0.3`。
2. 在唯一生效的 Prettier 配置顶层使用字符串：

   ```js
   plugins: ["prettier-plugin-lint-md"],
   ```

   禁止 lint-md 顶层对象导入，禁止仅在 Markdown override 中注册。不得用一条入口局部通过来推翻这两条契约。

原因和被废弃的方案见 [references/version-matrix.md](references/version-matrix.md)、[references/runtime-loading-model.md](references/runtime-loading-model.md) 与 [references/decision-evolution.md](references/decision-evolution.md)。

## 1. 确认操作根、配置所有权与用户边界

1. 从当前目录向上定位根 `package.json`。pnpm monorepo 以 `pnpm-workspace.yaml` 所在目录为根；npm/yarn workspace 以声明 `workspaces` 的 `package.json` 所在目录为根。
2. 读取根 `package.json`、lockfile、五个目标配置，并用 `git status --short`、`git diff`、`git diff --cached` 检查 Git 状态。已有改动默认属于用户，禁止覆盖、回滚、暂存或纳入无关修改。
3. 扫描并逐个读取根 `package.json` 的 `prettier` 字段、`prettier.config.*` 与 `.prettierrc*`。发现多个活跃来源、继承关系不明或无法确定唯一有效配置时，停止并请用户决定，禁止新建双配置。
4. 在修改前列出将创建或定点修改的文件。依赖安装、Hook 安装、`git add --renormalize .` 等会修改 package、lockfile、`.git/hooks` 或暂存区的动作，必须获得用户明确授权。

## 2. 六份模板

- `templates/.editorconfig`
- `templates/.gitattributes`
- `templates/prettier.config.mjs`
- `templates/lint-staged.config.mjs`
- `templates/simple-git-hooks.mjs`
- `templates/cloud-pr-prettier.yml`（必须安装的 GitHub PR 云端格式化工作流）

目标文件缺失时可以复制对应模板；存在时必须逐文件定点合并，保留项目特化规则与事故说明注释，不得整文件覆盖。尤其 `prettier.config.mjs` 顶层 lint-md `plugins` 上方的完整 JSDoc 是受保护知识块：它记录版本漂移、对象方案、override 方案和三条入口的纠偏。不得删除、压缩、挪到无关位置或改成普通行注释；需要调整时先更新对应 `references/`，再保持 JSDoc 与现行契约一致。

## 3. 精确依赖和活动命令

在根 `devDependencies` 检查 `prettier`、`@prettier/plugin-oxc`、`prettier-plugin-lint-md`、`lint-staged`、`simple-git-hooks`。只有项目已有有效 commitlint 配置时，才检查并使用 `@commitlint/cli`，否则不生成 `commit-msg`。

仅在用户授权后，使用精确依赖安装命令：

```powershell
pnpm add -Dw prettier @prettier/plugin-oxc prettier-plugin-lint-md@1.0.1 lint-staged simple-git-hooks
```

安装后不可只看依赖字段：读取 lockfile，并从项目执行根解析 `prettier-plugin-lint-md/package.json`，三处都必须是 `1.0.1`。pnpm 严格隔离的“找不到包”与版本入口错误是不同问题，按 [references/pnpm-resolution.md](references/pnpm-resolution.md) 分流。

普通 CLI、experimental CLI 与 VSCode 是三条不同加载入口：

- 普通 CLI：用于基础格式化与字符串插件发现。
- experimental CLI：活动命令保留且只保留一个 `--no-parallel`。
- VSCode：使用工作区 Prettier 和顶层 `resolveConfig().plugins`；修改依赖或解析规则后需要重启扩展窗口。

`package.json` 的 experimental 活动命令形态如下；已有 `prepare` 时保留原命令并串联 `simple-git-hooks`：

```json
{
	"scripts": {
		"format": "prettier --experimental-cli --write --no-parallel .",
		"prepare": "simple-git-hooks"
	}
}
```

默认活动命令不重复传入 `--plugin`：A/B 实验证明 experimental CLI 从根 cwd 向上发现配置后，顶层字符串已能自动加载 lint-md。显式 `--plugin` 只作为插件解析故障的诊断/隔离验证手段，不是更健壮的生产配置。命令边界详见 [references/runtime-loading-model.md](references/runtime-loading-model.md)。

## 4. 逐文件处理

### Prettier

保留已有项目风格和 overrides，确保 `endOfLine: "lf"`。lint-md 必须是唯一生效配置顶层的字符串元素：

```js
export default {
	plugins: ["prettier-plugin-lint-md"],
	endOfLine: "lf",
};
```

仅当唯一有效配置的顶层 `plugins` 是可定位的静态数组，才允许 AI 将其中精确的对象导入或字符串迁移为上述字符串元素。迁移时只处理 lint-md，保留其他字面量插件、原有顺序和注释。动态 plugins、spread、computed key、变量间接引用、多配置或无法唯一定位顶层配置时，停止并请用户决定；不得用正则猜测迁移。

`package.json#prettier`、JSON/JSONC/YAML `.prettierrc*` 或 CJS 配置同样可以表达字符串插件；若唯一有效配置不具备明确且安全的定点修改位置，停止并请用户决定是否迁移为 `prettier.config.mjs`。不要为了对象 import 把配置迁移成 ESM。

带注释 JSON 只为精确文件列表添加 `parser: "jsonc"` override；禁止把全部 `**/*.json` 改为 JSONC，也不得删除事故说明注释绕过格式化问题。

### LF 三层

1. `.gitattributes` 的全局文本规则收敛为 `* text=auto eol=lf`，保留二进制与路径特化规则。
2. `.editorconfig` 的 `[*]` 区块收敛为 `end_of_line = lf`，保留其他区块。
3. `prettier.config.mjs` 收敛为 `endOfLine: "lf"`。

只改 `.gitattributes` 不会刷新 Git index。`git add --renormalize .` 会修改暂存区；必须展示影响并获得授权，多分支分别处理。不要将 CRLF 问题与 lint-md 未加载混为同一根因。

### lint-staged 与 Hooks

`lint-staged.config.mjs` 使用 `prettier --experimental-cli --write --no-parallel`。`simple-git-hooks.mjs` 默认只配置 `pre-commit`；确认已有有效 commitlint 配置后才能保留或加入 `commit-msg`。遇到 Husky、lefthook、自定义 `core.hooksPath` 或其他 Hook 管理器时停止并请用户决定，不得覆盖。

模板中的可选 `post-commit` 事故注释必须保留；该命令可能覆盖同一文件的未暂存改动，默认不得启用。

## 5. 验证

不要只运行 `prettier --check`，插件未加载时它仍可能通过。以临时目录或临时样例验证后清理：

```powershell
# 版本三层一致性：依赖声明、lockfile、运行时解析均为 1.0.1
pnpm exec prettier --write <Markdown 样例>
pnpm exec prettier --experimental-cli --no-parallel --write <Markdown 样例>
node --check lint-staged.config.mjs
git diff --check
git status --short
```

两条 CLI 都必须证明同一中英文、数字混排 Markdown 样例确实发生 lint-md 规则变换。VSCode 验收必须确认扩展使用工作区 Prettier、`resolveConfig(真实文件路径).plugins` 含顶层字符串，且编辑器格式化同一样例产生相同结果。完整剧本见 [references/verification-playbook.md](references/verification-playbook.md)。

`pnpm exec lint-staged --debug` 不是只读检查：它会执行 lint-staged 任务，可能改写文件、暂存区并触发 stash 流程。只有用户授权后，才运行该命令、`pnpm exec simple-git-hooks`、真实提交验证或 `git add --renormalize .`；执行前后必须展示 `git status --short`、`git diff` 和 `git diff --cached`。

## 6. GitHub PR 云端格式化（无条件安装）

将 `templates/cloud-pr-prettier.yml` 无条件复制到目标项目的 `.github/workflows/`；不得把该模板当作可选安装项。在同仓 PR 的安全 job 内，模板校准 PR head 后必须无条件执行 `pnpm install --frozen-lockfile`，不得依赖 `setup-js` 的 `auto-install` 或通过条件跳过依赖安装；fork PR 仍按下方安全边界跳过写回 job。该工作流必须满足以下边界：

1. 使用 `pull_request` 事件（`opened`、`synchronize`、`reopened`、`ready_for_review`）和按 PR 编号的 concurrency；禁止为了取得写权限改用 `pull_request_target`，也不要在不检查仓库归属时执行来自 fork 的代码。
2. 仅当 `github.event.pull_request.head.repo.full_name == github.repository` 时允许提交和推送。fork PR 只能执行只读检查，不能把不受信任的代码与写权限放进同一个 job。
3. 不得引用目标仓库的本地 composite action 或 monorepo 专用初始化动作。环境初始化按 sxzz `setup-js` 的可迁移顺序执行：checkout PR head → `pnpm/action-setup` → `actions/setup-node`（Node 版本、pnpm cache）→ `pnpm install`。默认使用 `--frozen-lockfile`；没有 lockfile 或项目明确要求例外时，才由项目维护者显式关闭。
4. 工作流应从 `package.json#packageManager` 或仓库现有配置识别 Node/pnpm 版本；不要把某个 monorepo 的私有包名、filter、脚本或 action 路径写进通用模板。Action 版本应固定到已审查的版本（生产仓库优先使用不可变 SHA，并保留版本注释）。
5. 只取得 `base.sha...head` 之间的可格式化文件，逐个调用项目本地 `pnpm exec prettier --experimental-cli --no-parallel --write`；不得格式化整个仓库，也不得把 lockfile、生成物或用户未修改文件加入提交。
6. 格式化后先对精确文件列表执行 `git diff --cached --check`。没有变化时不提交；有变化时使用 `github-actions[bot]` 身份提交，并只推送 PR head 分支。`permissions` 至少显式声明 `contents: write`、`pull-requests: read`，并保持 job 级同仓库条件。

通用模板和安全/可迁移性说明见 [references/pr-workflow.md](references/pr-workflow.md)。
