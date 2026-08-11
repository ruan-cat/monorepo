# Nitro v3 生产级接口开发指导

## 文档定位

本文指导 Skill Router MCP 在 Cloudflare Workers 上正确使用 Nitro v3。

核心链路：

```text
ChatGPT Web
  ↓
Streamable HTTP
  ↓
Cloudflare Worker
  ↓
Nitro v3
  ↓
@modelcontextprotocol/sdk / McpServer
  ↓
Skill Router
```

MCP SDK 路径以 OpenAI 当前 ChatGPT 官方构建文档为 production compatibility baseline。

---

# 1. Nitro / H3 边界

Nitro v3 是应用 Runtime。

H3 是 Nitro 管理的 HTTP runtime layer，不作为平行 framework 人工 pin 主版本。

```text
Application
  ↓
Nitro v3
  ↓
H3 runtime
  ↓
Cloudflare adapter
```

---

# 2. 直接依赖

生产：

```text
nitro
@modelcontextprotocol/sdk
zod
```

测试使用同一 MCP SDK version。

不要在 OpenAI ChatGPT compatibility 尚未确认时擅自换成 MCP upstream 新 major/package split。

---

# 3. Nitro / MCP SDK 分工

Nitro：

- Worker runtime abstraction。
- routes/handlers。
- Cloudflare adapter。
- binding extraction boundary。

MCP SDK：

- initialization/protocol negotiation。
- server identity/instructions。
- tools/list / tools/call。
- Streamable HTTP protocol handling。
- schemas/results/errors/annotations。

Nitro handler 不实现 MCP lifecycle。

---

# 4. Handler 规范

使用实施时 Nitro v3 当前官方 handler API。

Handler 只做：

```text
request runtime extraction
  ↓
MCP SDK adapter/transport
  ↓
Response
```

禁止：

- handler 写 Skill search/load 业务。
- handler 拼 GitHub auth header。
- 自建 Node HTTP server。
- 手写 JSON-RPC。

---

# 5. Cloudflare Runtime 约束

禁止：

```text
fs persistence
child_process
listen()
Node HTTP server
module-scope latest Skill state
```

MVP 不依赖 KV/R2/D1/DO。

SourceSnapshot consistency 由 Git exact SHA 解决，不依赖 Cloudflare storage/session state。

---

# 6. Runtime Bindings

必需：

```text
GITHUB_OWNER
GITHUB_REPO
GITHUB_REF
GITHUB_TOKEN
CF_VERSION_METADATA
```

`CF_VERSION_METADATA`：

```toml
[version_metadata]
binding = "CF_VERSION_METADATA"
```

用于 Worker Version ID/tag/timestamp。

具体访问方式必须遵循当前 Nitro v3 Cloudflare adapter request runtime，不能复用旧 Nitro v2 context 经验。

---

# 7. Build Git SHA

Worker build commit 在 build time 注入：

```text
build-info.generated.ts
```

来源 GitHub Actions `GITHUB_SHA` 或 build-time `git rev-parse HEAD`。

运行时不执行 Git 命令。

---

# 8. GitHub SourceSnapshot

Latest：

```text
GITHUB_REF -> exact SHA once
```

Pinned：

```text
sourceCommitSha -> exact SHA
```

随后 registry/Skill/related file 全部同 SHA。

---

# 9. Server Version / Deployment Version

McpServer version：

```text
package.json.version
```

Worker deployment version：

```text
CF_VERSION_METADATA.id/tag/timestamp
```

build version：

```text
buildGitSha
```

不要混用。

---

# 10. 发版边界

## Skill-only

```text
Git Skill update
```

不重新 build/deploy Nitro Worker。

## MCP Runtime

```text
SemVer bump
 -> Nitro production build
 -> tests/harness
 -> Worker version upload
 -> Preview/Staging
 -> exact production promote
 -> smoke
```

## Tool Contract

如果 MCP tool schema/metadata 变化，Worker 上线后还要执行 ChatGPT Developer Mode refresh/rescan 和必要的 Workspace review/publish。

---

# 11. MCP Protocol/SDK Upgrade

未来升级 MCP upstream major 前：

```text
OpenAI current docs support
Inspector pass
ChatGPT Web pass
```

缺一不可。

详细：`chatgpt-web-mcp-compatibility-profile.md`。

---

# 12. AI Agent 检查

- [ ] Nitro v3。
- [ ] H3 由 Nitro 管理。
- [ ] MCP SDK 与 OpenAI 当前官方 ChatGPT 路径一致。
- [ ] initialization/Streamable HTTP 正常。
- [ ] handler 只做 adapter。
- [ ] exact SHA source reads。
- [ ] CF_VERSION_METADATA 可读。
- [ ] build SHA 构建期注入。
- [ ] Skill-only update 不部署 Worker。
- [ ] Tool contract update 有 ChatGPT refresh gate。
- [ ] 无 mandatory KV/R2/D1/DO。
