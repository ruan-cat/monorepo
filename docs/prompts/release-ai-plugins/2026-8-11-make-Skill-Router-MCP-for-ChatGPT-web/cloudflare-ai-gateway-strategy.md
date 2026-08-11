# Cloudflare AI Gateway 使用策略

## 文档目的

定义 Skill Router MCP Server 与 Cloudflare AI Gateway 的边界，避免 AI Agent 在实现阶段错误引入不必要的 AI 调用链。

---

# 1. 第一阶段原则

当前 Skill Router MCP Server 不需要依赖 AI Gateway。

原因：

当前核心任务：

```text
Skill Discovery
Skill Search
Skill Loading
```

本质是结构化内容读取服务。

不是：

```text
LLM Proxy
Prompt Processing
Model Inference
```

---

# 2. 第一阶段架构

推荐：

```text
ChatGPT Web
    |
    v
Cloudflare Worker
    |
    v
Skill Router MCP
    |
    +-- KV
    +-- Cache API
    +-- GitHub Registry
```

---

# 3. 不应该做的设计

禁止：

```text
ChatGPT
 |
Worker
 |
AI Gateway
 |
LLM
 |
Skill Registry
```

原因：

- 增加延迟。
- 增加成本。
- 引入不必要模型依赖。

---

# 4. 第二阶段适用场景

未来如果增加以下能力，可以引入 AI Gateway：

## Skill 智能匹配

例如：

用户描述自然语言需求。

系统自动判断最佳 skill。

---

## Embedding 搜索

架构：

```text
Skill Metadata
    |
Embedding
    |
Vector Search
```

---

## Skill Summary

自动生成技能摘要。

---

# 5. 未来架构

```text
ChatGPT Web
    |
Cloudflare Worker
    |
Skill Router
    |
AI Gateway
    |
Embedding / Rerank Model
    |
Skill Registry
```

---

# 6. AI Agent 实施要求

实现第一版本时：

不要接入 AI Gateway。

优先完成：

1. MCP 协议。
2. Skill Registry。
3. KV 缓存。
4. Cloudflare 部署。
5. ChatGPT Web 验证。

AI Gateway 属于后续智能检索增强能力。
