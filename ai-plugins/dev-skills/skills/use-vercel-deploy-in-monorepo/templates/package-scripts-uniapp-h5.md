> 适用形态：形态 1 / 模式 B（Monorepo 子包，Output Directory 直接指向子包产物路径）
>
> 模式 B 下 Vercel 直接读取子包产物路径，不需要搬运到根目录 `.vercel/output`。
> 若需要形态 1 / 模式 A 的 `.vercel/output` 结构，见文件末尾“切换到形态 1 / 模式 A（可选）”。
>
> 注意：如果项目已有根入口 Build Command 和 `.vercel/output` 搬运链路，不要照搬模式 B。11comm app H5 当前口径是 `pnpm run build:vercel:app`，先生成 `dist/build/h5`，再搬运到仓库根 `.vercel/output`。

前置依赖

```bash
pnpm add -D shx
```

package.json

```json
{
	"scripts": {
		"build": "uni build",
		"build:h5:prod": "uni build --mode production",
		"build:vercel": "pnpm run build:vercel:h5",
		"build:vercel:h5": "pnpm run build:h5:prod",
		"move-h5-output-to-root": "shx rm -rf ../../.vercel/output && shx mkdir -p ../../.vercel/output/static && shx cp -r dist/build/h5/* ../../.vercel/output/static/",
		"preview:h5": "vite preview --outDir dist/build/h5",
		"ci": "turbo run build:h5:prod --filter=@your-scope/your-app"
	}
}
```

> 说明：`move-h5-output-to-root` 仅在切换到形态 1 / 模式 A 时才需要启用，默认模式 B 下不调用。

turbo.json

```json
{
	"$schema": "https://turbo.build/schema.json",
	"extends": ["//"],
	"tasks": {
		"build:h5:prod": {
			"outputs": ["dist/build/h5/**"]
		}
	}
}
```

> 说明：默认模式 B 下不需要 `move-h5-output-to-root` 任务。若切换到模式 A，才需要补充该任务，详见末尾“切换到形态 1 / 模式 A（可选）”。

根目录 package.json（可选）

```json
{
	"scripts": {
		"build:vercel:app": "pnpm -F=@your-scope/your-app run build:vercel"
	}
}
```

Vercel 项目设置

| 设置项           | 值                                                                                |
| :--------------- | :-------------------------------------------------------------------------------- |
| Framework Preset | `Other`                                                                           |
| Root Directory   | `./` 或留空                                                                       |
| Output Directory | `apps/<子包>/dist/build/h5`                                                       |
| Build Command    | `pnpm -F @your-scope/your-app run build:vercel` 或 `pnpm run build:vercel:<name>` |
| Install Command  | `pnpm install` 或项目确认后的等价命令                                             |

切换到形态 1 / 模式 A（可选）

如果需要统一 `.vercel/output` 结构（例如配合其他搬运脚本或平台要求），可启用 `move-h5-output-to-root` 脚本，并把 Vercel **Output Directory** 改为 `.vercel/output`。

模式 A 下的子包 `package.json`：

```json
{
	"scripts": {
		"build": "uni build",
		"build:h5:prod": "uni build --mode production",
		"build:vercel": "pnpm run build:vercel:h5",
		"build:vercel:h5": "pnpm run build:h5:prod && pnpm run move-h5-output-to-root",
		"move-h5-output-to-root": "shx rm -rf ../../.vercel/output && shx mkdir -p ../../.vercel/output/static && shx cp -r dist/build/h5/* ../../.vercel/output/static/",
		"preview:h5": "vite preview --outDir dist/build/h5",
		"ci": "turbo run build:h5:prod --filter=@your-scope/your-app"
	}
}
```

模式 A 下的子包 `turbo.json`：

```json
{
	"$schema": "https://turbo.build/schema.json",
	"extends": ["//"],
	"tasks": {
		"build:h5:prod": {
			"outputs": ["dist/build/h5/**"]
		},
		"move-h5-output-to-root": {
			"dependsOn": ["build:h5:prod"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

模式 A 下的 Vercel 项目设置：

| 设置项           | 值                                                                                |
| :--------------- | :-------------------------------------------------------------------------------- |
| Framework Preset | `Other`                                                                           |
| Root Directory   | `./` 或留空                                                                       |
| Output Directory | `.vercel/output`                                                                  |
| Build Command    | `pnpm -F @your-scope/your-app run build:vercel` 或 `pnpm run build:vercel:<name>` |
| Install Command  | `pnpm install` 或项目确认后的等价命令                                             |
