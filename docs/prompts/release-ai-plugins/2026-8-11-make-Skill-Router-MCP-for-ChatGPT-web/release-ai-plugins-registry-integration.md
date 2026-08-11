# `release-ai-plugins` 与 Skill Registry 集成设计

## 1. 决策

为了让 Cloud Skill Router MCP 在高频更新 skills 时仍能快速发现技能，同时不引入 KV/R2 同步链路，推荐新增仓库级生成文件：

```text
ai-plugins/skill-registry.json
```

并把它的**生成与一致性校验**纳入现有 `release-ai-plugins` 工作流。

但生成器必须是独立可调用脚本；`release-ai-plugins.ps1` 只是它的主要调用方之一。

原因：

- release 流程已经扫描 `common-tools` 和 `dev-skills` 两个 skill roots。
- release 流程已经负责 `metadata.version`、manifest、marketplace、CHANGELOG 与 README 一致性。
- registry 同样属于“发布后机器可发现状态”的一致性产物。
- CI 也需要独立调用 generator 的 check mode，而不能为了校验 registry 运行完整版本发布。

---

# 2. 不是“把 commit SHA 写进 registry”

`skill-registry.json` 本身被提交进 Git，因此它天然被 Git commit 版本化。

不要在文件中写：

```json
{"sourceCommitSha":"<当前 commit SHA>"}
```

这会产生自引用：registry 内容参与 commit hash，commit hash 又被写回 registry。

正确语义是：

```text
commit abc123
  |
  +-- ai-plugins/skill-registry.json
  +-- ai-plugins/.../SKILL.md
```

Cloud MCP 运行时先：

```text
GITHUB_REF -> abc123
```

然后读取：

```text
skill-registry.json @ abc123
SKILL.md @ abc123
```

因此 `abc123` 是 registry snapshot 的外部地址，不是 registry 内部字段。

---

# 3. Generator 位置

推荐：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

理由：

- 现有发布工具链已经以 PowerShell 5.1 兼容脚本为唯一写入入口。
- 不新增第三方 runtime dependency。
- 可以被 `release-ai-plugins.ps1`、CI、开发者手动调用。

生成器应与发布脚本职责分离，避免把完整扫描/JSON 规范化逻辑继续堆进单一脚本。

---

# 4. Generator 输入

固定扫描：

```text
ai-plugins/common-tools/skills/*/SKILL.md
ai-plugins/dev-skills/skills/*/SKILL.md
```

从每个 `SKILL.md` 读取：

```text
name
description
metadata.version
```

派生：

```text
id = skill directory name
plugin = common-tools | dev-skills
entry = repo-relative SKILL.md path
references = repo-relative reference paths, sorted
```

第一版不要求额外维护 `metadata.yaml`。

---

# 5. Generator 输出

目标文件：

```text
ai-plugins/skill-registry.json
```

输出必须确定性：

- roots 固定。
- skills 按 id 排序。
- references 按 path 排序。
- 固定 JSON indentation。
- LF + final newline。
- 不写 timestamp。
- 不写本机绝对路径。
- 不写当前 commit SHA。

同一 working tree 多次生成必须 byte-identical。

---

# 6. Check / Apply 模式

## Check / DryRun

```text
scan current working tree
        |
build expected registry in memory
        |
compare committed ai-plugins/skill-registry.json
        |
match -> PASS
stale -> non-zero exit
```

不得写文件。

## Apply

```text
scan
validate
normalize
write ai-plugins/skill-registry.json
```

写入完成后再次执行 check。

---

# 7. 接入 `release-ai-plugins.ps1`

现有 release skill 明确声明固定写入白名单，因此增加 registry 必须显式修改契约。

建议新增：

```text
ai-plugins/skill-registry.json
```

到允许写入白名单。

推荐执行顺序：

```text
1. discover changed skills
2. bump changed skill metadata.version
3. update plugin / marketplace versions
4. update CHANGELOG / README validations
5. invoke generate-skill-registry.ps1
6. validate registry
7. git diff --check
8. final release validation
```

关键点：registry 必须在 Skill metadata.version 已完成更新后生成，否则会把旧 version 写入 registry。

---

# 8. 哪些变化必须反映到 Registry

必须变化：

- 新增 skill。
- 删除 skill。
- 重命名 skill。
- skill `name` 变化。
- `description` 变化。
- `metadata.version` 变化。
- reference 文件列表变化（如果 schema 暴露 references）。

只修改 `SKILL.md` body 时，如果 release 流程按照现有规则升级了该 Skill version，registry 会通过 version 变化反映该发布。

即使 registry 没有复制完整正文，Cloud MCP 仍从同一 exact commit 读取正文，因此正文不会因为 registry 未存 content 而 stale。

---

# 9. 删除 / 重命名注意事项

Generator 必须扫描“当前 working tree 的实际目录”，而不是只根据 changed-skill 参数拼 registry。

因此：

```text
skill 删除 -> 下一次生成自动从 registry 消失
skill 重命名 -> old id 消失 + new id 出现
```

`release-ai-plugins.ps1` 当前的版本升级参数模型如果不能完整表达删除场景，应单独增强 release 参数/校验；不要为了迁就旧参数模型让 generator 保留已不存在的 skill。

---

# 10. CI Gate

推荐在任何涉及以下路径的 PR 中执行 registry check：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
ai-plugins/skill-registry.json
```

CI 只验证：

```text
expected registry == committed registry
```

stale 即 fail。

不推荐 push 后由 GitHub Action 自动 commit registry，因为这会引入：

- bot commit。
- 写权限。
- 二次 workflow。
- 更新可见性延迟。
- 更复杂的 PR 历史。

---

# 11. 与 Cloud MCP 的边界

Release/CI 负责：

```text
Skill tree -> deterministic registry file
```

Cloud MCP 负责：

```text
GITHUB_REF -> exact commit SHA
             |
             +-- registry @ SHA
             +-- skill files @ SHA
```

双方之间没有：

```text
KV publish
R2 upload
registry webhook
Cloudflare write credential
```

这使 Skill 发布与 Worker 部署解耦。

---

# 12. 推荐落地阶段

## 本规格 PR

只冻结：

- registry schema。
- generator contract。
- release integration contract。
- CI stale-check contract。

## 后续实现 PR

实际修改：

```text
release-ai-plugins/SKILL.md
release-ai-plugins/scripts/release-ai-plugins.ps1
新增 generate-skill-registry.ps1
新增 ai-plugins/skill-registry.json
新增/更新 CI check
```

这样保持当前 PR 仍然是生产实现规格包，不把实现代码混入设计冻结阶段。

---

# 13. Definition of Done

- [ ] generator 独立可调用。
- [ ] Check/Apply 模式完整。
- [ ] 输出 deterministic。
- [ ] registry 不包含自引用 commit SHA。
- [ ] release 主脚本在 version bump 后调用 generator。
- [ ] registry 加入 release 写入白名单。
- [ ] CI 能检测 stale registry。
- [ ] Cloud MCP 能按 exact commit SHA 读取 registry + Skill。
- [ ] 无 KV/R2 发布依赖。
