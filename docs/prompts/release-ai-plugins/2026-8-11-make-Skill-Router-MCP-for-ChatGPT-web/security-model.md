# Skill Router MCP Server 安全模型

## 1. 安全目标

Skill Router MCP 是 ChatGPT Web 的外部只读能力扩展层。

核心目标：

- Skill 来源可追踪、可复现。
- MCP 只暴露必要读取能力。
- GitHub credential 不泄露。
- 生产版本 metadata 可查询但不暴露 Secret。
- Tool contract 更新经过 ChatGPT refresh/review gate。

---

# 2. 权限边界

```text
ChatGPT
  ↓
Skill Router MCP
  ↓
read-only GitHub Repository Adapter
  ↓
GitHub ai-plugins @ exact SHA
```

不提供 Git write / Shell / Docker / CI / Secret management。

---

# 3. GitHub 权限

仅需要读取 repository/ref/content 的最小权限。

禁止：

```text
contents:write
workflow:write
administration
secrets
```

实施时按 GitHub 当前权限模型选最小只读集合。

---

# 4. SourceSnapshot

```text
latest: GITHUB_REF -> exact SHA
pinned: sourceCommitSha -> exact SHA
```

本次调用 registry/Skill/related file 全部同 SHA。

调用方不能通过 tool input 指向任意 owner/repo。

---

# 5. Registry

`skill-registry.json` 是 generated index，不是 trust root。

必须：

- 固定 roots。
- id unique。
- repo-relative safe entry。
- path traversal 防护。
- 不含 Secret/绝对路径/任意远端 redirect URL。

---

# 6. Prompt Injection

Skill 内容是受控上下文数据，不是系统权限来源。

不能：

- 改写系统策略。
- 提升工具权限。
- 要求 Secret。
- 将 Skill Router 变成执行代理。

MCP server instructions 也不得要求客户端绕过上层安全策略。

---

# 7. MCP Tools

第一版：

```text
get_server_info
list_skills
search_skills
load_skill
```

全部只读。

按 OpenAI 当前 MCP annotations 准确设置 read-only / destructive / open-world 语义。

未来写操作必须独立安全设计。

---

# 8. `get_server_info` 信息披露边界

允许返回：

```text
MCP app name/version
Worker Version ID/tag/timestamp
build Git SHA
public/configured repository + ref
registry schema version
tool name/title/description
```

禁止返回：

```text
GITHUB_TOKEN
Authorization header
Cloudflare API token
Secret binding values
raw env dump
internal stack
private CI credential
```

Build Git SHA / Worker Version ID 是诊断信息，不是认证凭证。

---

# 9. Cloudflare Secret

MVP 唯一必需敏感配置：

```text
GITHUB_TOKEN
```

使用 Cloudflare Secret。

Version metadata binding 不是 Secret。

不要引入无需求的 REGISTRY_SECRET / KV / R2 credential。

---

# 10. ChatGPT Tool Metadata 安全边界

服务器端新增 tool/schema 不代表 Workspace 已批准该能力。

对于 tool name/schema/description/annotation 变化：

```text
Worker candidate
  ↓
MCP Inspector / Developer Mode validation
  ↓
ChatGPT refresh/rescan
  ↓
admin review/publish when applicable
```

OpenAI 当前 Workspace MCP 模型会冻结已批准的 tool/input snapshot，后续 server 变化不会自动启用；这实际上也是一个权限边界。生产实现不得试图通过动态 schema tricks 绕过该审核层。

---

# 11. Tool Contract 向后兼容

即使 Cloudflare 支持 gradual deployment，也不应让不兼容 tool schemas 长时间同时承载随机请求。

默认 protocol-visible change 使用：

```text
Preview/Staging
  ↓
exact candidate 100% promote
```

如果 ChatGPT 尚未刷新新 metadata，必须保持旧客户端调用仍安全失败/兼容，而不是返回错误形态或泄露内部细节。

---

# 12. 日志

可以记录：

- mcpServerVersion。
- workerVersionId/tag。
- buildGitSha。
- tool name。
- skill id。
- sourceCommitSha。
- GitHub status/rate-limit category。
- latency。

禁止记录 Token、Authorization header、完整敏感用户输入和客户端可见内部 stack。

---

# 13. 回滚安全

Worker rollback 只回滚 Worker version；Cloudflare storage 资源状态不会被一并回滚。

本项目 MVP 无 KV/R2/D1/DO schema migration，因此 Runtime rollback 风险更低，但仍要验证：

```text
server version
tools/list
get_server_info
ChatGPT tool snapshot compatibility
```

Skill 内容问题使用 Git revert/fix，不通过 Worker rollback 解决。

---

# 14. Future Cache

未来若加入 cache：

- key 必须 commit-addressed。
- Secret 不进入 key/value。
- cache 不是 Source of Truth。
- 新 storage binding 需独立权限、生命周期和 rollback 分析。

不属于 MVP。

---

# 15. 验收清单

- [ ] GitHub 最小只读权限。
- [ ] Token 只在 repository adapter 使用。
- [ ] exact SourceSnapshot。
- [ ] Registry path validation。
- [ ] 所有当前 MCP tools 只读。
- [ ] `get_server_info` 只返回安全诊断 metadata。
- [ ] Tool contract 变化不能绕过 ChatGPT refresh/admin review。
- [ ] 日志与 MCP result 无 Secret。
- [ ] Worker rollback / Skill revert 边界清楚。
- [ ] 无无必要 KV/R2/D1/DO Secret/binding。
