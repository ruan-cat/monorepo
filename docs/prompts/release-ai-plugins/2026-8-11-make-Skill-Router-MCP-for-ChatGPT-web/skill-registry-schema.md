# Skill Registry Schema 实施规范

## 1. 文档目的

本文定义 Skill Router MCP Server 使用的仓库级 Skill Registry。

推荐生成文件：

```text
ai-plugins/skill-registry.json
```

它的定位是：

> **由现有 Skill 源文件确定性生成的机器可发现索引。**

它不是数据库、不是缓存、不是独立 Source of Truth，也不需要发布到 Cloudflare KV/R2。

Source of Truth 始终是同一 Git commit 中的：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
```

---

# 2. 为什么需要仓库级 Registry

如果 MCP 每次 `list_skills` / `search_skills` 都通过 GitHub API 遍历两个 skills 目录并逐个读取 `SKILL.md`，请求数量、延迟和实现复杂度都会增加。

`ai-plugins/skill-registry.json` 将稳定的发现信息预先整理为一个小型 manifest：

```text
Git commit
  |
  +-- ai-plugins/skill-registry.json
  +-- ai-plugins/common-tools/skills/**
  +-- ai-plugins/dev-skills/skills/**
```

运行时只需：

```text
resolve branch -> commit SHA
          |
          v
read skill-registry.json @ SHA
          |
          +---- list/search
          |
          v
load selected SKILL.md @ same SHA
```

---

# 3. Registry 不保存自身 commit SHA

不要生成：

```json
{
  "sourceCommitSha": "<当前文件所在 commit>"
}
```

原因：Git commit SHA 由 commit 内容决定，而 registry 文件本身又属于 commit 内容；把“当前 commit SHA”写入文件会形成自引用，无法在提交前稳定求值。

正确模型：

```text
runtime resolves GITHUB_REF -> abc123
        |
        +---- registry @ abc123
        +---- skill files @ abc123
```

`sourceCommitSha=abc123` 由 MCP runtime 加入响应或 `SourceSnapshot`，而不是写死在 registry 文件中。

---

# 4. 生成范围

第一版建议覆盖两个现有 plugin skill roots：

```text
ai-plugins/common-tools/skills/*
ai-plugins/dev-skills/skills/*
```

每个直接子目录视为一个 skill candidate，并要求存在：

```text
SKILL.md
```

skill id 默认使用目录名，例如：

```text
ai-plugins/dev-skills/skills/nitro-api-development/
```

得到：

```json
{"id":"nitro-api-development"}
```

---

# 5. 推荐 Registry JSON

示例：

```json
{
  "schemaVersion": "1",
  "source": {
    "repository": "ruan-cat/monorepo",
    "roots": [
      "ai-plugins/common-tools/skills",
      "ai-plugins/dev-skills/skills"
    ]
  },
  "skills": [
    {
      "id": "nitro-api-development",
      "plugin": "dev-skills",
      "name": "nitro-api-development",
      "description": "使用 Nitro v3 开发和维护服务端 API。",
      "version": "0.13.5",
      "entry": "ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md",
      "references": [
        "ai-plugins/dev-skills/skills/nitro-api-development/references/api-reference.md"
      ]
    }
  ]
}
```

字段说明：

- `schemaVersion`：registry 格式版本。
- `source.repository`：用于诊断，不代表当前 commit。
- `source.roots`：生成器允许扫描的固定 roots。
- `id`：skill 目录名，必须全局唯一。
- `plugin`：`common-tools` 或 `dev-skills`。
- `name`：来自 `SKILL.md` frontmatter 的 `name`。
- `description`：来自 frontmatter 的 `description`。
- `version`：来自 `metadata.version`。
- `entry`：完整 repo-relative `SKILL.md` 路径。
- `references`：可选，生成器枚举存在的 reference Markdown 文件并排序。

第一版不要求人为维护额外 metadata.yaml。

---

# 6. 确定性生成要求

Registry 必须满足：

```text
same working tree
        =>
same skill-registry.json bytes
```

因此禁止无条件写入：

- `generatedAt`
- 当前时间
- 随机 id
- 本机绝对路径
- 当前 commit SHA

生成规则：

1. roots 顺序固定。
2. skills 按 `id` 字典序排序。
3. references/files 按 repo-relative path 字典序排序。
4. JSON 使用固定缩进。
5. 使用 LF 和最终换行。
6. 不序列化临时字段。

这样 DryRun、CI 和发布脚本可以准确判断 registry 是否 stale。

---

# 7. Frontmatter 读取规则

现有 Skill 的最小来源字段：

```yaml
---
name: release-ai-plugins
description: ...
metadata:
  version: "0.17.4"
---
```

生成器至少解析：

```text
name
description
metadata.version
```

`id` 从目录名派生，`plugin` 从 root 派生，避免要求所有现有 skill 立即迁移到新的 metadata schema。

如果缺失 `name`、`description`、合法 `metadata.version` 或 `SKILL.md`，生成/校验失败。

---

# 8. Registry Builder

推荐把生成逻辑做成独立、可复用脚本，例如：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

它应支持两种模式：

```text
Check / DryRun
Apply
```

Check：

```text
scan skills
 -> build normalized registry in memory
 -> compare ai-plugins/skill-registry.json
 -> stale 则非零退出
```

Apply：

```text
scan skills
 -> validate
 -> deterministic generate
 -> write ai-plugins/skill-registry.json
```

不得调用 Cloudflare API。

---

# 9. 与 release-ai-plugins 的集成

`release-ai-plugins` 已经负责两个 skill roots 的版本发布一致性，因此推荐把 registry 生成纳入其发布契约。

建议顺序：

```text
发现修改 skill
        |
        v
升级 metadata.version
        |
        v
更新 plugin / marketplace / CHANGELOG
        |
        v
生成 ai-plugins/skill-registry.json
        |
        v
最终一致性校验
```

要求：

- `ai-plugins/skill-registry.json` 加入 release 写入白名单。
- DryRun 必须显示 registry 是否会变化。
- Apply 后重新生成并比较，确保 committed registry 与 working tree 一致。
- 新增/删除/重命名 skill 必须体现在 registry。
- Skill `description` 或 `metadata.version` 变化必须体现在 registry。

为避免把 release 主脚本进一步做成不可维护的大文件，推荐独立 generator，由 `release-ai-plugins.ps1` 调用。

---

# 10. 高频修改与非发布提交

仅靠“发布时生成”无法保证所有任意 commit 都拥有最新 registry，因此推荐再提供 CI check：

```text
当 ai-plugins/**/skills/** 或 registry generator 发生变化
        |
        v
run generate-skill-registry in check mode
        |
        v
registry stale -> fail
```

这样：

- 正常 release 由 `release-ai-plugins` 自动更新 registry。
- 手工/特殊修改如果忘记更新 registry，会在 CI 被阻断。

不推荐 GitHub Action 在 push 后自动提交 registry，因为会制造额外 bot commit、延迟和回写权限复杂度。

---

# 11. 与 MCP Tool 映射

## list_skills

读取：

```text
skill-registry.json @ SourceSnapshot.commitSha
```

## search_skills

第一版基于 registry 中的：

- id
- name
- description
- plugin

做关键词匹配。

无需向量数据库。

## load_skill

根据 `entry` 从同一个 commit SHA 读取真实 `SKILL.md`。

如果要加载 reference，也使用同一个 commit SHA。

---

# 12. 可选完整性字段

未来如果需要更强诊断，可在不引入自引用的前提下增加：

```text
entrySha256
```

它由 `SKILL.md` 文件内容计算，与 Git commit SHA 不同，不存在 registry 自引用问题。

第一版不是必需。

---

# 13. 验收规则

- [ ] Registry 覆盖两个 skill roots。
- [ ] skill id 全局唯一。
- [ ] 每个 entry 存在。
- [ ] frontmatter name/description/version 可解析。
- [ ] 输出完全确定性。
- [ ] 无 `generatedAt` 等非确定性字段。
- [ ] 无 registry 自身 commit SHA。
- [ ] `release-ai-plugins` 可调用 generator。
- [ ] CI 可用 check mode 验证 registry 非 stale。
- [ ] MCP 运行时按 exact commit SHA 读取 registry 和 skill。
