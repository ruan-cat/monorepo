# 使用 Vercel CLI 验证远程项目配置

本地配置完成后，应使用 Vercel CLI 或 Vercel API 核对远程项目配置，确保 `framework`、`rootDirectory`、`outputDirectory`、`buildCommand` 与本地仓库一致。

## 使用 Vercel CLI

### 前提

- 已安装 Vercel CLI：`npm i -g vercel`
- 已登录 Vercel：`vercel login`

### 查看项目配置

```bash
vercel project inspect <project-name>
```

示例输出字段：

```json
{
	"id": "prj_BanYs5i6t2lmdGmJrkpYTXKrPzF4",
	"name": "11comm-nitro-server",
	"framework": "other",
	"rootDirectory": null,
	"outputDirectory": ".vercel/output",
	"buildCommand": "pnpm -F @01s-11comm/api run build:vercel",
	"installCommand": "pnpm install"
}
```

### 关键字段说明

| 字段              | 含义         | 期望值                                                                   |
| :---------------- | :----------- | :----------------------------------------------------------------------- |
| `framework`       | 框架预设     | 形态 1 多为 `other`，形态 2 按框架自动识别                               |
| `rootDirectory`   | 构建根目录   | `null` 或 `./`                                                           |
| `outputDirectory` | 产物输出目录 | 形态 1 模式 A 和形态 2 为 `.vercel/output`；形态 1 模式 B 为子包产物路径 |
| `buildCommand`    | 构建命令     | 按形态选择                                                               |
| `installCommand`  | 安装命令     | `pnpm install`                                                           |

### 列出项目

```bash
vercel project ls
```

## 使用 Vercel API

### 获取项目配置

```bash
curl -s "https://api.vercel.com/v9/projects/<project-name>?teamId=<team-id>" \
  -H "Authorization: Bearer <token>"
```

### 获取项目环境变量

```bash
curl -s "https://api.vercel.com/v9/projects/<project-name>/env?teamId=<team-id>" \
  -H "Authorization: Bearer <token>"
```

### 核对清单

- [ ] `framework` 与预期一致。
- [ ] `rootDirectory` 为 `null` 或 `./`。
- [ ] `outputDirectory` 与本地产物路径一致。
- [ ] `buildCommand` 与本地 `package.json` 脚本一致。
- [ ] `installCommand` 为 `pnpm install`。
- [ ] 环境变量已同步。

## 注意事项

- Vercel CLI 和 API 不需要 MCP 支持，在离线环境或 MCP 不可用时也能使用。
- 修改远程配置后，建议重新运行 `vercel project inspect` 确认已生效。
- 远程配置与本地脚本不一致是导致部署失败的最常见原因，应作为每次调整后的必检项。
