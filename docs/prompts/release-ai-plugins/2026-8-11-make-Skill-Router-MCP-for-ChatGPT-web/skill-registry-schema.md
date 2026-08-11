# Skill Registry Schema 实施规范

## 1. 文档目的

本文档定义 Skill Router MCP Server 使用的 Skill Registry 数据模型。

目标：

- 将 `ai-plugins/dev-skills` 目录转换为机器可发现的 Skill Registry。
- 让 ChatGPT Web Developer Mode 可以通过 MCP 动态检索和加载 skill。
- 让后续 AI Agent 可以根据本规范实现 Registry Builder、Loader 和 Validator。

该 Registry 不替代原有 AI Plugin 格式，而是作为适配层。

架构：

```text
ai-plugins/dev-skills
        |
        |
Registry Builder
        |
        v
registry.json
        |
        v
Cloudflare KV
        |
        v
Skill Router MCP Server
```

---

# 2. Skill 来源规范

Skill 来源：

```text
ai-plugins/dev-skills/skills/*
```

每个 skill 目录可能包含：

```text
skill-name/
|
├── SKILL.md
├── metadata.yaml
├── references/
├── templates/
└── examples/
```

其中：

- SKILL.md：主要上下文入口。
- metadata.yaml：机器读取元数据。
- references：详细参考资料。
- templates：可复制工程模板。

---

# 3. Skill Metadata Schema

推荐 YAML：

```yaml
id: nitro-api-development
name: Nitro API 开发
version: 0.13.5
status: stable

description: |
  使用 Nitro v3 和 H3 开发 Server API。

category:
  - backend
  - nitro

triggers:
  - Nitro API
  - h3
  - defineHandler

capabilities:
  - api-design
  - serverless-api

runtime:
  compatible:
    - cloudflare-worker
    - node

files:
  entry: SKILL.md
  references:
    - references/*.md

security:
  trust_level: verified
  executable: false
```

---

# 4. Registry JSON Schema

生成文件：

```text
registry.json
```

结构：

```json
{
  "schemaVersion": "1",
  "generatedAt": "2026-08-11T00:00:00Z",
  "source": {
    "repository": "ruan-cat/monorepo",
    "path": "ai-plugins/dev-skills"
  },
  "skills": []
}
```

---

# 5. Skill 生命周期

状态：

```text
experimental
      |
      v
stable
      |
      v
deprecated
```

MCP Server 不应该返回 deprecated skill，除非明确查询。

---

# 6. Skill 搜索索引

Registry Builder 应生成搜索字段：

```json
{
 "keywords": [
   "nitro",
   "api",
   "h3"
 ]
}
```

第一阶段：

- keyword matching
- tag matching

第二阶段：

- embedding
- vector search
- rerank

---

# 7. Skill Loading 策略

禁止一次加载所有 skill。

正确流程：

```text
用户任务
 |
search_skills
 |
得到候选
 |
load_skill
 |
返回详细上下文
```

避免：

- Context 爆炸。
- 无关技能污染模型。

---

# 8. Cloudflare KV 存储设计

推荐：

```text
skill:registry

skill:{skillId}:metadata

skill:{skillId}:content
```

示例：

```text
skill:nitro-api-development:metadata
```

保存 metadata。

```text
skill:nitro-api-development:content
```

保存 SKILL.md 内容。

---

# 9. Registry Builder

由 GitHub Actions 执行：

流程：

```text
checkout repo

↓

scan dev-skills

↓

validate metadata

↓

generate registry.json

↓

publish KV
```

---

# 10. 校验规则

必须检查：

- id 唯一。
- version 合法。
- SKILL.md 存在。
- metadata 格式正确。
- 不包含危险执行指令。

---

# 11. 与 MCP Tool 映射

Registry 提供：

```text
list_skills
```

读取 registry。

```text
search_skills
```

读取索引。

```text
load_skill
```

读取 skill content。

---

# 12. AI Agent 实现要求

实现时必须：

- 保留现有 ai-plugins 兼容性。
- 不修改原 skill 内容。
- 使用 Adapter 层转换。
- Registry 生成必须可重复执行。
- Cloudflare Worker 运行时禁止扫描 GitHub。

最终目标：

```text
GitHub Skills
      |
Registry
      |
MCP
      |
ChatGPT Web
```
