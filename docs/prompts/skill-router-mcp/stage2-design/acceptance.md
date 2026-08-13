# Skill Router MCP Stage 2 验收方案

## 1. 验收目标

Stage 2 必须基于真实 Skill 验收，而不是只依赖 mock fixture。

固定案例：

1. `git-commit`
2. `pr-ruancat-repo`
3. 至少一个真实包含 `scripts/` 的 Skill
4. 至少一个真实包含 `assets/` 的 Skill

同时保留当前一期 negative baseline：部署前 ChatGPT 侧只有四个公开工具，`readRelatedFile` 仍只是内部能力。

## 2. Case A — git-commit

调用链：

```text
search_skills("git-commit")
  -> sourceCommitSha = A
  -> load_skill("git-commit", A)
  -> confirm SKILL.md references commit-types.ts
  -> load_skill_resource("git-commit", referenced path, A)
```

验收：

- 能得到 `references/commit-types.ts`
- response source SHA = A
- kind = reference
- MIME 合理
- 内容来自仓库文件本体
- source ref 后续变化不影响 pinned A

## 3. Case B — pr-ruancat-repo

需要独立读取：

```text
references/target-repos.md
references/workflow-and-template.md
references/batch-pr-script.ts
```

验收：

- 三个资源均可独立读取
- 可先按 references prefix 枚举
- 已知准确路径时可直接 load
- direct load 不要求调用方先 list
- 同一调用链 source SHA 一致

## 4. Case C — script

选择仓库内真实包含 `scripts/` 的 Skill。

验收：

- list 可识别 kind=script
- load 可返回脚本文本和 metadata
- Router 不执行脚本
- 文本大小策略生效

## 5. Case D — asset

### Text asset

- 能以 text 返回
- MIME 与 size 正确

### Binary asset

- 默认 metadata-only
- 显式 base64 只允许在固定 inline cap 内
- 大型 binary 不进入模型上下文
- immutable `skill://` URI 可生成

## 6. Isolation / Object-Type 验收

必须覆盖以下行为类别：

- 非 Skill-root relative 输入被拒绝
- 跨 Skill 请求被拒绝
- 编码形式不能改变 resource root 语义
- symlink 只允许列出 metadata，不跟随
- submodule 只允许列出 metadata，不进入子仓库
- public invalid-path error 稳定

具体 fixture 由实现测试文件表达，不在设计文档内保存攻击字符串。

## 7. Snapshot Race 验收

```text
1. resolve source A
2. source ref advances to B
3. load_skill pinned to A
4. load_skill_resource pinned to A
5. unpinned load reads latest
```

预期：

- pinned calls remain on A
- latest call may resolve B
- A/B inventory 与 content cache 不互串

## 8. Pagination Snapshot 验收

构造超过一页的真实或 fixture inventory：

```text
page 1 -> A -> nextCursor
source ref -> B
page 2(nextCursor)
```

预期：

- page 2 仍属于 A
- cursor 不能切换 Skill、prefix 或 source snapshot
- deterministic order 下无重复、无漏项

## 9. Size / Binary 验收

### Text

- <=256 KiB 默认可直接返回
- 默认预算以上、1 MiB hard cap 以下：提高 `maxBytes` 后可读取
- hard cap 以上：fail closed
- line range 使用 1-based inclusive
- range 返回仍遵守 effective output budget

### Binary

- default metadata-only
- explicit base64 在 64 KiB raw cap 内成功
- cap 以上显式失败
- MIME 与 raw size 正确

## 10. Immutable URI 验收

同一个 Skill 在两个 source snapshots 中必须产生不同 URI；同一 snapshot 下相对资源 URI 必须保留同一 Skill namespace 和 source SHA。

## 11. ChatGPT Web 端到端验收

自然语言任务：

> 给这个仓库编写一个符合我规则的 PR title。

预期 Agent 行为：

```text
Skill Router MCP
  -> search/load relevant Skill
  -> discover referenced resource
  -> load_skill_resource
  -> generate rule-compliant text

GitHub App
  -> repository read / PR operation
```

重点：

- Skill Router MCP 提供方法和规则
- GitHub App 提供仓库执行能力
- Router 不承担 GitHub PR 职责
- 用户不需要手工复制 reference 文件

## 12. Deployment Acceptance

新增 Tool 进入生产后必须验证：

1. Worker runtime 已包含两个新 Tool
2. MCP Inspector / Developer Mode 可见新 schema
3. ChatGPT Refresh / Scan Tools 后可实际调用
4. `get_server_info.tools` 与 canonical `toolDefinitions` 一致
5. Skill-only 内容变化仍不要求 Worker redeploy
