# 阮喵喵自用的 vercel 部署工具

生成满足 [Vercel Output API （v3）](https://vercel.com/docs/build-output-api)规范的目录结构，并推送到 vercel 平台内。

目前仅考虑简单的静态页面，没有实现云函数等功能。

## 设计初衷

- 优化冗长的 github action 写法。
- 同时支持 monorepo 和单体项目的部署。
- 自动实现文件移动，避免用户自写文件移动命令。
- 实现复杂部署任务的并列执行，提高运行性能。
- 配置实现类型提示，对用户友好。
- 实现单一 vercel 项目的多项目部署，绕开 vercel 针对 monorepo 项目的部署限制。

## 安装

```bash
pnpm i -D @ruan-cat/vercel-deploy-tool@latest
```

## 环境要求

- node >=20.15.1
- pnpm >=9

## 使用教程

### 增加 .gitignore 配置

本工具会在根目录内默认生成一个全空配置的 vercel.null.def.json 文件，这个文件应该被忽略。

后续的使用会不可避免的使用 vercel 的 api，会在你的项目内生成一个或多个.vercel 文件夹，故.vercel 文件夹也应该被忽略。

```bash
# 忽略vercel本地打包生成的文件
.vercel
# 忽略自动生成vercel部署配置文件
vercel.null.def.json
```

如果你使用环境变量文件，推荐你加上 dotenv 推荐的环境变量文件忽略。

```bash
# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local
```

### 获取 vercel 提供的 id

用 [`vc link`](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel) 命令获取 vercelOrgId 和 vercelProjectId。

你可以明文地写在配置上面，也可以考虑放在环境变量，放在 github secrets 环境变量内。

### 放在项目内的 .env 环境变量文件内（可选）

举例如下：

```bash
VERCEL_PROJECT_ID=prj_your_vercel_projectId
VERCEL_ORG_ID=team_your_vercel_orgId
VERCEL_TOKEN=your_vercel_token
```

环境变量必须写成大写，名称很严格。如果你使用环境变量的方式提供这些值，请务必使用例子提供的变量名。

### 编写部署配置文件

```ts
// .config/vercel-deploy-tool.ts
import { type Config } from "@ruan-cat/vercel-deploy-tool/src/config.ts";

const config: Config = {
	vercelProjetName: "prj_your_vercel_projectName",
	vercelOrgId: "team_your_vercel_orgId",
	vercelProjectId: "prj_your_vercel_projectId",
	// 默认留空即可
	vercelToken: "",

	deployTargets: [
		{
			type: "userCommands",
			outputDirectory: "docs/.vuepress/dist/**/*",
			targetCWD: "./",
			url: ["small-alice-web-dev.ruancat6312.top", "small-alice-web.ruan-cat.com"],
			userCommands: ["pnpm -C=./ vuepress-vite build docs"],
		},
	],
};

export default config;
```

### 编写运行文件

```ts
// bin/vercel-deploy-tool.ts
// 执行部署任务
import "@ruan-cat/vercel-deploy-tool/src/index.ts";
```

### 封装运行命令

在 package.json 内提供命令

```json
{
	"engines": {
		"node": ">=22.6.0",
		"pnpm": ">=9"
	},
	"scripts": {
		"deploy-vercel": "tsx ./bin/vercel-deploy-tool.ts"
	}
}
```

这里采用直接运行 typescript 文件的方案运行部署工具，你需要额外多安装 tsx 依赖：

```bash
pnpm i -D tsx
```

运行 `pnpm run deploy-vercel` 命令就能部署项目到 vercel 了。

## 路线图

- [x] 封装打包命令，`vc deploy` 命令，并赋予生产环境 url。
- [x] 拆分配置文件到项目根目录，并实现文件读取。
- [x] github action 运行产物。
- [x] github action 全局安装新开发的包，实现纯工作流的部署。
- [x] 去其他项目，自主完成配置与部署。
