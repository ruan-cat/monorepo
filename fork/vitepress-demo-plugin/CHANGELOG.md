# @ruan-cat/vitepress-demo-plugin 更新日志

## 0.3.0

### Minor Changes

- 1. **全部子包已升级依赖**（工作区内各发布包同步刷新 `dependencies` / `devDependencies` 等声明，与当前 lockfile 对齐）。 ([`af5aa60`](https://github.com/ruan-cat/monorepo/commit/af5aa603fcdd2a5b8f5caa8b3f74bcb996500120))
  2. 根工作区同步升级 `packageManager`（pnpm）版本，便于团队统一工具链。

## 0.2.0

### Minor Changes

- 发包配置不提供 `typesVersions` ，不再对外提供该配置。类型导出由其他的配置实现。 ([`57f5fb8`](https://github.com/ruan-cat/monorepo/commit/57f5fb89ad4ede261820547821c903461c783281))

## 0.1.2

### Patch Changes

- 1. 更新依赖。 ([`208f061`](https://github.com/ruan-cat/monorepo/commit/208f061096ea936b1c021656de5efc1a7603bd27))
  2. 首页 README.md 增加了来自 automd 提供的标签，优化显示效果。

## 0.1.1

### Patch Changes

- 升级依赖。 ([`b95ea59`](https://github.com/ruan-cat/monorepo/commit/b95ea59110185efedc162a91bde541cca53a81fe))

## 0.1.0

### Minor Changes

- 发包，期望在其他子包内能够从镜像源内自动下载。
