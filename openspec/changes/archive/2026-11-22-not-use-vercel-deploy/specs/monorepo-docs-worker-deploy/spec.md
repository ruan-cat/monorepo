## Purpose

规定本仓五个 VitePress 文档站脱离 Vercel 之后的公开地址、部署时机，以及主分支合并不再发布这些文档的行为。

## ADDED Requirements

### Requirement: 五个文档站只公开 ruan-cat.com

系统 SHALL 把下列文档站的公开地址固定为对应主机名，并且 SHALL NOT 把 `workers.dev` 写入这些包的 `homepage` 或 `packages/domains/src/domains.ts`。

- `packages/utils`：`utils.ruan-cat.com`
- `packages/vitepress-preset-config`：`vitepress-preset.ruan-cat.com`
- `packages/claude-notifier`：`ccntf.ruan-cat.com`，`claude-notifier.ruan-cat.com` 指向同一站点
- `packages/domains`：`dm.ruan-cat.com`
- `packages/vercel-deploy-tool`：`vc.ruan-cat.com`

#### Scenario: 读者看到的规范主机名

- **WHEN** 查阅这五个包的 `homepage` 或 `domains.ts` 里对应键的生产地址
- **THEN** 地址使用上表中的 `ruan-cat.com` 主机名
- **AND** 这些位置不出现 `workers.dev`

#### Scenario: claude-notifier 的两个主机名指向同一站

- **WHEN** 请求 `ccntf.ruan-cat.com` 或 `claude-notifier.ruan-cat.com`
- **THEN** 两个主机名提供同一份 `packages/claude-notifier` 文档

### Requirement: 文档只在 dev 的目录变更时部署

系统 SHALL 只在 `dev` 分支、且该文档包自身目录或其声明的工作区文档依赖、锁文件、工作区清单发生变化时部署对应文档站。推送到 `main` SHALL NOT 部署这五个文档站。

#### Scenario: dev 上改了单个文档包

- **WHEN** `dev` 上只改了五个包中的一个包目录
- **THEN** 只有该包的文档站进入部署
- **AND** 另外四个文档站不因这次推送而部署

#### Scenario: main 合并不部署文档

- **WHEN** 同一次文档改动被合并进 `main`
- **THEN** 这五个文档站不发生新的部署

### Requirement: 域名表只改本仓这五个键

系统 SHALL 从 `utils`、`vitepress-preset`、`claude-notifier`、`domain`、`vercel-deploy-tool` 五个键中删除 `ruancat6312.top`。系统 SHALL NOT 删除或改写 `domains.ts` 里其余键的域名，包括其他项目仍在使用的 `ruancat6312.top`。

#### Scenario: 五个键不再登记旧域名

- **WHEN** 读取这五个键
- **THEN** 其中不存在 `topLevelDomain` 为 `ruancat6312.top` 的记录
- **AND** 每个键至少保留一条上表中的 `ruan-cat.com` 记录

#### Scenario: 其他项目的域名保持原样

- **WHEN** 读取 `09oa`、`10wms`、`10wms-doc`、`11comm`、`11comm-doc`、`01s-doc`、`ruan-cat-notes`、`gh`、`vue-element-cui`、`gzpc`、`rmmv-notes`、`drill-doc`、`rmmv-api-doc` 或 `sundry`
- **THEN** 这些键的域名记录与本次变更前一致

### Requirement: Turbo 远程缓存继续可用

系统 SHALL 在 `ci.yaml` 与 `release.yml` 中保留使用 `secrets.vercel_token` 的 Turbo 远程缓存。文档站停止使用 Vercel 推送 dist SHALL NOT 去掉这两处缓存配置。

#### Scenario: 发版工作流仍能使用远程缓存

- **WHEN** `release.yml` 运行构建
- **THEN** `TURBO_TOKEN` 仍来自 `secrets.vercel_token`
- **AND** 工作流不再派发 `deploy-after-release`

## REMOVED Requirements

### Requirement: 用 Vercel 在 main 上推送这五个文档站的 dist

**Reason**: Vercel 部署额度限制了 `main` 的合并频率，而技能站点只镜像 `main`。
**Migration**: 文档改由 Cloudflare Workers 在 `dev` 按目录部署。公开地址改为本规格列出的 `ruan-cat.com` 主机名。不提供从 `ruancat6312.top` 到新主机名的跳转。

#### Scenario: 仓库不再包含 Vercel 文档部署入口

- **WHEN** 查看仓库根目录和 `.github/workflows`
- **THEN** 不存在 `vercel-deploy-tool.config.ts`
- **AND** 不存在以向 Vercel 推送这五个文档 dist 为职责的工作流
