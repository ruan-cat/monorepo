# 更改处理 monorepo 项目的识别逻辑

1. 针对依赖包 `@ruan-cat/commitlint-config` 。
2. 全面阅读 `configs-package\commitlint-config\src` 下面的全部代码。
3. 深度思考，搞清楚本包是如何识别目标项目是 monorepo 项目的。是如何判别目标项目是 monorepo 项目的。
4. 给出一个计划，做好修改逻辑的准备。请专门做一个独立的函数。判断目标项目是否是 monorepo 格式的项目。判别逻辑为： 目标项目同时存在 `pnpm-workspace.yaml` 文件，且 `pnpm-workspace.yaml` 提供了有效的 packages 匹配配置时，才能被定为是 monorepo 项目。

## 01 回答 AI 问题

你分析的很好，请你将相似的 monorepo 识别逻辑，单独抽象成独立的函数，避免重复冗余编码，造成阅读困难。

1. packages 配置的有效性判断：
   - 空数组 `packages: []` - 就不应该认定为有效的 monorepo，这不是有意义的 monorepo 配置。
   - 只有无效的 `glob packages: ['!**/*']` - 不是有效的 monorepo。
   - 匹配不到任何 package.json - 不算是 monorepo。
   - 什么算"有效"？ 至少能匹配到一个 package.json，就算是有效的 monorepo。
2. 新函数的设计：
   - 命名： `isMonorepoProject()`
   - 放置位置： 放在 utils.ts 中。
   - 返回值类型： 方案 A：简单的 boolean
3. 异常处理： 抛出错误（让用户修复配置）。
4. 重构范围： 同时重构 `getPackagesNameAndDescription` 和 `getPackagePathToScopeMapping` 函数。
5. 测试覆盖：
   - 新增 check-monorepo.test.ts 测试新函数。
   - 测试场景： 按照你的建议即可。
