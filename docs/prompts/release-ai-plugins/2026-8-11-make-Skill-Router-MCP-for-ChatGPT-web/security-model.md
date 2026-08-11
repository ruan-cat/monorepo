# Skill Router MCP Server 安全模型

## 1. 安全目标

Skill Router MCP Server 是 ChatGPT Web 的外部能力扩展层。

核心安全目标：

- Skill 内容可信。
- MCP 服务只提供必要能力。
- 不泄露内部资源。
- 防止恶意 Skill 注入。
- 保证 Serverless 环境安全。

---

# 2. 权限边界

架构：

```text
ChatGPT
   |
   |
Skill Router MCP
   |
   |
Skill Registry
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
- 服务器执行能力。

---

# 3. GitHub 权限模型

## 推荐权限

只需要：

```text
contents:read
metadata:read
```

用途：

- 读取 skill。
- 获取版本。
- 获取 metadata。

---

## 禁止权限

禁止：

```text
contents:write
workflow:write
administration
secrets
```

Skill Router 不应成为 GitHub 操作代理。

---

# 4. Skill 来源可信模型

Skill 加载流程：

```text
GitHub
 |
 |
Validator
 |
 |
Registry
 |
 |
MCP Response
```

验证：

- 来源仓库。
- commit SHA。
- metadata 格式。
- version。
- 文件完整性。

---

# 5. Prompt Injection 防护

Skill 是知识数据，不是系统指令。

必须区分：

```text
System Instruction

>

Skill Context

>

User Input
```

Skill 内容不能：

- 修改系统规则。
- 提升权限。
- 要求泄露 Secret。
- 指示调用危险工具。

---

# 6. MCP Tool 安全

当前只暴露：

```text
list_skills
search_skills
load_skill
```

未来增加工具时必须审核：

- 输入。
- 输出。
- 权限。
- 数据范围。

---

# 7. Cloudflare Secret 管理

禁止：

```text
代码硬编码 Token

Git 提交 Token

客户端保存 Token
```

使用：

```text
Cloudflare Secrets
```

例如：

```text
GITHUB_TOKEN
REGISTRY_SECRET
```

---

# 8. 数据安全

MCP 返回内容应限制：

允许：

- skill metadata。
- skill instructions。
- public documentation。

禁止：

- 私有配置。
- 环境变量。
- Secret。
- 内部日志。

---

# 9. 审计日志

建议记录：

```text
skill 查询

skill 加载

skill version

request timestamp

request source
```

禁止记录：

- 用户敏感内容。
- Secret。
- Token。

---

# 10. 未来扩展安全

如果增加：

- embedding。
- AI Gateway。
- 自动 Skill 推荐。

需要增加：

- 输入过滤。
- 内容审核。
- 模型调用审计。
- 访问限流。

---

# 11. AI Agent 实施验收清单

- [ ] GitHub 权限最小化。
- [ ] Skill 内容只读。
- [ ] MCP 无执行能力。
- [ ] Secret 使用 Cloudflare 管理。
- [ ] Prompt Injection 防护完成。
- [ ] 审计日志完成。
- [ ] 数据泄露测试通过。
