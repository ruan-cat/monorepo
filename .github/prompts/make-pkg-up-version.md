# 配置 `.changeset\config.json` 文件，使得依赖包发版时可以协同升级

我希望在 `@ruan-cat/utils` 发生 patch 升级时，其他依赖 `@ruan-cat/utils` 的依赖包也会同步更新自己的版本号，并更新对应的更新日志。

比如 `@ruan-cat/release-toolkit` 包依赖了 `@ruan-cat/commitlint-config` 包，如果 `@ruan-cat/commitlint-config` 包发生了 patch 升级，那么 `@ruan-cat/release-toolkit` 的版本号也要升级。

对于 monorepo+pnpm 的项目而言，我希望被依赖的包升级后，上游的依赖包也要共同升级版本号。

请你帮我实现这个需求。以前我升级是可以的，现在不行了。请帮我解决这个故障，并实现该需求。

请你运行 `changeset version` 命令，来检查其他包的版本号是否共同变更。

在你本地测试时，请临时使用 `"changelog": "@changesets/cli/changelog",` 写法。
