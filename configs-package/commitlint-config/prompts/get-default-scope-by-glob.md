# 根据正则匹配，获取范围

请深度思考。

## 术语说明

- 本项目： 即 `configs-package\commitlint-config` 目录的项目。其 package.json 为 `configs-package\commitlint-config\package.json` 。
- `本包`： 即 `@ruan-cat/commitlint-config` 这个依赖包。
- `getDefaultScope` ：位于 `configs-package\commitlint-config\src\get-default-scope.ts` 路径内的函数。根据 git status 的信息，获取到默认`提交范围`。
- `commonScopes` ： 位于 `configs-package\commitlint-config\src\common-scopes.ts` 的对象。即 `本包` 预设的一些`提交范围`。

## 需求

在 getDefaultScope 函数内，已经实现了根据 `git status --porcelain || true` 命令，获取到文件路径，进而判断出包的可使用范围的功能。

我需要你根据 commonScopes 提供的 glob 字段，对 `git status --porcelain || true` 命令产生的文件目录，做进一步的判断判别。满足提供的 glob 匹配时，就提供该提交类型。

请你阅读以下例子，理解我的需求。

1. 请你先通读 `getDefaultScope` 的函数逻辑。
2. 请你阅读本文提供的例子，理解我需要你新增的逻辑。
3. 实现该逻辑。
4. 编写测试用例，并测试。
5. 在 .changeset 文件夹内编写该功能的发版日志。版本为 minor 版本。
6. 在 configs-package\commitlint-config\README.md 内，提供该功能的说明文档。不要写太详细，简要说明即可。我不希望 `本包` 的 `README.md` 文档过长。也请不要擅自删减 README.md 文档的其他内容。
7. 最后给我一份总结报告。

### 例子 1

比如你在 git status 命令内获取到了这样一条文件目录： `configs-package/commitlint-config/prompts/get-default-scope-by-glob.md`

比如 commonScopes 存在这样的配置项：

```json
{
	"code": "prompt",
	"value": "prompt",
	"desc": "提示词。特指和AI协作使用的提示词文件。",
	"glob": ["**/prompts/**/*.md", ".github/prompts/**/*.md"]
}
```

1. 根据现有的逻辑，可以判断出该文件的提交范围是在 `commitlint-config` 内。请不要覆盖掉，删除掉该逻辑。
2. 请你增加新的逻辑。遍历 commonScopes 数组，检查是否存在 glob 字段。如果有，就开始匹配。
3. 对路径做匹配，只要**满足其中一个** glob 匹配，就认定为该文件的提交范围**同时**包括了 `prompt` 范围。
4. 从 commonScopes 数组获取范围字段时，读取 value 的取值。
5. 根据该例子，文件 `configs-package/commitlint-config/prompts/get-default-scope-by-glob.md` 的修改范围就该是 `commitlint-config` 和 `prompt`，其中，`prompt` 这个范围是从对应的 commonScopes 数组项的 value 获取的。

### 例子 2

- commonScopes 的配置：

```json
[
	{
		"code": "config",
		"value": "config",
		"desc": "各种配置文件",
		"glob": [
			"**/*.config.js",
			"**/*.config.ts",
			"**/*.config.cjs",
			"**/*.config.mjs",
			"**/*.config.json",
			".config/**",
			"**/turbo.json"
		]
	},
	{
		"code": "turbo",
		"value": "turbo",
		"desc": "任务调度器",
		"glob": ["**/turbo.json"]
	}
]
```

- 文件路径： `packages\utils\turbo.json`

那么根据匹配，得到的范围就应该同时包含以下 3 项：

- turbo ： 因为 value 为 turbo 的 `各种配置文件` 配置项包含有 `**/turbo.json` 匹配，且匹配成功。
- config ： 因为 value 为 config 的 `任务调度器` 配置项包含有 `**/turbo.json` 匹配，且匹配成功。只要满足其中一个 `**/turbo.json` 就算匹配成功。
- utils ： 这是根据 getDefaultScope 函数的现有逻辑匹配成功的。

## 编写测试用例

1. 请你使用 vitest 来编写测试用例。
2. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
3. 测试用例的文件格式为 `*.test.ts` 。
4. 在 configs-package\commitlint-config\src\tests 目录内编写测试用例。
5. 在 `本包` 内提供一个通用的测试用例调用入口。注意，整个项目是 monorepo 项目，本包是一个 monorepo 下的一个子包，请你保证在子包调用的测试用例，只使用子包的测试。不包含整个包的测试项目。

## 其他

### 001

阅读 configs-package\commitlint-config\src\get-default-scope.ts 文件，优化代码输出。

优化以下两行的代码输出。在输出数组的时候，我希望你输出换行的字符串文本。并使用 consola 的 box 函数包裹，使其输出效果更加美观。

```ts
consola.info(`检测到 ${modifiedFiles.length} 个修改的文件:`, modifiedFiles);
consola.info(`影响的包范围:`, scopesArray);
```

### 002

请深度思考。

阅读 configs-package\commitlint-config\src\get-default-scope.ts 文件。优化代码结构。

1. 阅读以下代码片段：

```ts
// 美化输出修改的文件列表
const filesText = modifiedFiles.map((file, index) => `${index + 1}. ${file}`).join("\n");
consola.info(`检测到 ${modifiedFiles.length} 个修改的文件:`);
consola.box(`${filesText}`);
```

```ts
// 美化输出影响的包范围
const scopesText = scopesArray.map((scope, index) => `${index + 1}. ${scope}`).join("\n");
consola.info(`影响的包范围:`);
consola.box(`${scopesText}`);
```

2. 请你归纳出一个公共函数，名称为 `printList` 。函数设计如下：

- 入参 title 字段： ( (stringList: string[]) => string ) | string
- 入参 stringList 字段： string[]
- 返回值： void
