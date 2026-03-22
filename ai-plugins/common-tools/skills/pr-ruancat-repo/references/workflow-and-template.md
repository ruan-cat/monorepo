# 执行规范与输出模板

## A. 执行规范

### A1. 协调者阶段（统一内容）

每次任务先统一生成以下 4 项，再分发到各仓库 Agent：

1. `prTitle`：PR 标题
2. `prBody`：PR 正文（Markdown）
3. `commitMessage`：commit 信息（遵循 git-commit 规范）
4. `sourceBranch`：来源分支名（所有仓库一致）

执行清单（协调者）：

- [ ] 先读取 `git-commit` 技能文档
- [ ] 先读取 `commit-types.ts`（确认 emoji/type）
- [ ] 先生成 `commitMessage`，再派生 `prTitle`
- [ ] 生成 `prBody`（覆盖改动内容、原因、验证方式）
- [ ] 冻结统一内容，不允许子 Agent 私自改写

### A2. 子 Agent 阶段（单仓库）

对每个仓库执行：

1. 校验仓库可访问（存在且有权限）
2. 决策目标分支（`dev > main > master`）
3. 发起 PR
4. 返回结果（成功/失败 + URL/错误原因）

### A3. 故障处理

- 某仓库失败：记录失败原因，继续下一个仓库
- 所有仓库结束后统一汇总，不因单点失败中断整体流程

## B. 输出模板

````markdown
## 批量 PR 汇总报告

### 统一内容

- **PR 标题**: {{prTitle}}
- **来源分支**: {{sourceBranch}}
- **commit**:
  ```txt
  {{commitMessage}}
  ```

### 仓库执行结果

| 仓库                | 目标分支 | PR 链接 | 状态 | 说明     |
| :------------------ | :------- | :------ | :--: | :------- |
| `ruan-cat/notes`    | `dev`    | <url>   |  ✅  | 创建成功 |
| `ruan-cat/monorepo` | `main`   | -       |  ❌  | 无写权限 |
````

## C. commit 生成约束

1. 必须先读取 `git-commit` 技能规范。
2. Emoji 与 type 以 `commit-types.ts` 为准。
3. 破坏性变更必须使用 `type(scope)!:` + `BREAKING CHANGE:`。
4. 提交信息必须使用中文。
5. 标准格式：
   - 普通变更：`<emoji> type(scope): summary`
   - 破坏性变更：`<emoji> type(scope)!: summary`
6. `prTitle`、`prBody` 与 `commitMessage` 必须语义一致，不得相互冲突。
7. 批量任务仅允许一份统一 `commitMessage`，所有仓库复用同一文案。
