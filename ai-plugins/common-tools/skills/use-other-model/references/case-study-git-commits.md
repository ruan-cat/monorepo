# 实际案例:批量 Git 提交

**场景**:需要创建 4 个独立的 git 提交,每个提交涉及不同的文件和类型。

## 主会话编写的执行计划 (`git-commit-plan.md`)

````markdown
# Git Commit 提交计划

## 提交拆分方案(共 4 个提交)

### 提交 1:删除依赖

**类型**:`deps` (破坏性变更)
**Scope**:`admin`
**文件**:

- `apps/admin/package.json`
- `pnpm-lock.yaml`

**提交信息文件**:`commit-msg-1.txt`

```plain
📦 deps(admin)!: 删除 @neondatabase/auth 依赖

BREAKING CHANGE: 移除 Neon Auth 集成,改用自定义认证方案
```

**执行命令**:

```bash
cd apps/admin
git add package.json ../../pnpm-lock.yaml
git commit -F commit-msg-1.txt
```

**验证**:

- [ ] 提交成功
- [ ] 工作树中不再包含这两个文件的变更

### 提交 2:清理配置

**类型**:`config` (破坏性变更)
**Scope**:`admin`
**文件**:

- `apps/admin/nuxt.config.ts`
- `apps/admin/server/middleware/auth.ts`

**提交信息文件**:`commit-msg-2.txt`

```plain
🔧 config(admin)!: 清理 Neon Auth 相关配置

BREAKING CHANGE: 移除 Neon Auth 中间件和配置
```

**执行命令**:

```bash
git add nuxt.config.ts server/middleware/auth.ts
git commit -F commit-msg-2.txt
```

### 提交 3:添加文档

**类型**:`docs`
**Scope**:`admin`
**文件**:

- `apps/admin/src/docs/reports/2026-03-03-production-500-error-debug.md`

**提交信息文件**:`commit-msg-3.txt`

```plain
📃 docs(admin): 添加生产环境 500 错误调试报告
```

**执行命令**:

```bash
git add src/docs/reports/2026-03-03-production-500-error-debug.md
git commit -F commit-msg-3.txt
```

### 提交 4:更新中间件

**类型**:`chore`
**Scope**:`admin`
**文件**:

- `apps/admin/server/middleware/logger.ts`
- `apps/admin/src/docs/README.md`

**提交信息文件**:`commit-msg-4.txt`

```plain
🐳 chore(admin): 更新文档和日志中间件
```

**执行命令**:

```bash
git add server/middleware/logger.ts src/docs/README.md
git commit -F commit-msg-4.txt
```

## 最终验证

执行完所有提交后,运行:

```bash
git status
git log --oneline -4
```

确认:

- [ ] 工作树干净(no changes)
- [ ] 本地分支领先 origin/dev 4 个提交
- [ ] 所有提交信息符合规范
````

## 主会话生成的启动脚本 (`execute-git-commit.sh`)

```bash
#!/bin/bash

unset CLAUDECODE

export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"

claude -p \
  --permission-mode bypassPermissions \
  --tools default \
  --output-format json \
  --append-system-prompt "你是 unattended coding agent。不要反问。先读 git-commit-plan.md，再执行，再验证，完成后退出。" \
  "请先阅读 git-commit-plan.md。按其中计划完成 4 个 git 提交，并把执行摘要写入 execution-log.md。"
```

## 执行结果

**成功完成的 4 个提交**:

```bash
b07ec868 🐳 chore(admin): 更新文档和日志中间件
21b5d77b 📃 docs(admin): 添加生产环境 500 错误调试报告
24b68722 🔧 config(admin)!: 清理 Neon Auth 相关配置
59c4a278 📦 deps(admin)!: 删除 @neondatabase/auth 依赖
```

**Token 使用对比**:

- 直接执行预计:~39,000 tokens
- 实际使用:主会话 5,200 + 子会话 8,500 = 13,700 tokens
- **节省比例:约 65%**

## 关键要点

1. **详细的执行计划**:每个提交都有明确的文件列表、提交信息和验证步骤
2. **文件方式提交仍然有价值**:使用 `git commit -F commit-msg-x.txt` 依然能避免中文提交信息在终端拼接时出现乱码或转义问题
3. **子会话必须是执行代理**:启动命令显式使用 `-p`、`--permission-mode bypassPermissions`、`--tools default`
4. **逐步验证**:每个提交后验证工作树状态
5. **显著的 token 节省**:通过委托给更便宜的模型,节省了 65% 的 token
