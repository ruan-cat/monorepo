# Monorepo 与独立仓库部署模式参考

本文档先按"部署形态"分层，再按框架给出 package.json 脚本、turbo.json 任务、Vercel 项目设置和产物路径。

## 形态 1：Monorepo 子包部署

形态 1 适用于仓库根目录存在 `pnpm-workspace.yaml`、多个子包共享根目录 `node_modules` 和 lockfile 的场景。

### 通用配置口径

| 设置项           | 推荐值                                                                | 说明                                               |
| :--------------- | :-------------------------------------------------------------------- | :------------------------------------------------- |
| Framework Preset | `Other` 或框架自动识别                                                | `Other` 为多数情况；Nitro 等可被自动识别时可选自动 |
| Root Directory   | `./` 或留空                                                           | 仓库根模式下必须在 monorepo 根目录执行安装命令     |
| Output Directory | 按模式选择                                                            | 模式 A 写 `.vercel/output`；模式 B 写子包产物路径  |
| Build Command    | `pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>` | 在根目录触发子包构建链                             |
| Install Command  | `pnpm install` 或项目确认后的等价命令                                 | 例如 11comm 当前使用 `ls -A && pnpm install`       |

### 形态 1 / 模式 A：产物搬运到根目录

模式 A 适用于 Nuxt、Nitro、Vite 等框架，它们能通过 preset 或插件直接生成 `.vercel/output`。子包构建完成后，用 `move-vercel-output-to-root`（来自 `@ruan-cat/utils`）把产物搬运到 monorepo 根目录。

#### 1.1 Nuxt

##### 参考项目

`notes/docs/my-pull-requests`

##### package.json 脚本

```json
{
	"scripts": {
		"build:vercel": "turbo run move-vercel-output-to-root --filter=@ruan-cat-docs/my-pull-requests",
		"nuxt:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 nuxi build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

##### 子包 turbo.json

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

##### 仓库根 turbo.json（可选聚合任务）

```json
{
	"tasks": {
		"do-build-my-pr-doc": {
			"dependsOn": ["@ruan-cat-docs/my-pull-requests#move-vercel-output-to-root"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

##### nuxt.config.ts 关键配置

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

##### 产物路径

- 子包构建输出：`notes/docs/my-pull-requests/.vercel/output/`
- 搬运后根目录：`notes/.vercel/output/`
- Vercel 读取：`notes/.vercel/output/`

##### 依赖

```bash
pnpm add @vercel/analytics @vercel/speed-insights
pnpm add -D @ruan-cat/utils
```

#### 1.2 Nitro

##### 参考项目

`01s-11comm/apps/api`

当前 `11comm-nitro-server` 云端 Build Command 应使用仓库根入口 `pnpm run build:vercel:api`，不要把子包内部命令 `pnpm -F=@01s-11comm/api build:vercel` 当成云端入口。

##### package.json 脚本

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"nitro:build:vercel": "nitro build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

##### 子包 turbo.json

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

##### nitro.config.ts 关键配置

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",
});
```

##### 产物路径

- 子包构建输出：`01s-11comm/apps/api/.vercel/output/`
- 搬运后根目录：`01s-11comm/.vercel/output/`
- Vercel 读取：`01s-11comm/.vercel/output/`
- 云端 Output Directory：`.vercel/output`

##### 依赖

```bash
pnpm add -D @ruan-cat/utils
```

##### .vercel/project.json 示例

```json
{
	"projectName": "11comm-nitro-server",
	"orgId": "team_cUeGw4TtOCLp0bbuH8kA7BYH",
	"projectId": "prj_BanYs5i6t2lmdGmJrkpYTXKrPzF4"
}
```

#### 1.3 Vite / Vue3

##### 参考项目

`01s-11comm/apps/admin`

当前 `11comm-admin` 已是 SPA 静态部署。云端 Build Command 应使用仓库根入口 `pnpm run build:vercel:admin`，子包 `build:vercel` 先生成 `apps/admin/dist/`，再执行 `move-vercel-output-to-root --source-dir dist --target-dir .vercel/output`。不要把云端 Output Directory 改回 `apps/admin/dist`。

##### package.json 脚本

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"vite:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --mode production --configLoader runner",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

##### 子包 turbo.json

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

##### vite.config.ts 关键配置

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vercel from "vite-plugin-vercel";

export default defineConfig({
	plugins: [vue(), vercel()],
});
```

##### 环境变量控制

根据项目实际需要，在 `.env.production` 中配置生产环境变量。Vite 项目需确保 `vite-plugin-vercel` 已在插件链中启用，这样 `vite build` 才会生成 `.vercel/output` 结构。

##### 产物路径

- 子包构建源产物：`01s-11comm/apps/admin/dist/`
- 搬运后根目录：`01s-11comm/.vercel/output/`
- Vercel 读取：`01s-11comm/.vercel/output/`
- 云端 Output Directory：`.vercel/output`

##### 依赖

```bash
pnpm add -D vite-plugin-vercel @ruan-cat/utils
```

### 形态 1 / UniApp H5：按实测链路选择模式 A 或 B

UniApp H5 等静态站点可以使用模式 B 直接指向子包产物路径；但如果项目已有仓库根 Build Command 和 `.vercel/output` 搬运链路，应归为模式 A。不要因为框架是 UniApp H5 就自动判定为模式 B。

#### 2.1 UniApp H5（当前 11comm app 为模式 A）

##### 参考项目

`01s-11comm/apps/app`

当前 `11comm-app-h5` 云端 Build Command 应使用仓库根入口 `pnpm run build:vercel:app`。子包先生成 `dist/build/h5/`，再通过 `move-vercel-output-to-root --source-dir dist/build/h5 --target-dir .vercel/output` 搬运到仓库根。不要把云端 Output Directory 改回 `apps/app/dist/build/h5`。

##### package.json 脚本

```json
{
	"scripts": {
		"build": "uni build",
		"build:h5:prod": "uni build --mode production",
		"build:vercel": "pnpm run build:vercel:h5",
		"build:vercel:h5": "pnpm run build:h5:prod && pnpm run move-h5-output-to-root",
		"move-h5-output-to-root": "shx rm -rf ../../.vercel/output && shx mkdir -p ../../.vercel/output/static && shx cp -r dist/build/h5/* ../../.vercel/output/static/",
		"preview:h5": "vite preview --outDir dist/build/h5",
		"ci": "turbo run build:h5:prod --filter=@01s-11comm/app"
	}
}
```

##### 子包 turbo.json

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

##### 仓库根 package.json（可选）

```json
{
	"scripts": {
		"build:vercel:app": "pnpm -F=@01s-11comm/app run build:vercel"
	}
}
```

##### 产物路径

- 子包构建输出：`01s-11comm/apps/app/dist/build/h5/`
- 搬运后根目录：`01s-11comm/.vercel/output/`
- Vercel 读取（Output Directory）：`01s-11comm/.vercel/output/`

##### 适配说明

UniApp H5 产物是静态站点。模式 B 下，Vercel Output Directory 直接写 `apps/app/dist/build/h5`，Vercel 会读取该目录作为静态站点根目录。

当前 11comm app H5 不采用上述模式 B；它采用模式 A 的根 `.vercel/output` 链路。若其他项目需要模式 A，也应把云端 Output Directory 设为 `.vercel/output`，并用项目实测搬运脚本生成根 `.vercel/output`。

##### 依赖

```bash
pnpm add -D shx @ruan-cat/utils
```

## 形态 2：独立仓库部署

形态 2 适用于仓库本身不是 monorepo，或只有一个可部署目标的场景。无需处理 workspace 依赖解析问题，框架 preset 通常直接生成到根目录 `.vercel/output`。

### 通用配置口径

| 设置项           | 推荐值                              | 说明                          |
| :--------------- | :---------------------------------- | :---------------------------- |
| Framework Preset | 根据框架选择（如 Nitro）            | 让 Vercel 自动识别框架        |
| Root Directory   | `./` 或留空                         | 在仓库根目录执行 pnpm install |
| Output Directory | `.vercel/output`                    | 框架 preset 自动生成          |
| Build Command    | `pnpm run build:<framework>:vercel` | 在仓库根目录执行              |
| Install Command  | `pnpm install`                      | 默认即可                      |

### 2.1 Nitro（独立仓库）

##### 参考项目

`01s-11comm-app`（Vercel 项目 `11comm-app-nitro-server`）

##### package.json 脚本

```json
{
	"scripts": {
		"build:nitro:vercel": "nitro build --preset vercel"
	}
}
```

##### nitro.config.ts 关键配置

```typescript
import { defineConfig } from "nitro";

export default defineConfig({
	serverDir: "server",
	imports: false,
	compatibilityDate: "2024-09-19",
});
```

##### 产物路径

- 构建输出：`01s-11comm-app/.vercel/output/`
- Vercel 读取：`01s-11comm-app/.vercel/output/`

##### 依赖

```bash
pnpm add -D @ruan-cat/utils
```

##### .vercel/project.json 示例

```json
{
	"projectName": "11comm-app-nitro-server",
	"orgId": "team_<your-team-id>",
	"projectId": "prj_<your-project-id>"
}
```

## 根目录 vercel-deploy-tool.config.ts 示例（形态 1 模式 A）

```typescript
import { defineConfig, type VercelDeployToolOptions } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	targets: [
		{
			name: "my-nuxt-app",
			projectId: "prj_<your-project-id>",
			orgId: "team_<your-team-id>",
			rootDirectory: "./",
			outputDirectory: ".vercel/output",
			buildCommand: "pnpm -F @your-scope/your-app run build:vercel",
		},
		{
			name: "my-nitro-app",
			projectId: "prj_<your-project-id>",
			orgId: "team_<your-team-id>",
			rootDirectory: "./",
			outputDirectory: ".vercel/output",
			buildCommand: "pnpm -F @your-scope/your-api run build:vercel",
		},
	],
} satisfies VercelDeployToolOptions);
```

注意：形态 1 模式 B 和形态 2 不应使用上述配置中的 `outputDirectory` 写法，需按各自形态调整。
