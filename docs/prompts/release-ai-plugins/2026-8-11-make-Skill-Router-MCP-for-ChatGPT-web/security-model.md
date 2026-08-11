# Skill Router MCP Server 安全模型

## 1. 安全目标

Skill Router MCP Server 是 ChatGPT Web 的外部只读能力扩展层。

核心目标：

- Skill 来源可追踪、可复现。
- MCP 服务只提供必要的读取能力。
- GitHub credential 不泄露。
- Skill 内容不获得高于系统策略的权限。
- Worker 运行时保持最小攻击面。

---

# 2. 权限边界

```text
ChatGPT
   |
Skill Router MCP
   |
read-only GitHub Repository Adapter
   |
GitHub ai-plugins @ exact commit SHA
```

Skill Router 默认：

```text
只读
只查询
只返回上下文
```

不提供：

- Git 写操作。
- 仓库修改。
- Secret 管理。
- Shell/Docker/CI 执行。

---

# 3. GitHub 权限模型

只需要最小只读权限，用于：

- 解析 ref / commit。
- 读取 registry。
- 读取 Skill 文件。

禁止授予：

```text
contents:write
workflow:write
administration
secrets
```

如果仓库/认证形态允许更细粒度权限，实施时使用当前 GitHub 官方权限模型中的最小集合。

---

# 4. SourceSnapshot 可信模型

```text
GITHUB_REF
   |
resolve exact commit SHA
   |
SourceSnapshot
   |
   +-- registry @ SHA
   +-- SKILL.md @ SHA
   +-- references @ SHA
```

必须记录或返回可诊断的 `sourceCommitSha`，这样任何加载结果都能映射回 Git 历史。

禁止同一个 tool call 在多个 mutable branch read 之间拼接数据。

---

# 5. Skill Registry 安全边界

`ai-plugins/skill-registry.json` 是生成索引，不是新的 trust root。

必须：

- 从固定允许的 skill roots 生成。
- 校验 repo-relative path，防止 path traversal。
- 校验 id 唯一。
- 校验 entry 确实位于允许 roots。
- 不包含 Secret。
- 不包含本机绝对路径。
- 不包含任意远程 URL 作为未经审核的加载目标。

运行时始终从配置的 `GITHUB_OWNER/GITHUB_REPO` 和 exact SHA 读取，不根据 registry 把请求重定向到任意仓库。

---

# 6. Prompt Injection 防护

Skill 是受控上下文数据，不是系统权限来源。

Skill 内容不能：

- 修改系统规则。
- 提升工具权限。
- 要求泄露 Secret。
- 将只读 Skill Router 变为执行代理。

MCP server-level instructions 也不得要求客户端改变人格或绕过上层规则。

---

# 7. MCP Tool 安全

第一版核心 tools：

```text
list_skills
search_skills
load_skill
```

工具 annotations 应表达只读、非破坏性语义。

未来新增任何写操作必须作为新的安全设计，不得偷偷扩展现有 Skill Router。

---

# 8. Cloudflare Secret 管理

第一版唯一必需敏感配置：

```text
GITHUB_TOKEN
```

使用 Cloudflare Secret 管理。

不要引入没有实际用途的：

```text
REGISTRY_SECRET
KV credential
R2 credential
```

第一版没有 registry Cloudflare publish pipeline，因此也不需要对应写入密钥。

---

# 9. 日志与错误

可以记录：

- tool name。
- skill id。
- source commit SHA。
- GitHub status/rate-limit 的非敏感诊断字段。
- latency。

禁止记录：

- Authorization header。
- GitHub Token。
- 用户不必要的敏感输入。
- 完整内部 stack 到 MCP 客户端。

---

# 10. 可选缓存未来安全

如果未来增加 cache：

- cache key 必须包含 commit SHA。
- Secret 不得进入 key/value。
- cache 内容仍必须绑定配置仓库和 exact commit。
- 新 storage binding 需要独立权限、数据生命周期和泄露评估。

这不是 MVP 范围。

---

# 11. 验收清单

- [ ] GitHub 权限只读且最小化。
- [ ] `GITHUB_TOKEN` 只在 repository adapter 使用。
- [ ] SourceSnapshot 固定 exact commit。
- [ ] Registry path 校验完成。
- [ ] MCP 无执行能力。
- [ ] Prompt Injection 边界完成。
- [ ] 无不必要的 Registry/KV/R2 Secret。
- [ ] 日志和 MCP 输出无 credential 泄露。
