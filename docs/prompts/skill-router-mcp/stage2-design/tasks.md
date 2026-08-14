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

- [x] 评估独立 `SkillResolver`：冻结契约未要求新增该层；保留 `SkillRouter` registry/snapshot orchestration + `ResourceResolver` resource policy，避免空抽象
- [x] 新增 `ResourceResolver`，集中实现 inventory、metadata、snapshot、path policy、range 与 size policy
- [x] 扩展 `GitHubSkillSource` 支持 exact commit tree / subtree / blob 读取
- [x] 实现 selected-Skill subtree enumeration 和 upstream truncation fallback
- [x] 实现 deterministic inventory cache，key 至少包含 repository + commit + skill
- [x] 实现 `list_skill_resources`
- [x] 实现 `load_skill_resource`
- [x] 在 canonical `toolDefinitions` 注册两个新 Tool
- [x] 保持 `load_skill` Stage 2 MVP output shape 不变
- [x] 扩展 `runtime/errors.ts` 增加冻结的 resource errors
- [x] 增加 deterministic MIME / resource kind / resourceType 判定
- [x] 增加 text 256 KiB default / 1 MiB hard policy
- [x] 增加 binary metadata default / 64 KiB explicit base64 policy
- [x] 增加 immutable `skill://<plugin>/<sha>/<skillId>/<path>` URI 生成
- [x] 对 opaque cursor 做 exact SHA / canonical prefix / Skill identity 篡改校验并统一错误语义

## Tests

- [x] `git-commit` 真实 reference 读取 PoC
- [x] `pr-ruancat-repo` 三个 references 独立读取
- [x] scripts resource test
- [x] text asset / binary asset test
- [x] resource isolation and invalid-input category tests
- [x] symlink / submodule object-type tests
- [x] source A -> B resource snapshot race test
- [x] pagination cursor remains on A after source ref moves to B
- [x] deterministic pagination no-duplicate/no-gap test
- [x] cursor skill / source snapshot / prefix mismatch tests
- [x] malformed / tampered opaque cursor tests
- [x] text size / line range tests
- [x] binary metadata / base64 cap tests
- [x] immutable URI snapshot tests
- [x] `tools/list` / `get_server_info.tools` canonical catalog tests
- [x] production Worker harness list/load resource contract test

## MCP Resources Compatibility

- [x] 复用 `SkillRouter` / `ResourceResolver` 注册 immutable `skill://` ResourceTemplate
- [x] `resources/templates/list` 暴露 immutable Skill resource URI pattern
- [x] standard `resources/read` text resource
- [x] standard `resources/read` blob resource，并复用 64 KiB binary hard cap
- [x] 共用 URI / MIME / size / source snapshot / isolation logic
- [x] 明确 `resources/list` 不做全 Skill eager enumeration；动态实例保持 template + read 按需模式
- [x] Stage 2 MVP 不增加 `skill://index.json`；若未来 Host 需要独立 discoverable index 再以小版本评估
- [x] production Worker harness 覆盖 template discovery + text/blob `resources/read`

## Registry / Deployment

- [x] 设计默认保持 Registry v1，不为 deep-file inventory 强制 schema bump
- [ ] 实现阶段 benchmark Skill-subtree Git tree enumeration 的请求数与延迟
- [ ] 只有 benchmark 明确失败时再提出 Registry v2 inventory 变更
- [ ] 核对 Cloudflare Workers Builds Dashboard 的 production branch、root、build/deploy command、path filters 与 secrets
- [ ] 部署包含 6-tool contract + ResourceTemplate 的 Worker 测试版本
- [ ] MCP Inspector / Developer Mode 验证
- [ ] ChatGPT Refresh / Scan Tools
- [ ] ChatGPT Web 完成 `git-commit` 与 `pr-ruancat-repo` 两条真实链路

## Documentation

- [x] 新增 `implementation-contract.md` 作为冻结实现契约
- [x] 同步 `README.md` / `design.md` / Spec / acceptance / proposal / tasks / PR draft
- [x] `packages/skill-router-mcp/README.md` 增加 6-tool surface、资源调用链和 Stage 2 size/snapshot 边界
- [x] `packages/skill-router-mcp/README.md` 增加 MCP ResourceTemplate / `resources/read` compatibility 说明
- [ ] 实现完成后回填最终 CI / deployment / ChatGPT Web 验收结果
