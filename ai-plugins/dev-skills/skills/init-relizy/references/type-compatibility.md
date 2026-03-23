# 类型兼容与收口

## relizy / changelogen 的 `types`

- 过滤掉 `true` 等不符合对象型条目的噪声（以实际类型定义为准）。
- `changelogithub` 等仅保留**对象型** entries，避免类型噪声扩散到根配置。

## 配置文件的类型检查

- 若根目录 `tsconfig` 过宽导致配置脚本被误检，可收紧 `include` 或拆最小 `tsconfig` 专用于配置。

## 第三方 config 包

- 若消费侧已有 `@scope/commitlint-config` 等包，优先包根导入，减少类型收窄样板。
