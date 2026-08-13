# Skill Router MCP Stage 2 验收方案

## 1. 验收目标

二期验收必须基于真实 Skill，而不是只写 mock fixture。

首批固定案例：

1. `git-commit`
2. `pr-ruancat-repo`
3. 至少一个包含 `scripts/` 的 Skill
4. 至少一个包含 `assets/` 或二进制资源的 Skill

## 1.1 当前基线确认

二期实现前应固定一个 negative baseline：

- 当前 `tools/list` 只有 `get_server_info` / `list_skills` / `search_skills` / `load_skill`；
- 当前 `load_skill("git-commit")` 可以拿到 `SKILL.md`；
- 当前 ChatGPT Tool Surface 无法继续调用 `readRelatedFile`；
- `SkillRouter.readRelatedFile` 仅作为内部实现基线存在。

这样二期验收能明确证明“内部能力被正确公开并完整化”，而不是只证明 GitHub API 本身可以读文件。

## 2. Case A — git-commit

### 2.1 流程

```text
search_skills("git-commit")
  ↓
记录 sourceCommitSha = A
  ↓
load_skill("git-commit", A)
  ↓
确认 SKILL.md 引用 references/commit-types.ts
  ↓
load_skill_resource(
  skillId = "git-commit",
  path = "references/commit-types.ts",
  sourceCommitSha = A
)
```

### 2.2 验收点

- [ ] 可以得到 `commit-types.ts`
- [ ] 返回 source SHA = A
- [ ] MIME 合理
- [ ] `kind=reference`
- [ ] 内容不是 GitHub HTML 页面
- [ ] 不能越过 Skill root
- [ ] dev 后续变化不影响本次 A snapshot

## 3. Case B — pr-ruancat-repo

需要读取：

```text
references/target-repos.md
references/workflow-and-template.md
references/batch-pr-script.ts
```

### 验收点

- [ ] 三个文件均可独立读取
- [ ] 可以先 `list_skill_resources(prefix="references/")` 发现
- [ ] 也可以在已知路径时直接 `load_skill_resource`
- [ ] 无需重新 search skill
- [ ] 同一个 source commit 一致

## 4. Case C — script

选择一个仓库内真实包含 `scripts/` 的 Skill。

验收：

- [ ] `list_skill_resources` 能识别 `kind=script`
- [ ] `load_skill_resource` 能返回脚本文本
- [ ] Router 不执行脚本
- [ ] 不授予 shell 权限
- [ ] 文件大小规则生效

## 5. Case D — asset

选择一个真实 asset。

### 文本 asset

例如模板 / JSON：

- [ ] 能直接作为 text 返回；
- [ ] MIME 正确。

### 二进制 asset

例如 PNG：

- [ ] 返回 `mimeType=image/png`
- [ ] 返回 `size`
- [ ] 小 blob 按策略可 base64
- [ ] 大 blob 不静默塞入模型上下文
- [ ] canonical `skill://` URI 可生成

## 6. 安全验收

以下请求必须失败：

```text
../package.json
../../.git/config
/README.md
C:\Windows\System32\drivers\etc\hosts
..\..\another-skill\SKILL.md
references/%2e%2e/%2e%2e/foo
```

## 7. Snapshot Race 验收

测试步骤：

```text
1. 获取 sourceCommitSha=A
2. 让 dev 推进到 B
3. load_skill(..., A)
4. load_skill_resource(..., A)
5. 再用省略 SHA 的调用读取 latest
```

预期：

- 固定 A 的调用仍返回 A；
- latest 调用可以解析到 B；
- A/B 缓存不能互串。

## 8. ChatGPT Web 端到端验收

自然语言任务：

> 给这个仓库编写一个符合我规则的 PR title。

预期 Agent 行为：

```text
Skill Router MCP
  search git-commit / pr skill
  ↓
load SKILL.md
  ↓
发现 commit-types.ts
  ↓
load_skill_resource(commit-types.ts)
  ↓
生成 commit/PR 文案

GitHub App
  ↓
执行仓库读取 / PR 操作
```

重点：

- Skill Router MCP 提供方法与规则；
- GitHub App 提供仓库执行能力；
- Router 不承担 GitHub 职责；
- Agent 不需要用户手工复制 `references/commit-types.ts`。
