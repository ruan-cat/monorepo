# 任务封包模板

方案 B 启动前,主代理必须先写任务封包。

这份封包不是可选附录,而是子会话能否稳定工作的前提。

## 使用要求

1. 封包必须在启动子会话前写好
2. 子会话的第一步必须是阅读封包
3. 如果封包本身存在冲突,子会话应直接停止并报告冲突
4. 不要把关键约束只写在聊天 prompt 里

## 标准模板

```markdown
# Task Packet

## Working directory

- Repository root: `/absolute/path/to/repo`
- Run all commands from this directory unless a step explicitly says otherwise.

## Branch

- Expected branch: `dev`
- Do not switch branches.

## Read first

- `path/to/file-a`
- `path/to/file-b`
- `path/to/file-c`

## Goal

- [用 2-4 条写清楚最终目标]

## Allowed edits

- `path/to/allowed-file-a`
- `path/to/allowed-dir/**`

## Do not do

- Do not edit files outside the allowed scope.
- Do not rewrite unrelated code.
- Do not ask follow-up questions unless this packet contains direct contradictions.
- Do not claim completion without running the required verification commands.

## Verification commands

- `pnpm test --filter ...`
- `pnpm build --filter ...`
- `[其他必须执行的命令]`

## Browser verification target

- Required: `yes` / `no`
- URL: `http://localhost:5173/#/`
- If required, see the browser verification checklist attached below.

## Required output log

Write an execution log that includes:

1. Start time
2. Files read
3. Files changed
4. Commands executed
5. Verification results
6. Browser observations
7. Problems encountered
8. End time
9. Final status

## Completion rule

You are done only if:

1. Allowed edits are finished
2. Required verification commands have passed
3. Browser verification is completed or explicitly marked blocked with reason
4. The execution log is complete
5. You exit immediately after writing the result
```

## 推荐补充字段

如果任务较复杂,建议再加:

- `## Acceptance checklist`
- `## Known constraints`
- `## Existing bugs to ignore`
- `## Output files`
- `## Rollback trigger`

## 填写建议

### Working directory

必须是明确的绝对路径,不要写“当前目录”。

### Read first

只列真正需要先读的文件,不要把整个仓库目录都塞进去。

### Allowed edits

要能清楚约束子会话的写入范围。  
如果范围不清楚,就先不要启动方案 B。

### Verification commands

只写真正能证明任务完成的命令。  
不要把和任务无关的全仓重验证当默认项。

### Completion rule

这一节必须显式写出“什么时候算完成”,否则子会话很容易提前停。
