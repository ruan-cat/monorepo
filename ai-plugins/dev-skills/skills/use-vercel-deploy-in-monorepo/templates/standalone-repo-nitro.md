> 适用形态：形态 2（独立仓库，非 monorepo 或只有一个可部署目标）

前置依赖

```bash
pnpm add -D cross-env
```

> 说明：独立仓库 Nitro 模板不调用 `move-vercel-output-to-root`，因此不需要 `@ruan-cat/utils`。若项目其他脚本需要该依赖，请单独说明用途。

package.json

```json
{
	"scripts": {
		"build:nitro:vercel": "nitro build --preset vercel"
	}
}
```

nitro.config.ts

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",
});
```

产物路径

- 构建输出：`01s-11comm-app/.vercel/output/`
- Vercel 读取：`01s-11comm-app/.vercel/output/`

.vercel/project.json

```json
{
	"projectName": "11comm-app-nitro-server",
	"orgId": "team_<your-team-id>",
	"projectId": "prj_<your-project-id>"
}
```

Vercel 项目设置

| 设置项           | 值                            |
| :--------------- | :---------------------------- |
| Framework Preset | `Nitro`（自动识别）           |
| Root Directory   | `./` 或留空                   |
| Output Directory | `.vercel/output`              |
| Build Command    | `pnpm run build:nitro:vercel` |
| Install Command  | `pnpm install`                |
