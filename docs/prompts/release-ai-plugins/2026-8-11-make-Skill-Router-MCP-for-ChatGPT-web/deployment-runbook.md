# Skill Router MCP Server 部署运行手册

## 目标

本文描述生产部署、版本确认和回滚流程。

核心原则：

```text
Skill 内容发布
!=
MCP Runtime 发版
```

Skill-only 更新直接通过 GitHub exact snapshot 生效；MCP Runtime/code/config 更新才发布新的 Cloudflare Worker version。

---

# 1. 生产架构

```text
ChatGPT Web
  ↓
https://mcp.ai.ruan-cat.com/mcp
  ↓
Cloudflare active Worker Version
  ↓
Nitro v3 + MCP SDK v2 / MCP 2026-07-28
  ↓
Skill Router
  ↓
GitHub exact SourceSnapshot
```

---

# 2. Runtime 配置

公开：

```toml
[vars]
GITHUB_OWNER = "ruan-cat"
GITHUB_REPO = "monorepo"
GITHUB_REF = "dev"
```

敏感：

```bash
wrangler secret put GITHUB_TOKEN
```

版本 metadata：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

MVP 不创建 KV/R2/D1/DO。

---

# 3. MCP Application Version

MCP package `package.json.version` 是 server application SemVer。

每次 Runtime production release 按变更类型 bump：

```text
PATCH = bugfix/internal compatible
MINOR = backward-compatible tool/optional capability
MAJOR = breaking tool/input/output contract
```

Skill version 更新不 bump MCP Server version。

---

# 4. Build Metadata

生产 bundle 必须包含：

```text
buildGitSha
```

来源于 CI commit SHA / build-time Git SHA。

运行时 `get_server_info` / `/health` 可以报告：

```text
MCP app version
MCP protocol revision
Worker Version ID/tag/timestamp
buildGitSha
```

---

# 5. 本地/CI Gate

发版前：

```text
typecheck
  ↓
Node unit
  ↓
Workers Vitest/workerd
  ↓
MCP v2 modern contract
  ↓
Nitro Cloudflare production build
  ↓
createTestHarness integration
```

不通过则不 upload production candidate。

---

# 6. 推荐 Worker Version Upload

生产不要把“构建成功”直接等同“立即切流量”。

推荐先：

```bash
wrangler versions upload --tag skill-router-mcp-vX.Y.Z --message "git <sha>: <summary>"
```

得到：

- immutable Worker Version ID。
- version tag。
- preview URL。

实际 CLI 以发版时 Wrangler 当前版本为准。

---

# 7. Preview / Staging Smoke

在被 promote 前测试 exact candidate version：

```text
GET /health
modern server identity
tools/list
get_server_info
search known Skill
load pinned
load latest
```

断言：

```text
server SemVer = X.Y.Z
workerVersionId = uploaded version
workerVersionTag = skill-router-mcp-vX.Y.Z
buildGitSha = release commit
```

---

# 8. Production Promotion

Preview/Staging 通过后，把**同一个 exact Worker version** promote 到 production。

默认 protocol-visible/tool schema 改动：

```text
100% atomic promotion
```

概念：

```bash
wrangler versions deploy skill-router-mcp-vX.Y.Z@100% -y
```

第一版不为 tool catalog 改动默认做双版本 gradual rollout。

---

# 9. Production Post-deploy Smoke

promote 后立即执行：

```text
GET /health
read modern serverInfo
tools/list
get_server_info
search known Skill
load pinned
```

确认线上实际：

- MCP application version。
- Worker Version ID/tag。
- build Git SHA。
- 完整 tool catalog。

不要只凭 `git push` / CI 绿色 / Wrangler exit 0 宣称线上已更新。

---

# 10. MCP 现代协议验收

目标 protocol revision：

```text
2026-07-28
```

不再把旧 `initialize/initialized` 作为 production modern protocol 成功条件。

验收：

- modern server identity 可读。
- standard `tools/list` 工作。
- `get_server_info` 工作。
- tools/call 工作。
- 无 `Mcp-Session-Id` 持久会话依赖。

---

# 11. Tool Catalog 查询

标准工具目录：

```text
tools/list
```

面向 ChatGPT/人的诊断：

```text
get_server_info
```

两者都必须来自统一 `toolDefinitions`。

第一版核心：

```text
get_server_info
list_skills
search_skills
load_skill
```

---

# 12. Skill-only 发布

修改：

```text
ai-plugins/**
```

正常流程：

```text
release-ai-plugins
  ↓
registry generated/checked
  ↓
Git commit / push
  ↓
next unpinned Skill call reads new HEAD
```

不执行 Worker version upload/deploy。

---

# 13. 自动部署 Trigger Boundary

Worker CI 只监听 MCP runtime/config/build input。

`ai-plugins/**` 和纯 docs 变化不应单独触发 production Worker deployment。

使用 Cloudflare Build Watch Paths 或 GitHub Actions `paths` 实现。

本项目推荐一个 production deployment authority：GitHub Actions + Wrangler；如果最终改用 Cloudflare Git Integration，就停用 GitHub Actions 对同一 Worker 的自动 production deploy。

---

# 14. Freshness 验收

Skill source：

```text
search -> sourceCommitSha=A
push B
load(pin=A) -> A
load(no pin) -> latest B
```

不需要 Worker redeploy。

Worker version：

```text
candidate Worker version N
promote N
get_server_info -> Worker N
```

两类 freshness 不要混淆。

---

# 15. 回滚

## MCP Runtime 故障

```bash
wrangler rollback <stable-version-id>
```

然后立即运行 health / serverInfo / tools/list / get_server_info smoke。

## Skill 内容故障

Git revert/fix Skill commit，产生新 target ref HEAD。

不要为了 Skill 内容问题回滚 Worker。

---

# 16. 发版完成证据

MCP Runtime release 完成需要：

```text
1. SemVer bump
2. all tests pass
3. production build pass
4. immutable Worker version uploaded
5. preview/staging smoke pass
6. exact version promoted
7. production smoke pass
8. get_server_info reports expected MCP/Worker/build version
9. tools/list reports expected catalog
10. rollback target known
```

---

# 17. ChatGPT Web 最终验收

建议直接问：

```text
告诉我你当前 Skill Router MCP 的服务版本、协议版本、Cloudflare Worker 部署版本和全部可用工具。
```

再测试：

```text
搜索一个 Skill，并加载刚才搜索到的同一个 sourceCommitSha 版本。
```

这两类请求分别验证 MCP Runtime version 和 Skill snapshot version。
