# 使用 Vercel CLI 验证远程项目配置

本地配置完成后，应使用 Vercel CLI 或 Vercel API 核对远程项目配置，确保 `framework`、`rootDirectory`、`outputDirectory`、`buildCommand`、`installCommand` 与本地仓库一致。不要只凭 README、`.vercel/project.json` 或本地 `vercel.json` 推断远程真相。

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
	"buildCommand": "pnpm run build:vercel:api",
	"installCommand": "ls -A && pnpm install"
}
```

### 关键字段说明

| 字段              | 含义         | 期望值                                                                     |
| :---------------- | :----------- | :------------------------------------------------------------------------- |
| `framework`       | 框架预设     | 形态 1 多为 `other`，形态 2 按框架自动识别                                 |
| `rootDirectory`   | 构建根目录   | 仓库根模式为 `null` 或 `./`；app 目录模式必须整套切换 install/build/output |
| `outputDirectory` | 产物输出目录 | 形态 1 模式 A 和形态 2 为 `.vercel/output`；形态 1 模式 B 为子包产物路径   |
| `buildCommand`    | 构建命令     | 按形态选择                                                                 |
| `installCommand`  | 安装命令     | `pnpm install` 或项目确认后的等价命令                                      |

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

如果返回 JSON 没有某个字段，记录“未返回”，不要把推断写成直接读取到的事实。

### 本地 CLI link 绑定

`.vercel/project.json` 只证明当前目录的 Vercel CLI 绑定，通常包含 `orgId`、`projectId`。它不证明云端 `buildCommand`、`outputDirectory`、`installCommand` 正确。

多项目 monorepo 中，仓库根 `.vercel/project.json` 是单槽绑定。执行 `vercel deploy --prebuilt` 前，必须确认当前目录绑定的 `projectId` 就是目标项目。

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
- [ ] `installCommand` 与项目 README / 云端期望值一致。
- [ ] `.vercel/project.json` 绑定目录和部署命令执行目录一致。
- [ ] 仓库根和 Root Directory 所在目录没有误用 `vercel.json` 覆盖项目设置。
- [ ] 环境变量已同步。

## 注意事项

- Vercel CLI 和 API 不需要 MCP 支持，在离线环境或 MCP 不可用时也能使用。
- 修改远程配置后，建议重新运行 `vercel project inspect` 确认已生效。
- 远程配置与本地脚本不一致是导致部署失败的最常见原因，应作为每次调整后的必检项。
- `vercel.json` 可以覆盖 `buildCommand`、`installCommand`、`outputDirectory`、`framework` 等设置。同一仓库绑定多个 Vercel Projects 时，根 `vercel.json` 是高风险共享覆盖项，必须与 Dashboard/API 和部署日志一起核对。
