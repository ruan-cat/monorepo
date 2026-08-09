> 适用：独立 Nitro 仓库或只有一个可部署目标的仓库。单一步骤构建不强制使用 Turbo，也不需要根产物搬运。

## package.json

```json
{
  "scripts": {
    "build": "nitro build --preset vercel"
  }
}
```

## Nitro 配置与检查

先读取 `nitro.config.*`。如果服务端源码不在默认位置，使用实际目录设置 `serverDir`，并确认目录与路由文件存在：

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "<server-source-directory>",
});
```

构建后确认 `.vercel/output/functions` 非空，并在首次 Git 部署的 E2E 中请求一个由该目录提供的 API。若 API 404，不以“构建通过”宣布运行时成功，依次检查 `serverDir`、路由清单和 Vercel 输出。

## Vercel 设置

Root Directory 为仓库根；Build Command 为 `pnpm run build`；Output Directory 为 `.vercel/output`。独立仓库不引入根聚合脚本或搬运任务。
