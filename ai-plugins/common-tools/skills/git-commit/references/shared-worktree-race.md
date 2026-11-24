# 共享工作副本的暂存区竞态

多个 agent 共用同一个工作副本、同一个 index、同一个 `HEAD` 时，`git add` 和 `git commit` 不是原子操作。别人的提交会把你刚放进暂存区的内容一起带走，或把暂存区清空。提交失败后如果原命令重试，会把已经变掉的 `HEAD` 再提交一次。

本文件用 `git stash` 把「即将提交的暂存树」从共享 index 上拿下来，排成只属于你自己的队列，弹出时再提交，成功后只清掉自己的队列项。

不要把用户改去使用 `git worktree`。本流程就是给「坚持单个工作副本并发」用的。

## 什么时候必须走这里

命中任意一条，就不要直接 `git commit`：

- 用户说明多个 agent 正在同一个工作副本或同一分支里提交。
- 本对话里已经出现过：暂存区在 `git add` 之后被清空、`HEAD` 在提交前变了、暂存区里出现你没有 add 的文件。
- 本轮提交失败，且失败后的 `HEAD` 与提交前记录的不同。

没命中时，仍走 `SKILL.md` 的普通步骤。普通步骤也要在 `git commit` 前记下 `HEAD`；失败后先看状态，禁止盲目重试。

## 已核对的 git 行为

下面几条是在 Git 的 `stash push --staged` 上核对过的，不要按想象改写：

1. `git stash push --staged -m "gcq|<utc>|<token>"` 只收走当前暂存区，未暂存的别人改动留在工作区。
2. 收走之后，这些路径不再处于已暂存。已跟踪文件的修改会回到 `HEAD` 内容；新文件会从工作区消失；删除会先恢复文件。内容在 stash 里。
3. `git stash pop` 不保证把内容放回暂存区。修改和删除经常是未暂存，新文件可能已经暂存。弹出后必须按弹出前记下的路径重新 `git add`。
4. PowerShell 把多行字符串传给 `git stash -m` 时，换行会被折成空格，emoji 可能变成 `?`。stash 消息只放一行 ASCII 队列键。完整提交说明写到 `git` 目录里的文件，不要写进工作区。
5. `git stash list` 的主题行形如 `On <branch>: gcq|<utc>|<token>`。用 `gcq|` 匹配，不要要求主题以 `gcq|` 开头。
6. PowerShell 里 `stash@{n}` 必须加引号。裸写会被当成语法。

## 队列键

每个待提交分组生成一次：

- `<utc>`：`yyyy-MM-ddTHH:mm:ssZ`，字典序就是时间序。
- `<token>`：8 位小写十六进制，不要用用户名、邮箱或路径。
- stash 消息只有这一行：`gcq|<utc>|<token>`

只弹出、只删除自己的 `<token>`。别人的 `gcq|` 条目留着。

## 存储

1. 记下提交前的基线：

   ```powershell
   git rev-parse HEAD
   git diff --cached --name-only -z
   ```

   路径列表为空就不要 stash。把这份以 NUL 分隔的路径原样写入 `<git-dir>/gcq/<token>.paths`。

2. 把完整提交说明写入 `<git-dir>/gcq/<token>.txt`，UTF-8，无 BOM。`<git-dir>` 用 `git rev-parse --absolute-git-dir`，不要猜 `.git` 的位置。这两个文件在 `git` 目录内，`git add` 碰不到。

3. 确认暂存区仍然只有你打算提交的路径，然后：

   ```powershell
   git stash push --staged -m "gcq|<utc>|<token>"
   ```

4. 再用 `git diff --cached --name-only` 确认你的路径已经离开暂存区。未暂存的其他改动应还在。

## 排序

```powershell
git stash list --format="%gd%x09%H%x09%s"
```

- 只保留主题里含有 `gcq|<utc>|<你的 token>` 的行。
- 按 `<utc>` 从早到晚排。
- 一次只处理最早的一条。处理下一条之前，重新列表并重新核对 hash。
- 不匹配 `gcq|` 的 stash 是用户自己的，禁止 `pop`、`drop`、`clear`。

## 弹出并提交

1. `git diff --cached --quiet` 退出码必须是 0。暂存区非空就停：不要 pop，不要 `git reset`，不要把别人的暂存内容清掉。你的内容还在自己的 stash 里。
2. `git rev-parse "stash@{n}"` 必须等于你刚从列表里抄下来的 hash。不等就重新列表。
3. 弹出：

   ```powershell
   git stash pop "stash@{n}"
   ```

4. 立刻只加回自己的路径：

   ```powershell
   git add --pathspec-from-file="<git-dir>/gcq/<token>.paths" --pathspec-file-nul
   ```

   禁止 `git add -A`、`git add .`、`git commit -a`。

5. 提交前再次 `git diff --cached --name-only -z`。路径集合必须和 `.paths` 完全一致。
   - 多出来的路径：不要提交。用带 pathspec 的命令把你自己的路径重新放回队列，不要用无路径的 `git stash push --staged`，那会把别人的暂存内容也收进你的队列：

     ```powershell
     git stash push --staged --pathspec-from-file="<git-dir>/gcq/<token>.paths" --pathspec-file-nul -m "gcq|<utc>|<token>"
     ```

   - 你的路径缺失：停止。先看 `git status --short --branch`、`git rev-parse HEAD`、`git log -1 --stat`，再看 `git stash list` 里还有没有你的 token。

6. 路径一致才提交：

   ```powershell
   git commit -F "<git-dir>/gcq/<token>.txt" --trailer "Assisted-by: <AGENT> / <MODEL>"
   ```

   `Assisted-by` 的生成规则仍以 `SKILL.md` 步骤 9 为准。不满足条件时不要加 `--trailer`。

## 失败时

先跑这三条，再决定有没有下一步：

```powershell
git status --short --branch
git rev-parse HEAD
git log -1 --oneline --stat
```

- `HEAD` 与存储前记下的不同：停止重试。读最新提交的文件列表。你的文件已经在里面，就告诉用户，不要再提交一次。不在里面，就到 `git stash list` 里找你的 `gcq|` token。
- 你的路径还在暂存区：立刻用上一节的 pathspec 命令 stash 回去，把它们从共享 index 上拿开，然后处理 hook 或 commitlint 报错。
- 禁止原样重跑刚才失败的 `git commit`。
- 禁止 `git push --force`、`git reset --hard`、`git checkout --`，也禁止对不属于你的路径执行 `git restore`。

## 清洁清空

成功提交后：

1. `pop` 已经丢掉这一条 stash。再列一次表，确认没有同一个 `gcq|<utc>|<token>`。
2. 删除 `<git-dir>/gcq/<token>.txt` 和 `<token>.paths`。
3. 如果列表里还留着你这个 token 的条目，先 `git stash show --stat "stash@{n}"`。和刚提交的内容重复，才可以在 hash 再次核对后 `git stash drop "stash@{n}"`。有独有差异就停，不要 drop。

清空只针对你自己的这一条队列项。禁止 `git stash clear`。禁止按序号 drop 一个没有再次核对 hash 的 `stash@{n}`。

## POSIX

命令标志与上面相同。`stash@{n}` 同样加引号。提交说明文件用 UTF-8 写入 `$(git rev-parse --absolute-git-dir)/gcq/`。不要把 emoji 放进 `git stash -m`。
