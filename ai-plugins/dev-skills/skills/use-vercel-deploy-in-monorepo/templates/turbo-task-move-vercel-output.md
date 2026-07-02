# Turbo 任务模板索引

> 本目录下的 turbo 任务模板主要适用于**形态 1 / 模式 A**：子包构建产物需要搬运到 monorepo 根目录 `.vercel/output` 的场景。形态 1 / 模式 B 和形态 2 通常不需要单独的搬运任务。

本目录为每种框架提供独立的子包级 `turbo.json` 模板。一个子包通常只使用一种框架，因此只应复制对应模板中的任务，不要混合多个框架任务。

- [turbo-task-nuxt.json](turbo-task-nuxt.json)：Nuxt 子包模板（形态 1 / 模式 A）
- [turbo-task-nitro.json](turbo-task-nitro.json)：Nitro 子包模板（形态 1 / 模式 A）
- [turbo-task-vite.json](turbo-task-vite.json)：Vite / Vue3 子包模板（形态 1 / 模式 A）
- [turbo-task-uniapp-h5.json](turbo-task-uniapp-h5.json)：UniApp H5 子包模板（形态 1 / 模式 A 时使用搬运脚本；模式 B 时仅 `build:h5:prod` 任务有效）

通用原则：

- 构建任务（如 `nuxt:build:vercel` / `vite:build:vercel`）必须声明 `outputs: [".vercel/output/**"]`。
- 搬运任务（`move-vercel-output-to-root` / `move-h5-output-to-root`）必须声明 `dependsOn` 指向构建任务，并同样声明 `outputs` 使 Turbo 能缓存搬运结果。
