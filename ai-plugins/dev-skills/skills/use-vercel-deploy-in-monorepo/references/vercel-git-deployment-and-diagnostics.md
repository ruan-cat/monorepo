# Vercel Git 部署与诊断

## Git Integration 连接与生产分支门禁

参考 Vercel 官方的 [Git 仓库部署](https://vercel.com/docs/git) 与 [Git Settings](https://vercel.com/docs/project-configuration/git-settings)。对同一 monorepo 的每个 Vercel Project 分别执行以下闭环；一个 Project 的连接或 E2E 不能证明另一个 Project 已完成。

### 新建 Project

在 Dashboard 依次进入 **Add New → Project → 从 Git repository Import**，选择目标 team、provider、namespace/repository，再核对 Project 名称、Root Directory 与构建设置后创建。只有同时满足以下条件时才可改走创建 API：

1. 执行时的 Vercel 公开 Project 创建 API schema 明确包含 `gitRepository` 字段及所需 provider/repository 参数。
2. 用户明确授权创建 Project 和连接该仓库。

任一条件不满足即使用 Dashboard；不得猜测字段或复用 Dashboard 的私有请求。

### 既有 Project 连接或更换仓库

在 Dashboard 选择目标 Project，进入 **Project Settings → Git → Connected Git Repository**，连接或更换为已确认的 provider、organization/namespace 与 repository。随后进入 **Project Settings → Environments → Production → Branch Tracking**，把生产分支设置为已确认的分支并保存。

截至 2026-08-10，若公开文档没有提供稳定的既有 Project Git connection 或 Production Branch 写 API，就必须将这两项作为 Dashboard 人工 gate，并在完成前标记“阻塞”。禁止调用从 Dashboard 网络流量猜出的私有或未文档化 endpoint。

### 人工或写入后的回读

1. 对目标 team 下的 Project 执行 Project GET，读取响应中实际返回的 `link` 对象；逐项记录并比对 `provider`、`org`、`repo`、`repoId` 等字段。API 没返回的字段写“未返回”，不得补成推断值。
2. 生产分支以 **Project Settings → Environments → Production → Branch Tracking** 的 Dashboard 保存结果作为证据，记录精确分支；Project GET 未返回生产分支时不能替代这项证据。
3. 获得推送授权后，向该生产分支推送可识别 commit SHA；在目标 team/Project 中验证匹配 SHA、`Cloning` 或等价 checkout、READY 与目标 URL E2E。只有这一步通过，才能证明 Git connection 与 Production Branch 实际生效。

`vercel link` 与 `.vercel/project.json` 仅控制本地 CLI 目标，不连接 Git repository，也不能作为上述任何回读证据。

## 两条链，两个验收结论

### 正式主链：Vercel Git Integration

正式交付必须是目标仓库、正确分支的 Git push 触发 Vercel 构建：

```text
Git push
→ Vercel Git clone / checkout
→ Install Command
→ Build Command
→ Output Directory
→ READY
→ 目标 URL 冒烟
```

首次 Git E2E 需要可识别 commit SHA、目标 team/Project、与该 SHA 匹配的 deployment、日志中的 `Cloning` 或等价 Git checkout、READY、生产或预览 URL 健康检查。对于 Nitro，额外请求一个来自实际 `serverDir` 的业务 API。未获推送授权时，停在本地准备状态。多 Project 场景必须分别保留完整证据包，不得由其中一个的成功推导另一个成功。

### 本地辅助链：CLI upload / Prebuilt

本地构建、`vercel deploy --prebuilt`、CLI upload 和任何基于本地产物的 MCP 触发，仅用于核验 `.vercel/output`、排除本地代码/产物问题或已授权的应急动作。它们的 READY 只能报告“本地辅助链通过”。

日志出现 `Downloading deployment files` 只能说明文件上传/Prebuilt 路径，不能替代 Git clone/checkout 证据。上传部署的 `.git` 上下文可能不同；依赖 Git 历史、local Git config 或 changelog 的构建逻辑必须在 Git 主链验证，并为上传路径明确提供降级才能兼容。

## `.vercelignore` 预检

在本地上传、Prebuilt 或上传异常时，检查仓库根和 Root Directory 内的 `.vercelignore`。它可排除缓存、测试缓存、临时文件、包级 `.vercel` 或无关大资源，但不能排除 workspace 输入、核心依赖包、Nitro `serverDir`、构建配置、运行时所需文件或最终 `.vercel/output`。体积异常先检查 ignore 与文件清单，不要盲目重试网络。

## 日志分诊树

1. **部署来源：**确认 Git clone、CLI upload 或 Prebuilt；这决定后续证据口径。
2. **上传：**检查体积、`.vercelignore`、缺失 workspace 文件和上传错误。
3. **安装：**检查 Node 选择、Corepack、pnpm、lockfile 与 registry。
4. **构建：**检查 Build Command、Turbo 依赖图、框架错误及缓存。
5. **产物：**检查 Output Directory、`.vercel/output` 与搬运结果。
6. **运行时：**检查函数日志、Nitro `serverDir`、route manifest 与环境变量；build 成功但 API 404 时优先在此层排查。
7. **域名：**检查 alias、production domain、路由和 HTTP 冒烟响应。

环境变量或 Settings 变化后，旧 deployment 不会自动获得新配置；每次变更都用新的 Git-triggered deployment 再验收。
