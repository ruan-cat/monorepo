---
name: init-prettier-git-hooks
description: 初始化或补强基于 lint-staged + simple-git-hooks + prettier 的 git 提交前代码格式化流程，并统一 `.gitattributes`、`.editorconfig`、`prettier.config.mjs` 的 LF 行尾策略，解决 Windows 上常见的 git 幽灵修改、CRLF 漂移、已有配置缺项或冲突配置未收敛的问题。只要用户提到 prettier、git hooks、lint-staged、simple-git-hooks、行尾统一、EOL、CRLF/LF、gitattributes、editorconfig、ghost modified、幽灵修改，都应该使用本技能，而不是把它当成“只能无脑覆盖模板”的初始化脚本。
user-invocable: true
metadata:
  version: "1.1.2"
---

# 初始化 Prettier + Git Hooks 格式化流程

本技能用于在任何 Node.js 项目中初始化或补强基于 `lint-staged` + `simple-git-hooks` + `prettier` 的 git 提交前格式化流程。重点不是“把模板复制进去”，而是对目标项目做**检查、合并、补全、精确覆盖**。

## 目标结果

当用户要求处理本技能时，最终应让项目具备这一整条 LF 统一链路：

1. `.gitattributes`：`* text=auto eol=lf`
2. `.editorconfig`：`[*]` 区块内存在 `end_of_line = lf`
3. `prettier.config.mjs`：`endOfLine: "lf"`，禁止保留 `"auto"`
4. `package.json`、`lint-staged.config.js`、`simple-git-hooks.mjs` 的格式化链路可正常工作
5. 执行 `git add --renormalize .` 后，git 行尾归一化完成

## 1. 定位根 package.json 并检查依赖

在安装任何依赖之前，必须先定位到项目的**根 `package.json`** 文件所在位置，并检查必需依赖是否已经安装。

### 1.1. 定位根 package.json

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

## 2. 必须创建或修改的配置文件

### 2.0. 合并总原则

本技能必须默认采用**合并策略**，而不是无条件覆盖：

1. 文件不存在：直接从模板创建。
2. 文件已存在：以模板为基线，对目标文件做**定向补全和冲突覆盖**。
3. 用户已有的项目特化配置应尽量保留，例如额外的二进制后缀、额外的 EditorConfig 区块、额外的 Prettier 插件配置。
4. 对于本技能明确要求的策略键，必须覆盖到位，不允许保留冲突值。

本技能本轮最重要的策略键只有三个：

- `.gitattributes` 的全局文本规则必须收敛为 `* text=auto eol=lf`
- `.editorconfig` 的通用区块必须收敛为 `end_of_line = lf`
- `prettier.config.mjs` 的 `endOfLine` 必须收敛为 `"lf"`

### 2.1. 创建 `prettier.config.mjs`

模板：参见 [templates/prettier.config.mjs](./templates/prettier.config.mjs)

**如果文件不存在**：

- 直接使用模板创建

**如果文件已存在**：

- 优先保留用户已有的插件、overrides、printWidth、单双引号、缩进等项目风格
- 只针对 `endOfLine` 做精确处理：
  - 如果已存在且不是 `"lf"`，必须改成 `"lf"`
  - 如果不存在，则补写 `endOfLine: "lf"`
- 明确禁止保留 `endOfLine: "auto"`，因为它在 Windows 上会继续保留或引入 CRLF

### 2.2. 创建或更新 `.gitattributes`

模板：参见 [templates/.gitattributes](./templates/.gitattributes)

**如果文件不存在**：

- 直接使用模板创建

**如果文件已存在**：

- 把全局文本规则收敛为单条：`* text=auto eol=lf`
- 如果已有以下这类宽泛规则，必须精准替换，而不是继续并存：
  - `* text=auto`
  - `*.* text eol=lf`
  - 任何把全局文本规则指向 `crlf` 的写法
- 保留已有的项目特化二进制规则，例如额外的媒体、办公文档、引擎资源、字体后缀
- 如果现有文件缺少模板中的常见二进制后缀，可以按模板补齐
- 不要删除用户手写注释，除非这些注释只是在说明旧的冲突规则

### 2.3. 创建或更新 `.editorconfig`

模板：参见 [templates/.editorconfig](./templates/.editorconfig)

**如果文件不存在**：

- 直接使用模板创建

**如果文件已存在**：

- 优先保留现有的缩进风格、每种语言的局部区块、项目特化规则
- 检查通用区块 `[*]`
  - 如果不存在 `[*]` 区块，创建一个最小通用区块并补上 `end_of_line = lf`
  - 如果已存在 `[*]` 区块但 `end_of_line` 不是 `lf`，必须改成 `lf`
  - 如果 `[*]` 区块缺少 `end_of_line`，则补上 `end_of_line = lf`
- 不要因为补 EOL 而抹掉现有的 `[*.yaml]`、`[*.md]`、`[Makefile]` 等局部区块

### 2.4. 创建 `lint-staged.config.js`

模板：参见 [templates/lint-staged.config.js](./templates/lint-staged.config.js)

如果文件已存在，确认它仍会对暂存区文件执行 `prettier --experimental-cli --write` 或等价命令。

### 2.5. 创建 `simple-git-hooks.mjs`

模板：参见 [templates/simple-git-hooks.mjs](./templates/simple-git-hooks.mjs)

如果文件已存在，确认：

- `pre-commit` 仍然会执行 `lint-staged`
- `commit-msg` 仍然会执行 `commitlint`

### 2.6. 更新 `package.json`

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

## 4. Git 行尾归一化

完成配置文件修改后，**必须**执行一次：

```bash
git add --renormalize .
```

这一步是 LF 统一链路的一部分，不要省略。它负责把已追踪文件重新按 `.gitattributes` 规则归一化并**刷新索引中的 blob**，否则历史对象里仍是 CRLF、工作区却是 LF 时，会出现「内容看似未改但 `git status` 永远脏」的幽灵差异。只改 `.gitattributes` 而不执行 `renormalize` **不会**自动重写已入库的历史行尾。

若 `git diff --cached` 出现预期内的批量行尾变更，应**单独提交**规范化（例如 `chore: normalize line endings per .gitattributes`）。**每个仍受影响的分支**都需要各自执行并提交一次 renormalize，不能指望只在主干做一次就消除所有分支的脏状态。

复盘与团队案例：[加了 `.gitattributes` 就万事大吉？必须 `git add --renormalize`](https://notes.ruan-cat.com/bug/025-gitattributes-must-use-renormalize/)。

## 5. 自检清单

完成初始化后，请逐项检查以下内容：

- [ ] 1. **依赖安装**：`package.json` 的 `devDependencies` 中包含以下依赖：
  - [ ] `prettier`
  - [ ] `@prettier/plugin-oxc`
  - [ ] `prettier-plugin-lint-md`
  - [ ] `lint-staged`
  - [ ] `simple-git-hooks`
  - [ ] `commitlint`（或 `@commitlint/cli`）

- [ ] 2. **配置文件存在**：
  - [ ] `.gitattributes` 存在
  - [ ] `.editorconfig` 存在
  - [ ] `prettier.config.mjs` 存在
  - [ ] `lint-staged.config.js` 存在
  - [ ] `simple-git-hooks.mjs` 存在

- [ ] 3. **package.json scripts**：
  - [ ] 存在 `format` 命令
  - [ ] `prepare` 命令包含 `simple-git-hooks`

- [ ] 4. **EOL 策略已收敛**：
  - [ ] `.gitattributes` 中存在 `* text=auto eol=lf`
  - [ ] `.editorconfig` 中 `[*]` 区块存在 `end_of_line = lf`
  - [ ] `prettier.config.mjs` 中 `endOfLine` 为 `"lf"`

- [ ] 5. **Git hooks 初始化**：
  - [ ] 执行 `npx simple-git-hooks` 成功

- [ ] 6. **功能验证**：
  - [ ] 执行 `pnpm format` 能正常格式化代码
  - [ ] git commit 时会自动触发 lint-staged 格式化
  - [ ] 执行 `git add --renormalize .` 后，git 状态只保留预期改动

## 6. 工作流程说明

当你执行 `git commit` 时，会自动触发以下流程：

1. **pre-commit 钩子**触发 → 执行 `npx lint-staged`
2. lint-staged 对暂存区的文件执行 `prettier --experimental-cli --write`
3. **commit-msg 钩子**触发 → 执行 `npx --no-install commitlint --edit ${1}` 校验提交信息格式

## 7. 模板清单

本技能应优先复用这些模板：

- `templates/.gitattributes`
- `templates/.editorconfig`
- `templates/prettier.config.mjs`
- `templates/lint-staged.config.js`
- `templates/simple-git-hooks.mjs`

## 8. 注意事项

1. **修改 `simple-git-hooks.mjs` 后**，务必重新执行 `npx simple-git-hooks` 命令来更新 git hooks。
2. **首次安装依赖时**，如果 pnpm 提示 `simple-git-hooks` 的 postinstall 脚本被忽略，需要执行 `pnpm approve-builds simple-git-hooks` 来允许其运行。
3. **Prettier 使用 `--experimental-cli` 参数**，这是启用实验性 CLI 功能的必要参数。
4. **不要把补 EOL 配置理解成“整文件覆盖”**。这个技能的职责就是在保留项目现状的前提下，收敛冲突键，补齐缺失键。
