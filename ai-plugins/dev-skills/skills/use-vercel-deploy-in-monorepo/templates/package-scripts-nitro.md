> 适用：Monorepo 中的 Nitro 子包。先确认 Nitro 服务端源码目录；不要把示例中的占位符当作真实包名或路径。

## 模式 A：根目录 `.vercel/output`

目标子包的 `package.json` 只保留原子动作：Nitro 构建和产物搬运。`move-vercel-output-to-root` 是项目提供的单一搬运命令，负责把子包产物复制到仓库根 `.vercel/output`。

```json
{
  "scripts": {
    "build": "nitro build --preset vercel",
    "move-vercel-output-to-root": "move-vercel-output-to-root"
  }
}
```

根 `package.json` 只聚合最终 Turbo 任务；将 `<target-package>` 替换成实际 workspace 包名。

```json
{
  "scripts": {
    "build:vercel": "turbo run move-vercel-output-to-root --filter=<target-package>"
  }
}
```

Vercel 设置必须同属根目录口径：Root Directory 为仓库根，Build Command 为 `pnpm run build:vercel`，Output Directory 为 `.vercel/output`。对应任务图见 [turbo-task-nitro.json](turbo-task-nitro.json)。

## 模式 B：子包直接产物

仅当 Vercel 的 Root Directory、Install Command、Build Command 和 Output Directory 都已验证采用目标子包口径时使用。在该 Root Directory 中执行 `pnpm run build`，Output Directory 指向该子包的 `.vercel/output`；不要声明根搬运任务，也不要用模式 A 的根 Build Command。

Nitro 模板默认用 `^build` 等待已声明的 workspace 依赖。只有 workspace 依赖图无法表达构建顺序且已验证必须强制顺序时，才将该值替换为 `<core-package>#build`。

## Nitro 配置与检查

在改动构建链前读取 `nitro.config.*`：若服务端源码不在 Nitro 默认目录，显式设置 `serverDir`，并确认该目录存在且包含预期路由。

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "<server-source-directory>",
});
```

构建后检查 `.vercel/output/functions` 非空，并在首次 Git 部署 E2E 中访问一个由该 `serverDir` 提供的 API。若构建成功但 API 全部 404，先复查 `serverDir`、路由清单和输出产物。
