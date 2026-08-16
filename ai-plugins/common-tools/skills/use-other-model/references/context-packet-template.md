# 任务封包模板

主代理在启动外部模型或独立执行器前填写本封包。它定义范围、身份、验收和状态所有权；如果封包本身冲突，先修封包，不启动真实任务。

## 标准模板

```markdown
# Task Packet

## Role

- Role: `execution` / `diagnostic` / `audit`
- Model tier: `weak` / `medium` / `strong`
- Final decision owner: 主代理

## Working directory

- Repository root: `<absolute-task-root>`
- Expected branch: `<branch-or-n/a>`
- Do not switch workspaces or branches unless explicitly authorized.

## Read first

- `<path>`
- `<path>`

## Goal

- `<goal-item>`
- `<goal-item>`

## Read allowlist

- `<path-or-glob>`

## Write allowlist

- `<path-or-glob>`

## Expected changed files

- `<exact-path>`

## Forbidden paths

- `<path-or-glob>`

## Forbidden actions

- Do not access files outside the declared scope.
- Do not install dependencies unless explicitly authorized.
- Do not modify tests/evaluations/scoring/verifier/CI/acceptance rules to make the task pass unless those files are the explicit task target.
- Do not git commit/push, publish, deploy, migrate production data, write long-term memory, or change external task status unless explicitly authorized.

## Model identity

- Provider: `<provider-or-default>`
- Model: `<model-or-default>`
- Variant: `<variant-or-none>`
- Session: `<session-or-none>`
- Permission mode: `<actual-mode>`

## Tool / skill scope

- Tool allowlist: `<tool-or-recorded-limitation>`
- Skill allowlist: `<skill-or-recorded-limitation>`
- If the CLI cannot enforce an allowlist, record that limitation instead of pretending it is enforced.

## Verification commands

- `<frozen-command>`

## Expected artifacts

- `<path-or-output>`

## Budgets

- Time: `<limit>`
- Token: `<limit-or-unavailable>`
- Retry limit: `1`

## Result fields

The execution agent may write only:

- `agent_proposed_status`
- `changed_files`
- `commands_run`
- `evidence`
- `remaining_risks`

The execution agent must not write:

- `verifier_status`
- `human_accepted`

## Browser verification

- Required: `yes` / `no`
- URL: `<url-or-n/a>`
- If required, attach `frontend-browser-verification-template.md`.

## Completion rule

The execution role is finished only when:

1. the assigned actions are complete or explicitly blocked;
2. frozen verification commands were run where applicable;
3. changed files and evidence were reported;
4. remaining risks were reported;
5. the agent exits without assigning verifier or human acceptance status.
```

## Preflight

主代理在模型调用前检查：

1. `working_directory` 是否真实存在且是任务根目录。
2. read/write allowlist、expected changed files、forbidden paths 是否无冲突。
3. 跨工作区路径是否显式列入读白名单且可达。
4. 显式 provider 路径是否记录完整 `provider/model`。
5. 认证配置是否存在；不要读取或打印秘密值。
6. permission/tool/skill scope 是否按当前 CLI 的真实能力记录。
7. verification commands / tests / verifier / CI / acceptance 是否已经冻结。
8. time/token budget 是否填写；拿不到 token 数据写 `unavailable`。
9. retry limit 是否为 1。
10. 报告中期望的 CLI 参数是否由当前 `--help` 证明存在。

任一硬门失败：

`PREFLIGHT_BLOCKED`

不要先调用真实任务 prompt 再等待模型发现问题。

## Role boundaries

### execution

只改允许范围，执行明确动作和冻结验证；不扩需求、不做最终根因/架构/安全签字。

### diagnostic

只提供原始证据、复现、候选假设和排除链；主代理定案。

### audit

工作树冻结后只读检查；不修改实现，不复用执行者结论作为独立证据。

## Git 提交类附加字段

仅当委托本身就是 Git 提交工作时追加：

```yaml
git_commit_plan:
  exclude:
    - <excluded-worktree-change>
  groups:
    - type: <type>
      scope: <scope>
      emoji: <emoji>
      files:
        - <path>
      summary: <summary>
  identity_check: <client-model-trailer-result>
```

普通委托不要为了复用 git-commit 模板强行加入这些字段。

## 输出日志

Execution log 至少包含：

1. 实际 CLI / provider / model / variant / session
2. working directory
3. files read
4. files changed
5. commands run
6. raw evidence path
7. verification output summary
8. permission/tool errors
9. remaining risks
10. `agent_proposed_status`

Verifier 输出单独记录，不能覆盖 execution log。

## 相关文档

- `delegation-contract.md`：任务合同和 preflight 解释
- `evidence-verification.md`：状态所有权和独立验证
- `failure-routing.md`：失败分层和重试
- `frontend-browser-verification-template.md`：前端浏览器验收
