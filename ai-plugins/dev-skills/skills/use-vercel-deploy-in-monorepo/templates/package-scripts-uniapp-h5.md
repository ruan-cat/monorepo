> 适用：Monorepo 中的 UniApp H5 子包。先确定 Vercel 是读取子包静态产物，还是读取仓库根 `.vercel/output`。

## 模式 B：子包直接静态产物

目标子包的构建脚本保持原子：

```json
{
  "scripts": {
    "build": "uni build --mode production"
  }
}
```

Vercel 的 Root Directory、Install Command、Build Command 和 Output Directory 必须都采用目标子包口径：在该 Root Directory 中执行 `pnpm run build`，Output Directory 指向实际 H5 产物目录。模式 B 不创建根搬运任务。

## 模式 A：根目录 `.vercel/output`

当根目录统一收集部署产物时，目标子包添加单一搬运动作：

```json
{
  "scripts": {
    "build": "uni build --mode production",
    "move-h5-output-to-root": "move-h5-output-to-root"
  }
}
```

根 `package.json` 仅运行最终 Turbo 任务：

```json
{
  "scripts": {
    "build:vercel": "turbo run move-h5-output-to-root --filter=<target-package>"
  }
}
```

此模式的 Root Directory、Build Command 和 Output Directory 分别为仓库根、`pnpm run build:vercel` 和 `.vercel/output`。任务配置见 [turbo-task-uniapp-h5.json](turbo-task-uniapp-h5.json)。
