# 初始化 `@ruan-cat/commitlint-config` 所需的全部配置

请深度思考。

## 术语说明

- 本项目： 即 `configs-package\commitlint-config` 目录的项目。其 package.json 为 `configs-package\commitlint-config\package.json` 。
- 本包： 即 `@ruan-cat/commitlint-config` 这个依赖包。
- 模板： 即 `configs-package\commitlint-config\templates` 目录下的文件。作为批量生成的代码模板，预期被复制粘贴到新项目内。

## 需求

请为我实现一个 cli 命令行命令，实现快速初始化一个新项目的所需配置。

未来我希望用以下形式的命令来实现配置初始化。

```bash
pnpm dlx @ruan-cat/commitlint-config init
```

或

```bash
npx @ruan-cat/commitlint-config init
```

1. 为本包开发一个 cli 命令。init 初始化命令。
2. 在某个目录内运行该命令时，就读取模板内的文件，并复制粘贴到当前目录内。
3. 预期应该初始化 `.czrc` 和 `commitlint.config.cjs` 文件。
4. 用覆盖的方式，实现文件初始化。比如某目录已经存在有 `commitlint.config.cjs` 文件时，你无需考虑过多，直接覆盖掉该文件的内容即可。
5. 最后用 consola 提示用户，完成配置文件初始化了。并提示用户可能修改覆写了原来的 `commitlint.config.cjs` 文件。

## 注意事项

在你生成代码时，请满足以下注意事项：

1. 用 typescript 实现业务。在 `configs-package\commitlint-config\src\cli.ts` 内完成业务。
2. 去 package.json 内及时补充 bin 目录配置。
3. 在 tsup.config.ts 内做适当的配置，确保命令行被打包。
