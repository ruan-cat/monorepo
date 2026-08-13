# Skill Router MCP Stage 2 Tasks

## Pilot Batch

- [x] [核对] `docs/prompts/release-ai-plugins/2026-8-11-make-Skill-Router-MCP-for-ChatGPT-web/**` - 已确认一期公开 Tool Surface 为 4 个工具；related file @ SHA 已在规格中预留，二期负责将其公开化、完整化
- [x] [核对] `packages/skill-router-mcp/**` - 已确认 `readRelatedFile` / `SourceSnapshot` / `GitHubSkillSource.readFile` 可复用；当前缺公开 resource tools、枚举、metadata/blob/limit 与完整错误模型
- [ ] [设计] `docs/prompts/skill-router-mcp/stage2-design/specs/skill-resource-access.md` - 以 `git-commit/references/commit-types.ts` 为试点冻结 Tool Schema、错误码和 snapshot 规则
- [ ] [测试设计] `packages/skill-router-mcp/**` - 增加最小 PoC 测试：`git-commit` 能读取 `references/commit-types.ts` 且 path traversal 被拒绝
- [ ] [验证] `packages/skill-router-mcp/**` - 用 ChatGPT Web 实际扫描新版 tools，完成一次 `search → load skill → load resource` 调用

## Main Implementation

- [ ] [修改] `packages/skill-router-mcp/**` - 抽取统一 `SkillResolver`，通过 `skillId` 解析 plugin、entry、skill root 和 source commit
- [ ] [修改] `packages/skill-router-mcp/**` - 新增 `ResourceResolver`，实现 canonical relative path、根目录隔离、路径穿越拒绝
- [ ] [修改] `packages/skill-router-mcp/**` - 实现 `list_skill_resources`
- [ ] [修改] `packages/skill-router-mcp/**` - 实现 `load_skill_resource`
- [ ] [修改] `packages/skill-router-mcp/**` - 增强 `load_skill` 响应，增加 `resourceSummary` 与可选 `referencedResources`
- [ ] [修改] `packages/skill-router-mcp/**` - 所有 Skill/Resource 调用统一回显 resolved `sourceCommitSha`
- [ ] [修改] `packages/skill-router-mcp/**` - 将缓存键升级为 `repo + commit + skill + path`
- [ ] [修改] `packages/skill-router-mcp/**` - 增加 MIME、size、text/blob 判定和资源大小限制
- [ ] [测试] `packages/skill-router-mcp/**` - 覆盖 references/scripts/assets/other 四类文件
- [ ] [测试] `packages/skill-router-mcp/**` - 覆盖 `../`、绝对路径、Windows path、URL 编码 traversal
- [ ] [测试] `packages/skill-router-mcp/**` - 覆盖 dev 从 A 前进到 B 后固定 A snapshot 的一致性

## MCP Resources Compatibility

- [ ] [设计] `packages/skill-router-mcp/**` - 复用 ResourceResolver 暴露 `skill://<plugin>/<skillId>/{+path}` resource template
- [ ] [实现] `packages/skill-router-mcp/**` - 支持标准 `resources/read` 文本资源
- [ ] [实现] `packages/skill-router-mcp/**` - 支持标准 `resources/read` blob 资源
- [ ] [评估] `packages/skill-router-mcp/**` - 决定二期是否同时交付 `skill://index.json`，还是放到二期后续小版本

## Registry / Deployment

- [x] [核对] 当前 deployment authority - `packages/skill-router-mcp/README.md` 已确认生产部署由 Cloudflare Workers Builds Git Integration 负责；`.github/workflows/skill-router-mcp.yml` 只做检查/测试/构建
- [ ] [核对] Cloudflare Workers Builds Dashboard - 核对 production branch、root directory、build/deploy command、include/exclude path 与 secrets；这些值不能仅从当前仓库完整推导
- [ ] [核对] `packages/skill-router-mcp/**` - 确认当前 registry 是否只保存 SKILL entry；决定文件 inventory 是构建时生成还是运行时 GitHub tree 查询
- [ ] [修改] `packages/skill-router-mcp/**` - 如 registry shape 变化，升级 `registrySchemaVersion`
- [ ] [修改] `packages/skill-router-mcp/**` - 保持旧版 `load_skill` 调用兼容
- [ ] [部署] Cloudflare Worker - 部署测试版本
- [ ] [配置] ChatGPT MCP App - Refresh / Scan Tools，使新增 tools 进入 ChatGPT 的 action snapshot
- [ ] [验收] ChatGPT Web - 完成 `git-commit`、`pr-ruancat-repo` 两条真实链路

## Documentation

- [ ] [修改] `docs/prompts/skill-router-mcp/stage2-design/**` - 回填源码核对结果、最终 Tool Schema 与实现文件路径
- [ ] [修改] `packages/skill-router-mcp/README.md` - 增加完整 Skill 资源调用示例
- [ ] [修改] 对应 MCP 使用文档 - 说明 Tools 与 `skill://` Resources 两种读取入口
