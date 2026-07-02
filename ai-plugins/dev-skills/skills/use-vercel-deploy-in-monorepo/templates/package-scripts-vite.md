> 适用形态：形态 1 / 模式 A（Monorepo 子包，产物搬运到根目录）

前置依赖

```bash
pnpm add -D cross-env turbo vite-plugin-vercel @ruan-cat/utils
```

package.json

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"vite:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --mode production --configLoader runner",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

vite.config.ts

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vercel from "vite-plugin-vercel";

export default defineConfig({
	plugins: [vue(), vercel()],
});
```

.env.production

根据项目实际环境变量配置，例如：

```bash
NODE_ENV=production
```

确保 `vite-plugin-vercel` 已在插件链中启用，否则产物不会生成 `.vercel/output` 结构。

turbo.json

```json
{
	"$schema": "https://turbo.build/schema.json",
	"extends": ["//"],
	"tasks": {
		"vite:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["vite:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```
