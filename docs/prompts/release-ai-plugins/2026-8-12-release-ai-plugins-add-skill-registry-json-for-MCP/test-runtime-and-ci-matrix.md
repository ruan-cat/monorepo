# `release-ai-plugins` Registry：测试 Runtime 与 CI Matrix

## 1. 文档目的

`release-ai-plugins` 的核心实现语言是 PowerShell，而 `Skill-Router-MCP` 的 runtime/consumer 是 TypeScript + Cloudflare Worker。

因此测试不能为了“统一工具”而强行全部放进 Vitest。

正确边界：

```text
release/generator correctness
  -> PowerShell runtime tests

registry consumer/runtime correctness
  -> Vitest / workerd / Worker integration
```

二者通过同一个 `skill-registry.json` contract 衔接。

---

# 2. 为什么 Generator 不以 Vitest 为主测试 runner

Generator 的关键风险本身属于 PowerShell/runtime：

- Windows PowerShell 5.1 编码行为。
- PowerShell 7 行为。
- UTF-8/BOM/LF 输出。
- path separator。
- exit code。
- `-Check` / `-Apply`。
- working tree 写入边界。

如果只从 Node `spawn()` 一次脚本并断言 JSON 内容，会漏掉真正的兼容风险。

因此 generator 必须在其真实 PowerShell runtimes 上直接验收。

---

# 3. PowerShell Runtime Matrix

最低要求：

## Windows PowerShell 5.1

环境：

```text
windows-latest
powershell.exe
```

验证：

- generator 可执行。
- UTF-8 输出不是意外 UTF-16。
- Check/Apply exit code。
- Windows path -> registry POSIX path。
- release 主脚本调用 generator 正常。

## PowerShell 7

至少一个 CI 环境：

```text
ubuntu-latest + pwsh
```

也可以再增加 Windows `pwsh`，但第一版不必为了矩阵数量而过度扩展。

验证：

- 相同 fixture 与 PS5.1 生成 byte-identical registry。
- Check/Apply 行为相同。
- LF/encoding 一致。

---

# 4. Cross-runtime Determinism Gate

相同 fixture tree：

```text
Windows PowerShell 5.1 -> registry A
PowerShell 7          -> registry B
```

必须：

```text
bytes(A) == bytes(B)
```

这比单纯在一个 OS 连续执行两次更强。

如果存在 BOM/line-ending 差异，应视为 generator bug，而不是允许不同平台生成不同 canonical registry。

---

# 5. Generator Fixture Suite

测试工作树 fixture 至少包括：

- common-tools + dev-skills。
- 中文 description。
- folded description。
- 多个 Skill 排序。
- duplicate id。
- missing metadata.version。
- invalid version。
- add/delete/rename。
- 深层 reference/template/example 文件变化。

注意 Registry v1 不枚举 deep files，因此深层文件变化测试用于证明不会产生第二套 deep index。

---

# 6. Release Integration Matrix

不需要在每个 OS 上跑完整 release 所有 smoke。

第一版建议：

## Windows PS5.1

作为兼容性主门禁：

```text
release DryRun
release Apply fixture
registry Apply
registry final Check
git diff --check
```

## pwsh 7

至少验证：

```text
generator Apply/Check
release DryRun
关键 orchestration path
```

如果后续发现 release script 的完整行为在 pwsh7 有独立风险，再扩大 matrix。

---

# 7. Vitest Consumer Contract

云 MCP package 的 Vitest tests 不负责重新测试 PowerShell 实现细节。

它们读取 canonical registry fixture，验证：

```text
schemaVersion
id/plugin/name/description/version/entry
search behavior
entry resolution
exact-commit load behavior
```

可以有一条跨子系统 contract test：

```text
registry generator output fixture
  -> MCP registry validator
  -> PASS
```

但不要在每个 Vitest unit case 中启动 PowerShell 子进程。

---

# 8. CI Job 建议

概念上拆成：

```text
registry-generator-ps51
registry-generator-pwsh7
skill-router-unit
skill-router-worker-runtime
skill-router-production-integration
```

这样失败归因清楚。

不要做一个：

```text
all-tests
```

跑几十分钟后只返回一个模糊失败。

---

# 9. PR Path Scope

Release/Registry jobs 在以下变化时运行：

```text
ai-plugins/common-tools/skills/**
ai-plugins/dev-skills/skills/**
ai-plugins/skill-registry.json
release-ai-plugins/**
相关 registry prompt/contract（如果 CI 需要）
```

Cloud MCP tests 在 MCP package/runtime 实现路径变化时运行。

如果 registry schema/fixture 变化，也应触发 consumer contract tests。

具体 paths 在实际实现目录冻结后配置。

---

# 10. 不需要真实 Secrets

Generator/release tests：

```text
不需要 GitHub Token
不需要 Cloudflare Token
```

Vitest local consumer tests：

```text
使用 fake GitHub transport/token
```

只有 Cloudflare preview/staging smoke 才使用真实但最小权限的 GitHub read Secret。

---

# 11. Failure Artifact

CI 失败时可以保存：

- expected registry。
- actual registry。
- normalized textual diff。
- generator stdout/stderr。
- PowerShell version。

不得保存 Secret。

对 encoding failure，最好额外输出：

```text
BOM presence
byte length
line-ending diagnosis
```

方便排查 PS5.1 问题。

---

# 12. 不过度设计原则

当前不需要：

- Docker matrix 只为了 PowerShell。
- 多个 Windows Server 版本。
- 每个 Node 版本矩阵。
- 每个 Cloudflare compatibility_date 历史矩阵。
- 每次 PR 真实部署 production Worker。

重点是两个真实 PowerShell runtime + 三层 MCP tests。

---

# 13. Definition of Done

- [ ] PS5.1 generator tests。
- [ ] pwsh7 generator tests。
- [ ] cross-runtime byte determinism。
- [ ] release DryRun/Apply integration 有真实 runtime 验证。
- [ ] Vitest 只负责 registry consumer/runtime contract。
- [ ] 不在普通 Vitest unit 中反复 spawn PowerShell。
- [ ] CI jobs 分层、失败可归因。
- [ ] 普通测试不需要真实 GitHub/Cloudflare Secret。
