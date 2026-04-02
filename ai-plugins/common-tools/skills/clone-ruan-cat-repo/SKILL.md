---
name: clone-ruan-cat-repo
description: >-
  按固定清单快速克隆 GitHub 用户 ruan-cat 的常用仓库（及 tocque/h5mota-web）到约定目录名，
  支持浅克隆与多分支抓取等参数组合。在用户提及「克隆 ruan-cat 仓库」「拉常用仓库」
  「clone-ruan-cat」「初始化本地多仓」「同步阮喵喵 GitHub 仓库」或需要一键复现本机仓库存量时使用。
  命令清单以 references/clone-commands.md 为唯一真实来源。
user-invocable: true
metadata:
  version: "0.1.0"
---

# Clone ruan-cat Repo

将维护者约定的 GitHub 仓库克隆到本地，目录名已在命令中写死（如 `01s-11comm`、`monorepo`）。

## 首要原则

1. **命令来源**：只使用 `[references/clone-commands.md](references/clone-commands.md)` 中的 `git clone` 行，禁止凭记忆改写 URL、depth 或目录名。
2. **工作目录**：在用户期望存放**多个仓库的父目录**中执行；先 `cd` 到该父目录再运行命令。
3. **幂等与冲突**：若目标目录已存在，`git clone` 会失败。应先与用户确认是否跳过、换父目录，或删除/改名旧目录后再执行。

## 工作流程

1. 确认父路径（例如 `~/code` 或用户指定的盘符路径）。
2. 读取 `references/clone-commands.md`，按文件中的顺序执行每一条 `git clone`。
3. 若用户只要**子集**：仅执行与仓库名或本地目录名匹配的命令行，并说明省略了哪些条目。
4. 网络或权限失败：记录失败仓库与报错；其余仓库可继续执行（与用户确认是否重试）。

## 浅克隆与多分支

清单中部分仓库使用 `--depth=N` 与 `--no-single-branch`，意在减小体积且保留拉取其它远程分支的能力。  
若克隆后仍出现「看不到远程分支」类问题，再按需使用 **`get-git-branch`** 技能诊断本地 `remote.origin.fetch`。

## 维护规则

- **增删仓库或改克隆参数**：仅编辑 `references/clone-commands.md`。
