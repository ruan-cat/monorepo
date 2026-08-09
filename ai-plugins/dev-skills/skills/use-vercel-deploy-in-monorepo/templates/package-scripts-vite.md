> 适用：Monorepo 中的 Vite 子包。先确认 Vite 的 Vercel 产物位置，再选择一致的部署模式。

## 模式 A：根目录 `.vercel/output`

目标子包：

```json
{
  "scripts": {
    "build": "vite build --mode production",
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

Root Directory、Build Command 和 Output Directory 分别为仓库根、`pnpm run build:vercel` 和 `.vercel/output`。搬运前确认 Vite 构建实际生成了预期产物；任务配置见 [turbo-task-vite.json](turbo-task-vite.json)。

## 模式 B：子包直接产物

当 Vercel 的 Root Directory、Install Command、Build Command 和 Output Directory 都已验证使用目标子包口径时，在该 Root Directory 中执行 `pnpm run build`，Output Directory 指向实际静态产物目录。模式 B 不创建或调用根搬运任务，不能混用模式 A 的根 Build Command。
