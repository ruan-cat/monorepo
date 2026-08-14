# PR 云端 Prettier 格式化落地计划

## 1. 交付范围

本计划对应 `spec.md`，最终长期保留以下文件：

- `.github/workflows/cloud-pr-prettier.yml`
- `docs/plan/2026-8-15-cloud-ci-prettier/spec.md`
- `docs/plan/2026-8-15-cloud-ci-prettier/plan.md`

不修改：

- `package.json` 的 `format` script
- `prettier.config.mjs`
- `lint-staged.config.mjs`
- `simple-git-hooks.mjs`
- Prettier / lint-md / simple-git-hooks 依赖版本

## 2. 实施阶段

### Phase A：基线审计

- [x] 通过 Skill Router MCP 读取 `init-prettier-git-hooks` 最新固定快照。
- [x] 通过 Skill Router MCP 读取 `git-commit` 最新固定快照。
- [x] 核实根 `package.json` 已存在 `pnpm format`。
- [x] 核实 `prettier-plugin-lint-md` 精确为 `1.0.1`。
- [x] 核实 `prettier.config.mjs` 顶层字符串插件与 `endOfLine: "lf"`。
- [x] 核实 `simple-git-hooks.mjs` 已包含 lint-staged 与 commitlint。
- [x] 核实目标分支为 `dev`。

### Phase B：主工作分支

主 origin 分支：

```text
ci/cloud-pr-prettier-format
```

工作内容：

- [x] 写入 spec。
- [x] 写入 plan。
- [x] 新增 Pull Request 专用 workflow。
- [ ] 打开目标为 `dev` 的主 PR。
- [ ] 检查主 PR 首次 workflow 运行。

### Phase C：测试 PR 1——需要格式化

创建一次性 origin 分支：

```text
test/cloud-pr-prettier-format-dirty
```

分支从主工作分支创建，从而携带待测试 workflow；PR 目标仍为 `dev`。

测试输入：加入一个明显不符合项目 Prettier 输出的临时 JSON 文件，例如紧凑对象与错误间距。

验收：

- [ ] `Cloud PR Prettier` 被 `pull_request` 事件调度。
- [ ] workflow 调用 `pnpm format`。
- [ ] 临时 JSON 被格式化。
- [ ] 自动生成 `🌈 style:` 提交并写回 test branch。
- [ ] 自动提交只包含 PR allowlist 内的格式化差异。
- [ ] job 成功。

完成后：关闭测试 PR，不合并；临时 branch 交由仓库维护者删除。

### Phase D：测试 PR 2——无需格式化

创建一次性 origin 分支：

```text
test/cloud-pr-prettier-format-clean
```

分支同样从主工作分支创建，PR 目标为 `dev`。

测试输入：加入一个已经符合格式化规范的临时文本/Markdown 文件，或仅修改不在 `pnpm format` glob 中的文件。

验收：

- [ ] workflow 被调度。
- [ ] `pnpm format` 成功。
- [ ] 最终 `git diff --quiet`。
- [ ] 不产生自动格式化提交。
- [ ] job 成功。

完成后：关闭测试 PR，不合并；临时 branch 交由仓库维护者删除。

### Phase E：结果回收

- [ ] 获取主 PR 编号、head SHA 与 workflow run 状态。
- [ ] 获取两个测试 PR 编号与 workflow run 状态。
- [ ] 若测试暴露 workflow 缺陷，只在主工作分支修复正式文件，并重新验证。
- [ ] 关闭测试 PR，禁止把测试 fixture 合并进 `dev`。
- [ ] 最终只保留主 PR 等待人工审核。

## 3. Workflow 验证矩阵

| 场景                                    | 预期                                   |
| --------------------------------------- | -------------------------------------- |
| PR → `dev`，同仓库 head，存在格式差异   | 格式化、提交、推送                     |
| PR → `dev`，同仓库 head，无格式差异     | 成功，不提交                           |
| PR → `dev`，fork head                   | 写回 job 跳过                          |
| push 到任意分支                         | 不触发该 workflow                      |
| PR 修改了当前范围之外的历史未格式化文件 | 不允许由本次 workflow 带入             |
| 连续 synchronize                        | concurrency 取消旧运行，只保留最新运行 |

## 4. 故障处理

### `pnpm format` 失败

视为真实仓库格式化链路失败；workflow 失败，不提交、不推送。先修复主 PR 中的 CI 环境或项目格式化问题。

### commitlint / lint-staged 失败

不使用 `--no-verify` 绕过。自动提交必须符合当前仓库 hooks；失败意味着正式 workflow 还未达到工程约束。

### push 被拒绝

优先检查：

1. PR 是否来自 fork；
2. branch protection 是否禁止 GitHub Actions 写入；
3. repository Actions 设置是否把 `GITHUB_TOKEN` 限制为只读。

若仓库策略明确禁止 Actions 写入，则应将方案调整为“格式检查失败并要求开发者格式化”，而不是扩大 token/secrets 权限绕过策略。

### 非 PR 文件被 `pnpm format` 修改

必须被“PR 范围外副作用 restore”步骤清除。若最终 staged diff 出现范围外文件，测试失败并停止合并主 PR。

## 5. 人工审核清单

主 PR 合并前由维护者确认：

- [ ] workflow 的唯一事件源确实只有 `pull_request`。
- [ ] base branch filter 是 `dev`。
- [ ] checkout 的是真实 PR head，不是 synthetic merge ref。
- [ ] `contents: write` 是唯一显式写权限。
- [ ] fork PR 不会进入写回 job。
- [ ] 不读取任何业务 secrets。
- [ ] 调用的是现有 `pnpm format`，没有复制第二套 Prettier 参数。
- [ ] PR 范围外格式化结果会被 restore。
- [ ] 自动提交继续经过 hooks。
- [ ] 两个测试 PR 均未被合并。

## 6. 合并与清理

最终只合并主 PR 到 `dev`。

主分支在 PR 合并后可按仓库日常策略删除；两个 `test/` 分支属于一次性云测试资产，应在确认测试记录后删除。
