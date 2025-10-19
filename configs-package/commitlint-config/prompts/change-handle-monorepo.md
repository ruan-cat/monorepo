# 更改处理 monorepo 项目的识别逻辑

1. 针对依赖包 `@ruan-cat/commitlint-config` 。
2. 全面阅读 `configs-package\commitlint-config\src` 下面的全部代码。
3. 深度思考，搞清楚本包是如何识别目标项目是 monorepo 项目的。是如何判别目标项目是 monorepo 项目的。
4. 给出一个计划，做好修改逻辑的准备。请专门做一个独立的函数。判断目标项目是否是 monorepo 格式的项目。判别逻辑为： 目标项目同时存在 `pnpm-workspace.yaml` 文件，且 `pnpm-workspace.yaml` 提供了有效的 packages 匹配配置时，才能被定为是 monorepo 项目。
