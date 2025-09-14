# 处理针对 `git status --porcelain` 命令的字符串拆分时出现的故障

请深度思考。

请阅读 configs-package\commitlint-config\src\get-default-scope.ts 文件的以下处理逻辑：

```ts
// 3. 解析修改的文件路径
const modifiedFiles = gitStatusOutput
	.split("\n")
	.map((line) => line.trim())
	.filter((line) => line.length > 0)
	.map((line) => {
		// git status --porcelain 格式：XY filename
		// 提取文件名（跳过前两个状态字符和空格）
		return line.substring(3);
	})
	.filter((filePath) => filePath.length > 0);
```

这段逻辑是运行 `git status --porcelain` 命令后，对文件目录以及状态进行字符串拆分。

请注意以下的几个例子：

## 错误例子 1

- 命令输出结果：

```log
M  packages/utils/src/print.ts
 M packages/utils/src/prompts/print-list.md
```

- 字符串拆分结果：

```txt
packages/utils/src/print.ts
ackages/utils/src/prompts/print-list.md
```

## 错误例子 2

- 命令输出结果：

```log
M  packages/utils/src/print.ts
 M packages/utils/src/prompts/print-list.md
?? configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md
```

- 字符串拆分结果：

```txt
packages/utils/src/print.ts
ackages/utils/src/prompts/print-list.md
configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md
```

## 错误例子 3

- 命令输出结果：

```log
AM configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md
M  packages/utils/src/print.ts
 M packages/utils/src/prompts/print-list.md
```

- 字符串拆分结果：

```txt
configs-package/commitlint-config/prompts/fix-git-status-file-path-error.md
packages/utils/src/print.ts
ackages/utils/src/prompts/print-list.md
```

## 更改处理逻辑

结合上述例子，我希望你更改处理逻辑。

getDefaultScope 函数，在运行 `git status --porcelain` 并做拆分时：

1. 只处理位于文件暂存区的文件。有些文件不在文件暂存区的。我们只管控位于文件暂存区的文件，其他文件不做处理。剔除掉。
2. 拆分字符串文本时，请完整的拆分路径。不要出现裁切过多的情况。比如字符串 `M packages/utils/src/prompts/print-list.md` ，被裁切成 `ackages/utils/src/prompts/print-list.md` ，完整的 `packages` 单词被你拆分成 `ackages` ，这不对。这影响了其他的处理逻辑。

## 编写测试用例

1. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
2. 测试用例的文件格式为 `*.test.ts` 。
3. 在 `configs-package\commitlint-config\src\tests` 目录内编写测试用例。

测试用例要结构化，便于我增加新的测试用例字符串。

## 其他

### 001

请深度思考。

1. 请你将 getDefaultScope 函数的 `解析修改的文件路径` 逻辑，单独拆分成一个函数，拆分到 `configs-package\commitlint-config\src\get-default-scope.ts` 内，并对外导出。
2. 请你未拆分出来的新函数，创建单独的测试用例。就在 `configs-package\commitlint-config\src\tests` 目录内编写测试用例。
3. 请你将 `configs-package\commitlint-config\src\tests\get-default-scope.test.ts` 关于 `解析修改的文件路径` 的逻辑，拆分到你新创建的测试用例内。
