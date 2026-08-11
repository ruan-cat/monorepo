# Skill Router MCP：Vitest 开发期测试策略

## 1. 文档目的

本文件定义开发阶段的三层自动测试：

```text
Pure Node Unit
  ↓
Cloudflare Workers Vitest / workerd
  ↓
Production-build Integration
```

目标不仅验证 Skill Router 业务，还要验证：

- OpenAI 当前 ChatGPT MCP compatibility path。
- MCP application SemVer。
- Worker version metadata。
- `get_server_info`。
- tool catalog 单一真源。
- exact Git SourceSnapshot。

---

# 2. Vitest 版本隔离

monorepo root 当前使用 Vitest 3.x；Cloudflare Workers Vitest integration 当前要求 Vitest 4.1+。

因此：

```text
monorepo root
  -> 保持现有 Vitest 3.x

Skill Router MCP package
  -> package-local Vitest 4.1+ compatible
  -> @cloudflare/vitest-pool-workers
```

不要为了一个 MCP package 升级整个 monorepo 测试基础设施。

---

# 3. MCP SDK 测试版本原则

Production 当前按 OpenAI 官方 ChatGPT MCP 构建路径使用：

```text
@modelcontextprotocol/sdk
McpServer
Streamable HTTP
```

测试必须使用与 production **相同已锁定版本**的 MCP SDK/client 能力。

禁止：

```text
production = OpenAI-compatible SDK
测试 = upstream 新 major client
```

否则会出现“测试通过但 ChatGPT 不兼容”的假阳性。

SDK major 升级必须先过 `chatgpt-web-mcp-compatibility-profile.md`。

---

# 4. 推荐 package scripts

概念：

```json
{
  "scripts": {
    "test:unit": "vitest run -c vitest.unit.config.ts",
    "test:worker": "vitest run -c vitest.worker.config.ts",
    "test:integration": "vitest run -c vitest.integration.config.ts",
    "test:all": "pnpm test:unit && pnpm test:worker && pnpm test:integration"
  }
}
```

具体命令可按最终 package convention 调整，但三层不能混成一个不透明测试环境。

---

# 5. Pure Node Unit Tests

## 5.1 Registry Validator

覆盖：

- `schemaVersion=1`。
- required fields。
- duplicate id。
- invalid entry path。
- unsupported schema。
- v1 不依赖 references/templates/examples。

## 5.2 Search

覆盖：

- exact id/name match。
- description/plugin token match。
- normalization。
- stable ranking。
- no match。
- search 不触发正文 loader。

## 5.3 SourceSnapshot

```text
unpinned: GITHUB_REF -> exact SHA
pinned: sourceCommitSha -> exact SHA
```

覆盖：

- ref 只 resolve 一次。
- pinned 不 resolve mutable ref。
- downstream 只接收 exact SHA。
- input 不能覆盖任意 owner/repo。

## 5.4 Domain Errors

至少：

```text
REGISTRY_NOT_FOUND
REGISTRY_SCHEMA_UNSUPPORTED
SKILL_NOT_FOUND
REGISTRY_ENTRY_INVALID
SOURCE_COMMIT_INVALID
GITHUB_AUTH_FAILED
GITHUB_RATE_LIMITED
GITHUB_UPSTREAM_FAILED
```

错误不得包含 Token / Authorization header。

---

# 6. Tool Definitions Unit Contract

第一版统一 tool registry：

```text
get_server_info
list_skills
search_skills
load_skill
```

测试必须证明 `toolDefinitions` 是下列能力的共同来源：

```text
McpServer registration
expected tools/list catalog
get_server_info.tools
contract tests
```

不要在测试里再手工复制四个 tool 名称后假装“同源”。

应通过 imported canonical definitions 生成 expected results。

---

# 7. MCP Application Version Unit Contract

MCP package：

```text
package.json.version
```

必须是唯一 server application version。

测试：

```text
createServer().version
== packageVersion

getServerInfo().server.version
== packageVersion
```

如果实现 SDK 不直接暴露内部 version 字段，则通过标准 initialization/server info contract 从客户端侧断言。

禁止第二份：

```text
const MCP_VERSION = "..."
```

手工漂移。

---

# 8. `get_server_info` Unit Tests

输入：空对象。

fixture：

```text
packageVersion
buildGitSha
workerVersionId/tag/timestamp
source repository/ref
registry schema
canonical toolDefinitions
```

输出必须：

- 不访问 GitHub HEAD。
- 不接触 GitHub Token。
- server version 等于 package version。
- deployment info 等于 fixture。
- tools 动态来自 toolDefinitions。
- 无 raw env dump。

---

# 9. GitHub Repository Adapter Unit Tests

完全 mock outbound transport。

覆盖：

```text
resolveRef(dev) -> A
readRegistry(A)
readSkill(A, path)
readRelatedFile(A, path)
```

断言：

- snapshot 建立后后续 URL/ref 全部是 A。
- pinned A 不调用 branch resolve。
- 401/403/404/rate-limit/malformed upstream 映射正确。
- Token 只进入 HTTP auth boundary。

普通 PR unit tests 不访问真实 GitHub。

---

# 10. Workers Vitest / workerd

配置：

```text
vitest.worker.config.ts
@cloudflare/vitest-pool-workers
```

覆盖真实 Worker runtime semantics：

- Nitro Worker adapter。
- Request/Response/Headers/URL/fetch/Web Crypto。
- Runtime bindings。
- `CF_VERSION_METADATA` fixture/binding access。
- MCP Streamable HTTP endpoint。
- initialization / tool discovery。
- malformed request safety。
- no KV/R2/D1/DO requirement。

不要给 Workers Vitest project 再叠自定义 Node environment/runner。

---

# 11. Runtime Binding Tests

验证：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
CF_VERSION_METADATA
```

通过 Nitro v3 current request runtime extractor 正确进入 adapter。

特别断言：

- Service 不直接读取 Worker env。
- 无 `process.env.GITHUB_TOKEN`。
- GitHub Token 不进入 DeploymentInfo。
- Worker version metadata 不进入 SourceSnapshot。

---

# 12. MCP Runtime Contract

在 workerd 或 integration 层使用真实 MCP client/协议请求覆盖：

```text
initialization
server info/instructions
tools/list
get_server_info
list_skills
search_skills
load_skill latest
load_skill pinned
invalid inputs
```

这组测试必须使用 OpenAI 当前 ChatGPT compatibility profile 对应的 SDK path，而不是另一个 upstream future protocol client。

---

# 13. 高频更新 Fixtures

不要依赖真实 `dev` 在测试中被 push。

Fake transport：

```text
resolve #1 -> A
resolve #2 -> B
```

场景：

```text
search -> A
branch model -> B
load(pin=A) -> A
load(no pin) -> B
```

deterministic 且不会产生远程 flaky test。

---

# 14. Worker Version Metadata Tests

测试 fixture：

```text
CF_VERSION_METADATA = {
  id,
  tag,
  timestamp
}
```

断言：

```text
get_server_info.deployment
health deployment fields
```

一致。

不要把本地 fixture ID 误称为 Cloudflare production active version；远端 Preview/Production smoke 才验证真实 version ID。

---

# 15. Build Git SHA Tests

build-info module 在测试可注入 deterministic fixture。

验证：

- 非空。
- 格式合理。
- `get_server_info` / health 使用同一 build info source。
- runtime 不尝试调用 Git/fs 获取 SHA。

---

# 16. Production-build Integration

配置：

```text
vitest.integration.config.ts
```

使用：

```text
Nitro Cloudflare production build
+
Wrangler createTestHarness()
+
external HTTP/MCP client
```

GitHub upstream 用 MSW/等价 mock。

必须覆盖：

```text
GET /health
initialization/server version
tools/list
get_server_info
search/list/load latest+pin
negative/error paths
```

这里验证的是最终 build/config/route/transport 组合。

---

# 17. ChatGPT Tool Metadata Change 不能只靠 Vitest

Vitest 可以证明 tool definitions 正确，但不能证明 ChatGPT 已刷新/批准新的工具 snapshot。

当 tool metadata/schema 变化时，自动测试之后还必须：

```text
MCP Inspector
  ↓
ChatGPT Developer Mode refresh/rescan
  ↓
use-case/eval acceptance
  ↓
Workspace review/publish when applicable
```

该产品 gate 不得伪造成 unit test “已完成”。

---

# 18. Coverage

不要以全局覆盖率数字替代关键 behavior tests。

关键分支必须覆盖：

- exact snapshot。
- latest/pinned。
- version/tool catalog consistency。
- GitHub security/error paths。
- Worker binding behavior。
- MCP initialization/transport。

Workers coverage 使用 Cloudflare/Vitest 当前支持方式；不要硬套不支持的 native V8 路径。

---

# 19. 开发快速反馈

纯 domain：

```text
test:unit
```

Worker/MCP adapter：

```text
test:unit + test:worker
```

准备提交：

```text
test:all + typecheck + production build
```

不要求每次保存代码就远程部署 Cloudflare。

---

# 20. Definition of Done

- [ ] package-local Vitest 4.1+ 与 root Vitest 3.x 隔离。
- [ ] production/test MCP SDK 版本一致。
- [ ] toolDefinitions 单一真源有测试。
- [ ] server SemVer 单一真源有测试。
- [ ] get_server_info 有完整 unit/runtime contract。
- [ ] exact snapshot latest/pin fixtures 完整。
- [ ] Workers Vitest 真正运行 workerd。
- [ ] CF_VERSION_METADATA / build SHA contract 有测试。
- [ ] production build harness 从外部 HTTP/MCP 验收。
- [ ] ChatGPT tool metadata 更新保留真实 refresh/review gate。
