> 适用形态：形态 1 / 模式 A（Monorepo 子包，产物搬运到根目录）

前置依赖

```bash
pnpm add -D cross-env turbo @ruan-cat/utils
```

package.json

```json
{
	"scripts": {
		"build:vercel": "turbo run move-vercel-output-to-root --filter=@your-scope/your-app",
		"nuxt:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 nuxi build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

nuxt.config.ts

```typescript
export default defineNuxtConfig({
	experimental: {
		payloadExtraction: false,
	},
	$production: {
		experimental: {
			payloadExtraction: false,
		},
	},
});
```

turbo.json

```json
{
	"$schema": "https://turbo.build/schema.json",
	"extends": ["//"],
	"tasks": {
		"nuxt:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["nuxt:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```
