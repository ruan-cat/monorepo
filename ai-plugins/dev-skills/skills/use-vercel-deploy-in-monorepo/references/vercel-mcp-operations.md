# Vercel MCP 操作参考

本地 Vercel 配置完成后，可通过支持 Vercel MCP 的 AI 客户端检查项目与部署状态。MCP 仅作为状态校验与触发部署的辅助手段，不替代本地配置。

## 1. mcp__vercel__list_teams

### 用途

列出当前用户所属的所有 Vercel 团队，获取 `orgId`（团队 ID）。

### 触发时机

- 项目侦察阶段，确认用户有权限访问目标团队。
- 需要把项目归属到某个团队时。

### 示例输出字段

```json
{
	"teams": [
		{
			"id": "team_cUeGw4TtOCLp0bbuH8kA7BYH",
			"name": "your-team-name",
			"slug": "your-team-slug"
		}
	]
}
```

### 关键字段说明

| 字段   | 含义                                              |
| :----- | :------------------------------------------------ |
| `id`   | 团队 ID，对应 `.vercel/project.json` 中的 `orgId` |
| `name` | 团队名称                                          |
| `slug` | 团队 URL slug                                     |

## 2. mcp__vercel__list_projects

### 用途

列出团队下所有 Vercel 项目，确认目标项目是否存在。

### 触发时机

- 项目侦察阶段，确认目标项目已创建。
- 需要查看项目列表时。

### 示例输出字段

```json
{
	"projects": [
		{
			"id": "prj_BanYs5i6t2lmdGmJrkpYTXKrPzF4",
			"name": "11comm-nitro-server",
			"framework": "other",
			"rootDirectory": null,
			"outputDirectory": ".vercel/output"
		}
	]
}
```

### 关键字段说明

| 字段              | 含义                                                  |
| :---------------- | :---------------------------------------------------- |
| `id`              | 项目 ID，对应 `.vercel/project.json` 中的 `projectId` |
| `name`            | 项目名称                                              |
| `framework`       | 框架预设，monorepo 场景通常为 `other`                 |
| `rootDirectory`   | Root Directory，正确应为 `null` 或 `./`               |
| `outputDirectory` | Output Directory，正确应为 `.vercel/output`           |

## 3. mcp__vercel__get_project

### 用途

查看单个 Vercel 项目的详细配置，包括 Root Directory、Output Directory、Build Command、环境变量等。

### 触发时机

- 项目侦察阶段，确认目标项目配置正确。
- 部署后，检查项目设置是否被修改。

### 示例输出字段

```json
{
	"id": "prj_BanYs5i6t2lmdGmJrkpYTXKrPzF4",
	"name": "11comm-nitro-server",
	"framework": "other",
	"rootDirectory": null,
	"outputDirectory": ".vercel/output",
	"buildCommand": "pnpm -F @01s-11comm/api run build:vercel",
	"installCommand": "pnpm install",
	"env": ["NODE_OPTIONS"]
}
```

### 关键字段说明

| 字段              | 含义           | 期望值                              |
| :---------------- | :------------- | :---------------------------------- |
| `rootDirectory`   | 构建根目录     | `null` 或 `./`                      |
| `outputDirectory` | 产物输出目录   | `.vercel/output`                    |
| `buildCommand`    | 构建命令       | `pnpm -F <子包名> run build:vercel` |
| `installCommand`  | 安装命令       | `pnpm install`                      |
| `env`             | 已配置环境变量 | 包含部署所需变量                    |

## 4. mcp__vercel__list_deployments

### 用途

列出项目的所有部署记录，查看历史部署状态。

### 触发时机

- 部署前，查看最近部署历史。
- 部署后，确认新部署已生成。

### 示例输出字段

```json
{
	"deployments": [
		{
			"id": "dpl_<your-deployment-id>",
			"url": "your-project-slug.vercel.app",
			"state": "READY",
			"createdAt": "2026-07-01T12:00:00.000Z"
		}
	]
}
```

### 关键字段说明

| 字段        | 含义                                                |
| :---------- | :-------------------------------------------------- |
| `id`        | 部署 ID                                             |
| `url`       | 部署预览 URL                                        |
| `state`     | 部署状态：`READY`、`BUILDING`、`ERROR`、`QUEUED` 等 |
| `createdAt` | 部署创建时间                                        |

## 5. mcp__vercel__get_deployment

### 用途

查看单个部署的详细信息，包括构建日志、状态、错误原因。

### 触发时机

- 部署完成后，检查部署是否成功。
- 部署失败时，排查错误原因。

### 示例输出字段

```json
{
	"id": "dpl_<your-deployment-id>",
	"url": "your-project-slug.vercel.app",
	"state": "READY",
	"target": "production",
	"createdAt": "2026-07-01T12:00:00.000Z",
	"readyState": "READY",
	"error": null
}
```

### 关键字段说明

| 字段         | 含义                                |
| :----------- | :---------------------------------- |
| `state`      | 部署状态                            |
| `target`     | 部署目标：`production` 或 `preview` |
| `readyState` | 就绪状态                            |
| `error`      | 错误信息，失败时非空                |

## 6. mcp__vercel__deploy_to_vercel

### 用途

触发一次 Vercel 部署，通常使用本地预构建产物（`--prebuilt`）。

### 触发时机

- 本地验证完成后，正式部署到 Vercel。
- 需要把当前 `.vercel/output` 产物推送到 Vercel。

### 调用前提

1. 本地已登录 Vercel：`vercel login`
2. 根目录已存在 `.vercel/project.json` 或目标 `projectId` / `orgId` 已配置。
3. 根目录 `.vercel/output` 已生成且完整。

### 示例输出字段

```json
{
	"id": "dpl_<your-deployment-id>",
	"url": "your-project-slug.vercel.app",
	"state": "BUILDING",
	"target": "production"
}
```

### 关键字段说明

| 字段     | 含义                          |
| :------- | :---------------------------- |
| `id`     | 新部署 ID                     |
| `url`    | 新部署 URL                    |
| `state`  | 初始状态，通常先是 `BUILDING` |
| `target` | `production` 或 `preview`     |

## 7. 检查顺序建议

```plain
list_teams
  -> list_projects
    -> get_project
      -> list_deployments
        -> deploy_to_vercel
          -> get_deployment
```
