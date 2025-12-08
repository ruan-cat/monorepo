# 提示词文件

## 01 增强 convertCommitTypesToCzGitFormat 函数

阅读以下文件：

- configs-package\commitlint-config\src\commit-types.ts
- configs-package\commitlint-config\src\utils.ts

针对 convertCommitTypesToCzGitFormat 函数，我希望实现描述文本的智能对齐，确保提交类型选择界面的美观性。

确保最后拼接的文本，其 type 字段从左对齐。中间的竖线 `|` 保持一条线。

如图所示，这种文本对齐效果就很难看，其 type 字段没有从左对齐，且中间的竖线 `|` 也没有保持一条线。

![2025-11-11-01-24-32](https://s2.loli.net/2025/11/11/3R9WtDJ5wHMCaQB.png)

### 01 继续修改

如下图所示，还是没有对齐。请继续修改。

![2025-11-11-01-28-13](https://s2.loli.net/2025/11/11/zBkARbvoDqU5rwH.png)

![2025-11-11-01-28-25](https://s2.loli.net/2025/11/11/orqwT2WlUEOXx9c.png)

![2025-11-11-01-28-53](https://s2.loli.net/2025/11/11/LCZcTPju1qHpiNJ.png)

### 02 为 emoji 和后面的 type 提交类型之间增加适当的空格

如下图，还是没有对齐，请修改。

对于 convertCommitTypesToCzGitFormat 函数，请为 emoji 和后面的 type 提交类型之间增加适当的空格。便于你对齐。

![2025-11-11-01-31-59](https://s2.loli.net/2025/11/11/r3svfD4qUzKA7bZ.png)

### 03 增加文本对齐机制

如下图，文本对齐效果很差：

![2025-11-11-01-35-41](https://s2.loli.net/2025/11/11/UIzB645hHGPKJrp.png)

我希望 convertCommitTypesToCzGitFormat 函数的对齐机制包括：

1. 最前面的 emoji 图标，靠左对齐。其后面至少增加一个空格吗，便于和下一项对齐。
2. 提交类型。即来自 commitTypes 数组的 type 字段。
3. description 描述字段。
4. longDescription 长描述字段。该字段前缀有竖线 `|` ，便于间隔区分。使得整个效果更加美观。

## 02 避免滥用 root 范围

包 `configs-package\commitlint-config` 会生成 git commit 提交规范中常见的提交范围，而 root 字符串，作为一个提交范围，被滥用了。我希望在针对性的场景下，使用 root 范围。

### commonScopes 为 root 配置增加合理的，常见的 glob 匹配

`configs-package\commitlint-config\src\common-scopes.ts` 的 commonScopes，**至少增加**这一款 glob 匹配语法：

#### 不属于 root 范围的文件

凡是在 `.XXX` 开头的文件夹下面的更改，都不算做在 root 范围内更改。比如以下范围内的文件修改，就不能被认定为 root 范围：

- `.vscode\extensions.json` 因为开头的文件夹 `.vscode` 包括点号。
- `.github\workflows\ci.yaml` 因为开头的文件夹 `.github` 包括点号。
- `.claude-plugin\marketplace.json` 因为开头的文件夹 `.claude-plugin` 包括点号。
- `.claude\agents\package-linter.md` 因为开头的文件夹 `.claude` 包括点号。
- `.changeset\config.json` 因为开头的文件夹 `.changeset` 包括点号。

还有很多类似的例子，这里就不枚举。

#### 在一般意义下属于 root 范围的文件

以下文件被认定为属于 root 范围：

- `.gitattributes`
- `.gitignore`
- `.czrc`
- `.nvmrc`
- `.npmrc`

#### 根据文件修改路径来判断 root 范围，而不是根据文件名

请不要根据具体的文件名来判断目标文件的修改路径是否是 root 范围，比如以下例子：

- `.gitignore` 属于 root 范围
- `packages\utils\.gitignore` 不属于 root 范围

### getPackagePathToScopeMapping 函数不要随便的就增加 root 范围

`configs-package\commitlint-config\src\get-default-scope.ts` 的 getPackagePathToScopeMapping 函数，和 getDefaultScope 或者是其他相关的范围处理函数，不要随意的，简单的增加默认的 root 范围。root 范围应该是根据 glob 匹配，匹配出来的。而不是滥用的，总是默认提供的 root 范围。

## 03 迁移 isMonorepoProject 函数到 `@ruan-cat/utils` 包内

1. 请你将 configs-package\commitlint-config\src\utils.ts 的 isMonorepoProject 函数，迁移到 `@ruan-cat/utils` 包内。新建一个专门的 monorepo.ts 文件，存放该函数。
2. 在 packages\utils\src\node-cjs\index.ts 内对外导出 monorepo.ts 文件提供的工具。
3. 在 packages\utils\src\index.ts 内对外导出 monorepo.ts 文件提供的工具。
4. 将 configs-package\commitlint-config\src\tests\check-monorepo.test.ts 剪切迁移到 `@ruan-cat/utils` 包内，迁移测试用例。
5. 及时构建一次 `@ruan-cat/utils` 包。确保生成一次完整的类型信息，便于 `@ruan-cat/commitlint-config` 使用。
6. 让 `@ruan-cat/commitlint-config` 正确的使用来自 `@ruan-cat/utils` 包的 isMonorepoProject 函数。注意从 `node-cjs` 路径内导入 isMonorepoProject 函数。至此完成对 isMonorepoProject 函数的重构。
7. 为 `@ruan-cat/utils` 编写独立的发版日志，重点说明新增了一款在默认环境下以及 cjs 环境内均可以使用的 isMonorepoProject monorepo 检测工具。发版标签为 minor。
8. 为 `@ruan-cat/commitlint-config` 编写独立的发版日志，说明内部完成了代码重构。发版标签为 minor 。
