# PR 云端 Prettier 格式化落地计划

## 1. 交付范围

本计划对应 `spec.md`，最终长期保留以下文件：

- `.github/workflows/cloud-pr-prettier.yml`
- `docs/plan/2026-8-15-cloud-ci-prettier/spec.md`
- `docs/plan/2026-8-15-cloud-ci-prettier/plan.md`

不修改：

- `package.json` 的 `format` script
- `prettier.config.mjs`
- `.config/.prettierignore`
- `lint-staged.config.mjs`
- `simple-git-hooks.mjs`
- Prettier / lint-md / simple-git-hooks 依赖版本

## 2. 实施阶段

### Phase A：基线审计

- [x] 通过 Skill Router MCP 读取 `init-prettier-git-hooks` 固定快照。
- [x] 通过 Skill Router MCP 读取 `git-commit` 固定快照。
- [x] 核实根 `package.json` 已存在 `pnpm format`。
- [x] 核实 `prettier-plugin-lint-md` 精确为 `1.0.1`。
- [x] 核实 `prettier.config.mjs` 顶层字符串插件与 `endOfLine: "lf"`。
- [x] 核实 `.config/.prettierignore` 当前忽略全部 `**/*.json`。
- [x] 核实 `simple-git-hooks.mjs` 已包含 lint-staged 与 commitlint。
- [x] 核实根 commitlint 配置依赖 workspace `@ruan-cat/commitlint-config/dist/index.cjs`。
- [x] 核实目标分支为 `dev`。

Skill 固定快照：

```text
sourceCommitSha: beeada04389dca26d3d010b537d7e8af39766430
init-prettier-git-hooks: 3.0.0
git-commit: 0.6.0
```

### Phase B：主工作分支

主 origin 分支：

```text
ci/cloud-pr-prettier-format
```

工作内容：

- [x] 写入 spec。
- [x] 写入 plan。
- [x] 新增 Pull Request 专用 workflow。
- [x] 打开目标为 `dev` 的主 PR #123。
- [x] 用主 PR 真实运行验证项目安装、格式化、范围收敛、hooks、commit 与 push。

首次主 PR run `31836425223` 暴露：`pnpm i` 会安装 commit-msg hook，但不会生成 workspace `@ruan-cat/commitlint-config/dist/index.cjs`，因此自动 commit 失败。

修复方案不是 `--no-verify`，而是在 workflow 中增加：

```bash
pnpm --filter "@ruan-cat/commitlint-config..." build
```

修复后的主 PR run `31836656768` 全链路成功，bot 自动提交 `a35d51f9da766bbde323e3dbae938dcf872f50cb`，且只格式化主 PR allowlist 内的 `plan.md`。

### Phase C：测试 PR 1——需要格式化

一次性 origin 分支：

```text
test/cloud-pr-prettier-format-dirty
```

测试 PR：#124，目标 `dev`，不合并。

第一版 fixture 使用 JSON；实际验证发现仓库 `.config/.prettierignore` 明确忽略 `**/*.json`，因此 JSON 不属于生产 `pnpm format` 的有效正向 fixture。保留该发现作为 ignore 契约验证，但不将其冒充格式化成功。

第二版加入明显不符合 Prettier 的 `dirty.ts`，并以 workflow 自动提交后的规范结果作为最终分支状态。

验收：

- [x] `Cloud PR Prettier` 被 `pull_request` 事件调度。
- [x] commitlint workspace 依赖构建成功。
- [x] workflow 调用真实 `pnpm format`。
- [x] `dirty.ts` 被格式化。
- [x] 自动生成 `🌈 style:` 提交并写回 test branch。
- [x] 自动提交只包含 `dirty.ts` 一个文件。
- [x] run `31836844219` 成功。
- [x] bot commit：`87a610e8578a9729f6a9d753a6f2e93137c7c5a9`。

格式化结果：

```ts
export const cloudPrettierDirty = { cloud: "prettier", nested: { value: 1 } };
```

### Phase D：测试 PR 2——无需格式化

一次性 origin 分支：

```text
test/cloud-pr-prettier-format-clean
```

测试 PR：#125，目标 `dev`，不合并。

测试输入：

```ts
export const cloudPrettierClean = true;
```

该分支从已经经过主 workflow 自动格式化后的主工作分支创建，避免旧文档格式差异污染 clean 场景。

验收：

- [x] workflow 被调度。
- [x] commitlint workspace 依赖构建成功。
- [x] `pnpm format` 成功。
- [x] 最终无格式化 diff。
- [x] `提交格式化结果` step skipped。
- [x] `推送格式化提交到 PR head` step skipped。
- [x] head SHA 保持 `f60f7f18231b3ac7eece8364c6ff1763a777d4e8` 不变。
- [x] run `31836864967` 成功。

### Phase E：结果回收

- [x] 获取主 PR 编号与真实 workflow 运行记录。
- [x] 获取 dirty / clean 两个测试 PR 编号与运行记录。
- [x] 根据首次主 run 的 commitlint 失败修复正式 workflow。
- [x] 根据 JSON ignore 发现修正测试设计与文档。
- [x] dirty 正向写回通过。
- [x] clean 无差异路径通过。
- [x] 测试 PR #124、#125 已关闭且均未合并。
- [x] 最终 spec/plan 状态已由主 PR run `31837108251` 全链路回归成功。
- [x] 最终只保留主 PR #123 等待人工审核。

## 3. Workflow 验证矩阵

| 场景                                  | 实测/预期                             |
| ------------------------------------- | ------------------------------------- |
| PR → `dev`，同仓库 head，存在格式差异 | 已实测：格式化、commit、push          |
| PR → `dev`，同仓库 head，无格式差异   | 已实测：成功，commit/push skipped     |
| `pnpm format` 扫描到 PR 外历史脏格式  | 已实测：全部 restore，不进入自动提交  |
| workspace commitlint 尚未构建         | 已实测失败；workflow 现已先构建依赖链 |
| `.prettierignore` 排除的 JSON         | 已实测：尊重 ignore，不强制格式化     |
| PR → `dev`，fork head                 | 设计：job 条件直接跳过                |
| push 到任意分支                       | 设计：workflow 不声明 `push` trigger  |
| 连续 synchronize                      | 设计：concurrency 取消同 PR 的旧运行  |

## 4. 故障处理

### `pnpm format` 失败

视为真实仓库格式化链路失败；workflow 失败，不提交、不推送。先修复主 PR 中的 CI 环境或项目格式化问题。

### commitlint runtime 缺失

本任务已经实际遇到该问题。根 commitlint 配置要求 workspace build 产物，正式 workflow 使用：

```bash
pnpm --filter "@ruan-cat/commitlint-config..." build
```

准备 `@ruan-cat/commitlint-config` 及其 workspace 依赖后再进行自动 commit。

### commitlint / lint-staged 失败

不使用 `--no-verify` 绕过。自动提交必须符合当前仓库 hooks；失败意味着 workflow 尚未达到工程约束。

### push 被拒绝

优先检查：

1. PR 是否来自 fork；
2. branch protection 是否禁止 GitHub Actions 写入；
3. repository Actions 设置是否把 `GITHUB_TOKEN` 限制为只读。

若仓库策略明确禁止 Actions 写入，则应将方案调整为“格式检查失败并要求开发者格式化”，而不是扩大 token/secrets 权限绕过策略。

### 非 PR 文件被 `pnpm format` 修改

必须被“PR 范围外副作用 restore”步骤清除。主 PR 实测中 `pnpm format` 扫描到大量历史文件，但自动提交最终只包含 allowlist 内文件，证明该边界有效。

### fixture 被 ignore

必须先核实 `.config/.prettierignore`。本次 JSON fixture 被 `**/*.json` 排除，因此改用 TypeScript 完成正向格式化验收。

## 5. 人工审核清单

主 PR 合并前由维护者确认：

- [ ] workflow 的唯一事件源确实只有 `pull_request`。
- [ ] base branch filter 是 `dev`。
- [ ] checkout 的是真实 PR head，不是 synthetic merge ref。
- [ ] `contents: write` 是唯一显式写权限。
- [ ] fork PR 不会进入写回 job。
- [ ] 不读取任何业务 secrets。
- [ ] 调用的是现有 `pnpm format`，没有复制第二套 Prettier 参数或 ignore 规则。
- [ ] commitlint workspace 运行时在自动提交前构建。
- [ ] PR 范围外格式化结果会被 restore。
- [ ] 自动提交继续经过 lint-staged + commitlint hooks。
- [ ] dirty 与 clean 两个测试 PR 均保持“不合并”。

## 6. 合并与清理

最终只合并主 PR #123 到 `dev`。

主工作分支：

```text
ci/cloud-pr-prettier-format
```

在主 PR 合并后可按仓库日常策略删除。

一次性测试分支：

```text
test/cloud-pr-prettier-format-dirty
test/cloud-pr-prettier-format-clean
```

这两个分支只承载云端测试 fixture，不应合并进 `dev`；测试 PR 关闭后由仓库维护者删除 origin branches。
