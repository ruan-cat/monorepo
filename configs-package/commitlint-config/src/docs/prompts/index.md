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
