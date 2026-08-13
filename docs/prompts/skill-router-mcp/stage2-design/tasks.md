# Skill Router MCP Stage 2 Tasks

## Design Freeze

- [x] 核对一期设计与当前 `dev` Tool Surface
- [x] 核对 `readRelatedFile` / `SourceSnapshot` / GitHub source 现有实现
- [x] 冻结 `list_skill_resources` Tool schema
- [x] 冻结 `load_skill_resource` Tool schema
- [x] 冻结 Registry v1 + Skill-subtree enumeration 方案
- [x] 冻结 SHA-bound pagination cursor
- [x] 冻结 text / binary size policy
- [x] 冻结 Git object type policy
- [x] 冻结 resource-specific error model
- [x] 冻结 immutable `skill://` URI
- [x] 冻结 Stage 2 MVP `load_skill` 向后兼容策略
- [ ] PR review 接受 `implementation-contract.md`

## Main Implementation

- [ ] 抽取统一 `SkillResolver`，从 `skillId` 解析 plugin、entry、Skill root 与 source snapshot
- [ ] 新增 `ResourceResolver`，集中实现 inventory、metadata、snapshot、path policy、range 与 size policy
- [ ] 扩展 `GitHubSkillSource` 支持 exact commit tree / subtree / blob 读取
- [ ] 实现 selected-Skill subtree enumeration 和 upstream truncation fallback
- [ ] 实现 deterministic inventory cache，key 至少包含 repository + commit + skill
- [ ] 实现 `list_skill_resources`
- [ ] 实现 `load_skill_resource`
- [ ] 在 canonical `toolDefinitions` 注册两个新 Tool
- [ ] 保持 `load_skill` Stage 2 MVP output shape 不变
- [ ] 扩展 `runtime/errors.ts` 增加冻结的 resource errors
- [ ] 增加 deterministic MIME / resource kind / resourceType 判定
- [ ] 增加 text 256 KiB default / 1 MiB hard policy
- [ ] 增加 binary metadata default / 64 KiB explicit base64 policy
- [ ] 增加 immutable `skill://<plugin>/<sha>/<skill-name>/<path>` URI 生成

## Tests

- [ ] `git-commit` 真实 reference 读取 PoC
- [ ] `pr-ruancat-repo` 三个 references 独立读取
- [ ] scripts resource test
- [ ] text asset / binary asset test
- [ ] resource isolation and invalid-input category tests
- [ ] symlink / submodule object-type tests
- [ ] source A -> B snapshot race test
- [ ] pagination cursor remains on A after source ref moves to B
- [ ] deterministic pagination no-duplicate/no-gap test
- [ ] text size / line range tests
- [ ] binary metadata / base64 cap tests
- [ ] immutable URI snapshot tests
- [ ] `tools/list` / `get_server_info.tools` canonical catalog tests

## MCP Resources Compatibility

- [ ] 复用 `ResourceResolver` 注册 immutable `skill://` resource template
- [ ] 支持 standard `resources/read` text resource
- [ ] 支持 standard `resources/read` blob resource
- [ ] 共用 URI / MIME / size / source snapshot / isolation logic
- [ ] 评估 `skill://index.json` 是否放到 Stage 2 后续小版本

## Registry / Deployment

- [x] 设计默认保持 Registry v1，不为 deep-file inventory 强制 schema bump
- [ ] 实现阶段 benchmark Skill-subtree Git tree enumeration 的请求数与延迟
- [ ] 只有 benchmark 明确失败时再提出 Registry v2 inventory 变更
- [ ] 核对 Cloudflare Workers Builds Dashboard 的 production branch、root、build/deploy command、path filters 与 secrets
- [ ] 部署包含两个新 Tool 的 Worker 测试版本
- [ ] MCP Inspector / Developer Mode 验证
- [ ] ChatGPT Refresh / Scan Tools
- [ ] ChatGPT Web 完成 `git-commit` 与 `pr-ruancat-repo` 两条真实链路

## Documentation

- [x] 新增 `implementation-contract.md` 作为冻结实现契约
- [x] 同步 `README.md` / `design.md` / Spec / acceptance / proposal / tasks / PR draft
- [ ] 实现完成后回填真实源码路径和最终测试结果
- [ ] 更新 `packages/skill-router-mcp/README.md` 增加资源调用示例
- [ ] 更新 MCP 使用文档说明 Tools 与 `skill://` Resources 两种读取入口
