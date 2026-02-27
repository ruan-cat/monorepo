---
name: init-prettier-git-hooks
description: 初始化基于 lint-staged + simple-git-hooks + prettier 的 git 提交前代码格式化流程。用于在任何 Node.js 项目中快速搭建代码格式化和 git 钩子配置。
user-invocable: true
metadata:
  version: "0.14.0"
---

# 初始化 Prettier + Git Hooks 格式化流程

本技能用于在任何 Node.js 项目中初始化基于 `lint-staged` + `simple-git-hooks` + `prettier` 的 git 提交前代码格式化流程。

## 1. 定位根 package.json 并检查依赖

在安装任何依赖之前，必须先定位到项目的**根 `package.json`** 文件所在位置，并检查必需依赖是否已经安装。

### 1.1. 定位根 package.json

根据项目类型不同，定位策略如下：

|              项目类型              |                                   定位方式                                    |              识别标志               |
| :--------------------------------: | :---------------------------------------------------------------------------: | :---------------------------------: |
|   **Monorepo（pnpm workspace）**   | 从当前目录向上查找 `pnpm-workspace.yaml` 文件，其所在目录即为 monorepo 根目录 |     存在 `pnpm-workspace.yaml`      |
| **Monorepo（npm/yarn workspace）** |          从当前目录向上查找含有 `"workspaces"` 字段的 `package.json`          | `package.json` 含 `workspaces` 字段 |
|            **普通项目**            |                    当前项目目录的 `package.json` 即为根包                     |             无上述标志              |

**操作步骤**：

1. 读取当前项目的 `package.json`，检查是否存在 `workspaces` 字段
2. 检查当前目录及其上级目录是否存在 `pnpm-workspace.yaml`
3. 如果发现 monorepo 标志，切换到 monorepo 根目录操作；否则在当前目录操作
4. 确认根 `package.json` 的绝对路径，后续所有依赖安装和检查都针对该文件

### 1.2. 检查必需依赖

必须在根 `package.json` 的 `devDependencies` 中逐一检查以下 **6 个必需依赖包**是否已安装：

|  #  |         依赖名称          |                说明                 | 必需 |
| :-: | :-----------------------: | :---------------------------------: | :--: |
|  1  |        `prettier`         |         核心代码格式化工具          |  ✅  |
|  2  |  `@prettier/plugin-oxc`   |   使用 oxc 引擎解析 JS/TS，更快速   |  ✅  |
|  3  | `prettier-plugin-lint-md` |       Markdown 文件格式化插件       |  ✅  |
|  4  |       `lint-staged`       | 只对 git 暂存区文件执行 lint/format |  ✅  |
|  5  |    `simple-git-hooks`     |      轻量级 git hooks 管理工具      |  ✅  |
|  6  |       `commitlint`        |        git 提交信息规范校验         |  ✅  |

**检查流程**：

1. 读取根 `package.json` 的 `devDependencies` 字段
2. 逐一检查上表中的 6 个依赖名称是否存在于 `devDependencies` 键列表中
3. 记录检查结果，标记哪些依赖**已安装**、哪些**缺失**
4. 输出检查报告（示例见下方）

**检查报告格式**：

```markdown
### 依赖检查结果

根 package.json 路径：`/path/to/root/package.json`
项目类型：Monorepo（pnpm workspace）

|         依赖名称          |        状态         |
| :-----------------------: | :-----------------: |
|        `prettier`         | ✅ 已安装 (^3.7.4)  |
|  `@prettier/plugin-oxc`   | ✅ 已安装 (^0.1.3)  |
| `prettier-plugin-lint-md` | ✅ 已安装 (^1.0.1)  |
|       `lint-staged`       | ✅ 已安装 (^16.2.6) |
|    `simple-git-hooks`     | ✅ 已安装 (^2.13.1) |
|       `commitlint`        |       ❌ 缺失       |

缺失依赖数量：1
```

### 1.3. 安装缺失依赖

根据检查结果决定后续操作：

- **全部已安装**：跳过安装步骤，直接进入步骤 2（配置文件创建）
- **存在缺失**：仅安装缺失的依赖，不重复安装已有的

```bash
# 仅安装缺失的依赖（示例：仅缺失 commitlint）
pnpm add -D commitlint
```

如果是全新项目（所有依赖都缺失），执行完整安装命令：

```bash
pnpm add -D prettier @prettier/plugin-oxc prettier-plugin-lint-md lint-staged simple-git-hooks commitlint
```

> **注意**：在 monorepo 项目中，务必在**根目录**执行安装命令（使用 `-w` 标志或确保 cwd 是根目录），以将这些开发依赖安装到根 `package.json`。

## 2. 必须创建/修改的配置文件

### 2.1. 创建 `prettier.config.mjs`

从模板复制：参见 [templates/prettier.config.mjs](./templates/prettier.config.mjs)

### 2.2. 创建 `lint-staged.config.js`

从模板复制：参见 [templates/lint-staged.config.js](./templates/lint-staged.config.js)

### 2.3. 创建 `simple-git-hooks.mjs`

从模板复制：参见 [templates/simple-git-hooks.mjs](./templates/simple-git-hooks.mjs)

### 2.4. 更新 `package.json`

需要在 `package.json` 中添加/修改以下内容：

**scripts 部分新增命令：**

```json
{
	"scripts": {
		"format": "prettier --experimental-cli --write .",
		"prepare": "<原有的 prepare 命令> && simple-git-hooks"
	}
}
```

说明：

|   命令    |                 说明                  |
| :-------: | :-----------------------------------: |
| `format`  |     手动格式化整个项目的所有文件      |
| `prepare` | 在 npm install 后自动初始化 git hooks |

**注意：** 如果项目原本没有 `prepare` 命令，则直接设置为 `"prepare": "simple-git-hooks"`。

## 3. 初始化 Git Hooks

配置文件创建完成后，需要执行以下命令来初始化 git hooks：

```bash
# 如果 simple-git-hooks 的 postinstall 脚本被阻止，需要先批准
pnpm approve-builds simple-git-hooks

# 执行初始化 git hooks
npx simple-git-hooks
```

成功后会看到类似输出：

```log
[INFO] Successfully set the pre-commit with command: npx lint-staged
[INFO] Successfully set the commit-msg with command: npx --no-install commitlint --edit ${1}
[INFO] Successfully set all git hooks
```

## 4. 自检清单

完成初始化后，请逐项检查以下内容：

- [ ] 1. **依赖安装**：`package.json` 的 `devDependencies` 中包含以下依赖：
  - [ ] `prettier`
  - [ ] `@prettier/plugin-oxc`
  - [ ] `prettier-plugin-lint-md`
  - [ ] `lint-staged`
  - [ ] `simple-git-hooks`
  - [ ] `commitlint`（或 `@commitlint/cli`）

- [ ] 2. **配置文件存在**：
  - [ ] `prettier.config.mjs` 存在
  - [ ] `lint-staged.config.js` 存在
  - [ ] `simple-git-hooks.mjs` 存在

- [ ] 3. **package.json scripts**：
  - [ ] 存在 `format` 命令
  - [ ] `prepare` 命令包含 `simple-git-hooks`

- [ ] 4. **Git hooks 初始化**：
  - [ ] 执行 `npx simple-git-hooks` 成功

- [ ] 5. **功能验证**：
  - [ ] 执行 `pnpm format` 能正常格式化代码
  - [ ] git commit 时会自动触发 lint-staged 格式化

## 5. 工作流程说明

当你执行 `git commit` 时，会自动触发以下流程：

1. **pre-commit 钩子**触发 → 执行 `npx lint-staged`
2. lint-staged 对暂存区的文件执行 `prettier --experimental-cli --write`
3. **commit-msg 钩子**触发 → 执行 `npx --no-install commitlint --edit ${1}` 校验提交信息格式

## 6. 注意事项

1. **修改 `simple-git-hooks.mjs` 后**，务必重新执行 `npx simple-git-hooks` 命令来更新 git hooks。
2. **首次安装依赖时**，如果 pnpm 提示 `simple-git-hooks` 的 postinstall 脚本被忽略，需要执行 `pnpm approve-builds simple-git-hooks` 来允许其运行。
3. **Prettier 使用 `--experimental-cli` 参数**，这是启用实验性 CLI 功能的必要参数。
