# 拓展 `getDomains` 函数

请深度思考。

## 术语说明

- `本包` ： 即 `packages\domains\package.json` 。名为 `@ruan-cat/domains` 。
- `projectLikeDomainSet` ： `packages\domains\src\domains.ts` 的变量。

## 需求

请阅读 `packages\domains\src\utils.ts` 的 `getDomains` 函数。

请拓展该函数，我希望实现函数多态。

1. 函数的返回值都是 `string[]` 。
2. 函数有两种入参。
3. 第一种入参是传递 projectName，这个功能已经实现了。请你原样保留该处理逻辑。
4. 第二种入参是传递一个对象。该入参方式是没有实现的，请你替我实现。具体入参写法如下：

```ts
interface GetDomainsParamsWithAlias {
	/** 项目名称 */
	projectName: ProjectName;

	/** 项目别名 */
	projectAlias?: string;
}
```

需要你实现的逻辑是，根据 projectName 和 projectAlias 来查询 projectLikeDomainSet 的域名，然后拼接生成出完整的域名。

1. 如果存在 projectName，不存在 projectAlias： 那就查询 projectLikeDomainSet 内对应的 projectName，并生成拼接出全部的域名。
2. 如果存在 projectName，也存在 projectAlias： 那就在查询到对应项目的域名基础上，再去查询 projectAlias 对应的域名配置。如果查询不到，那就用 consola 输出警告，提示用户找不到 projectAlias 项目别名所对应的配置，默认返回 projectName 所对应的全部域名配置。

## 编写测试用例

1. 请你使用 vitest 来编写测试用例。
2. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
3. 测试用例的文件格式为 `*.test.ts` 。

### 测试用例地址

请在 `packages\domains\src\tests` 目录内编写测试用例。

### 配置文件与运行命令

1. 请你阅读 `configs-package\commitlint-config\package.json` 的测试命令。并在`本包`内编写相同的测试命令。
2. 在本包模仿照抄 `configs-package\commitlint-config\vitest.config.ts` 文件即可。

## 依赖项管理

涉及到的依赖项，按照这样的方式管理。

1. 将 vitest 安装为 devDependencies 。
2. 将 consola 安装为 dependencies 。

## 编写更新日志

在 .changeset 目录内，为 getDomains 函数的更新，编写更新日志。

`@ruan-cat/domains` 发版标签为 minor 。
