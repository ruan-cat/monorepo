> 适用形态：形态 1 / 模式 A（Monorepo 子包，产物搬运到根目录）

前置依赖

```bash
pnpm add -D cross-env turbo @ruan-cat/utils
```

package.json

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"nitro:build:vercel": "nitro build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
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

turbo.json

```json
{
	"$schema": "https://turbo.build/schema.json",
	"extends": ["//"],
	"tasks": {
		"nitro:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["nitro:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

.vercel/project.json

> 该文件应位于 monorepo **根目录**，而非子包目录，供 Vercel CLI 在仓库根目录执行命令时识别项目。

```json
{
	"projectName": "your-nitro-project",
	"orgId": "team_<your-team-id>",
	"projectId": "prj_<your-project-id>"
}
```
