---
name: get-git-branch
description: "诊断并修复 Git 仓库无法看到所有远程分支的问题，将受限的 fetch refspec 恢复为通配符模式，使 git fetch 能拉取全部远程分支。当用户提及「看不到远程分支」「分支不全」「只有 master/main」「fetch 所有分支」「shallow clone 补全分支」「--single-branch 修复」「远程分支丢失」「获取全部分支」等关键词时使用此技能。即使用户没有明确提到 refspec 或 shallow clone，只要意图是让仓库能看到并拉取所有远程分支，就应触发此技能。"
user-invocable: true
metadata:
  version: "0.1.0"
---

# Get Git Branch

诊断并修复 Git 仓库的远程分支不可见问题，将受限的 fetch 配置恢复为完整模式。

## 背景知识

使用 `git clone --depth=1` 或 `git clone --single-branch` 克隆仓库时，Git 会自动将 `.git/config` 中的 fetch refspec 限制为只拉取默认分支。例如：

```ini
[remote "origin"]
    url = https://example.com/repo.git
    fetch = +refs/heads/master:refs/remotes/origin/master
```

这导致 `git fetch --all` 和 `git branch -a` 都只能看到默认分支，其他远程分支完全不可见。但远程仓库上那些分支仍然存在，只是本地配置不去拉取它们。

理解这个根因很重要——问题不在网络或权限，而在于本地的一行配置。

## 工作流程

### 第一步：诊断问题

同时执行以下三个命令，收集足够的信息来判断问题根因：

```bash
# 1. 查看本地能看到的所有分支
git branch -a

# 2. 查看 fetch refspec 配置（关键诊断点）
git config --get remote.origin.fetch

# 3. 直接查询远程服务器上实际存在的分支
git ls-remote --heads origin
```

**判断逻辑：**

| `git config --get remote.origin.fetch` 输出     | 含义                       | 处理方式                   |
| :---------------------------------------------- | :------------------------- | :------------------------- |
| `+refs/heads/master:refs/remotes/origin/master` | fetch 被限制为单分支       | 继续第二步修复             |
| `+refs/heads/main:refs/remotes/origin/main`     | 同上（只是默认分支名不同） | 继续第二步修复             |
| `+refs/heads/*:refs/remotes/origin/*`           | fetch 配置正常             | 问题在别处，见「其他情况」 |

同时对比 `git branch -a` 和 `git ls-remote --heads origin` 的结果：

- 如果 `ls-remote` 显示的分支比 `branch -a` 多，确认是本地 fetch 配置问题
- 如果 `ls-remote` 也只有一个分支，那远程确实只有一个分支，无需修复

### 第二步：修改 fetch refspec

将 fetch 规则从单分支改为通配符模式：

```bash
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
```

这条命令将 `.git/config` 中的 fetch 行从：

```plain
+refs/heads/master:refs/remotes/origin/master
```

改为：

```plain
+refs/heads/*:refs/remotes/origin/*
```

星号 `*` 表示匹配所有分支名，这是正常 `git clone`（不带 `--single-branch`）的默认配置。

### 第三步：拉取所有远程分支

```bash
git fetch --all
```

此时 Git 会按照新的通配符规则，从远程拉取所有分支的引用。

### 第四步：验证结果

```bash
git branch -a
```

确认所有远程分支都已出现在 `remotes/origin/` 下。向用户展示完整的分支列表。

### 第五步（可选）：补全提交历史

如果仓库是浅克隆的（`--depth=1`），上述步骤只补全了分支引用，提交历史仍然是截断的。如果用户需要完整历史：

```bash
git fetch --unshallow
```

这会下载完整的提交历史，耗时取决于仓库大小。只在用户明确需要时执行，因为大仓库的完整历史可能非常大。

判断是否为浅克隆：

```bash
git rev-parse --is-shallow-repository
# true = 浅克隆，false = 完整历史
```

## 其他情况

如果 fetch refspec 已经是通配符但仍然看不到分支，按以下顺序排查：

1. **网络问题**：`git ls-remote --heads origin` 是否能成功连接远程
2. **权限问题**：是否有权限访问远程仓库的所有分支
3. **缓存过期**：尝试 `git remote update origin --prune` 清理过期的远程引用
4. **多 remote**：检查 `git remote -v`，分支可能在其他 remote 上

## 注意事项

- 修改 fetch refspec 是安全操作，不会影响已有的本地分支或工作树
- `git fetch --all` 只下载引用和相关对象，不会自动创建本地分支或修改工作树
- 如果用户需要在某个远程分支上工作，可以用 `git checkout <branch-name>` 自动创建追踪分支
