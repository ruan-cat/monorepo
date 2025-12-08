<!--
	一次性提示词
	未完成
 -->

# 模仿 `@ruan-cat/commitlint-config` ，为 `@ruan-cat/taze-config` 制作相同的 init 初始化命令

1. 请你阅读 configs-package\taze-config\README.md ，明确清楚 `@ruan-cat/taze-config` 需要哪些基础性质的包，可以作为初始化一个 node 项目时所使用的模板？有哪些是固定的配置文件？
2. 阅读清楚 `configs-package\commitlint-config\src\cli.ts` 的逻辑，模仿其代码写法，为 `@ruan-cat/taze-config` 也提供相似的 init 命令。
3. `@ruan-cat/taze-config` 的 init 命令处理要完成最基础的文件初始化，还要按照以下逻辑写入命令：
   - 使用 `@ruan-cat/utils` 提供的 isMonorepoProject 函数，判断当前运行的目录内，出现的 node 项目，是不是满足 isMonorepoProject 函数规则的 monorepo 项目。
   - 如果是，就在根包，即 monorepo 项目的根 package.json 内，写入 scripts.up-taze = `pnpm -w up @ruan-cat/taze-config -L && npx taze -r` 命令。
   - 否则，不是 monorepo 项目，就在检索到的相对根包，写入 scripts.up-taze = `pnpm up @ruan-cat/taze-config -L && npx taze -r` 命令。
4. 写入的命令名称必须是固定的 `up-taze` 命令。
5. 命令 `up-taze` 默认插入到 scripts 对象的第一行内。作为第一个使用的命令。
6. 如果存在 `up-taze` 命令，就覆盖覆写命令。
7. 编写 vitest 测试命令，测试命令是否能满足 2 种项目的文件复制和命令写入。
8. 模仿 `configs-package\commitlint-config\README.md`， 在 `configs-package\taze-config\README.md` 内也说明清楚命令如何使用。
9. 为 `@ruan-cat/commitlint-config` 编写发版日志，简单说明提供了：
   - init 命令用来快速初始化配置
   - 根据 monorepo 结构提供不同的 `scripts.up-taze` 命令。
