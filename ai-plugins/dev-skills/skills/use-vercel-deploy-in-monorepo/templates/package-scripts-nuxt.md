> 适用：Monorepo 中的 Nuxt 子包。构建脚本只执行 Nuxt 构建；跨包依赖和根产物搬运由 Turbo 任务图表达。

## 模式 A：根目录 `.vercel/output`

目标子包：

```json
{
  "scripts": {
    "build": "nuxi build --preset vercel",
    "move-vercel-output-to-root": "move-vercel-output-to-root"
  }
}
```

根 `package.json`：

```json
{
  "scripts": {
    "build:vercel": "turbo run move-vercel-output-to-root --filter=<target-package>"
  }
}
```

Root Directory、Build Command 和 Output Directory 分别为仓库根、`pnpm run build:vercel` 和 `.vercel/output`。任务配置见 [turbo-task-nuxt.json](turbo-task-nuxt.json)。

## 模式 B：子包直接产物

当 Vercel 的 Root Directory、Install Command、Build Command 和 Output Directory 均为目标子包口径时，不创建根搬运任务。在该 Root Directory 中执行 `pnpm run build`，Output Directory 指向子包的 `.vercel/output`；不能与模式 A 的根设置混用。
