---
"@ruan-cat/utils": minor
---

1. 一次性清理共享 `dist` 以消除并行 tsup 构建删除声明的竞态。
2. 收紧 Node.js 24 ESM 兼容依赖边界，保障 pnpm workspace 下发行入口稳定加载。
