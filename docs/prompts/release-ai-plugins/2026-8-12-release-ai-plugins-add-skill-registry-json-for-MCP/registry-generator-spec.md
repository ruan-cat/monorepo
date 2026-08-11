# `generate-skill-registry.ps1` 实施规格

## 1. 目标

新增独立脚本：

```text
ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1
```

该脚本是 `ai-plugins/skill-registry.json` 的**唯一生成入口**。

职责：

```text
scan
→ parse
→ validate
→ normalize
→ sort
→ serialize
→ compare/write
```

不负责 release orchestration。

---

# 2. Runtime 约束

必须：

- Windows PowerShell 5.1 兼容。
- PowerShell 7 可运行。
- 不依赖第三方 PowerShell module。
- 不要求 Node/Python。
- 从脚本路径向上自动定位仓库根。

与当前 `release-ai-plugins.ps1` 的工具链保持一致。

---

# 3. CLI 设计

推荐：

```powershell
generate-skill-registry.ps1 -Check
generate-skill-registry.ps1 -Apply
```

行为：

## `-Check`

- 生成 expected registry 到内存或临时字符串。
- 读取当前 `ai-plugins/skill-registry.json`。
- byte/normalized text 比较。
- 一致 -> exit 0。
- stale/missing/invalid -> exit non-zero。
- 不写文件。

## `-Apply`

- 生成 expected registry。
- 写入目标文件。
- 再执行等价 Check。
- 成功 -> exit 0。

`-Check` 与 `-Apply` 互斥。

若未指定模式，推荐默认 `-Check`，符合仓库现有“默认不写”的安全哲学。

---

# 4. 固定扫描范围

第一版固定扫描：

```text
ai-plugins/common-tools/skills/*/SKILL.md
ai-plugins/dev-skills/skills/*/SKILL.md
```

只认直接子目录作为一个 Skill。

禁止递归把：

```text
references/
templates/
examples/
```

中的 Markdown 错认成独立 Skill。

---

# 5. Skill ID

第一版：

```text
id = skill directory name
```

目录名必须满足：

```regex
^[a-z0-9][a-z0-9-]*$
```

如果两个 plugin roots 出现相同 id，generator 必须失败，不允许通过 `plugin/id` 自动消歧。

原因：云 MCP tool 的 `skillId` 应保持全局唯一、稳定、简洁。

---

# 6. Frontmatter 解析

必须从 `SKILL.md` 顶部 YAML frontmatter 获取：

```text
name
description
metadata.version
```

第一版不要为了完整 YAML 支持引入第三方 parser。

可以沿用当前 release 脚本的受约束 frontmatter 解析策略，但 generator 的 parser 必须有专门测试。

关键要求：

- 必须识别 `---` 开闭边界。
- `name` 必填。
- `description` 必填。
- `metadata.version` 必填。
- version 必须为 `MAJOR.MINOR.PATCH`。
- 不因为正文中出现 `version:` 误解析。

若仓库未来允许复杂 YAML 结构，届时再评估 parser 升级，不要在本次改造中提前引入重量级依赖。

---

# 7. Description 规范化

Frontmatter 中 `description` 可能使用：

```yaml
description: >-
  line 1
  line 2
```

或者单行。

Registry 应输出一个标准 JSON string。

规范化要求：

- folded YAML description 语义上折叠为空格。
- 去除首尾无意义空白。
- 不复制 YAML 标记。
- 不保留平台相关换行差异。

同一 frontmatter 在 Windows/Linux 生成结果一致。

---

# 8. Plugin 字段

根据 root 派生：

```text
common-tools
或
dev-skills
```

禁止从 marketplace/plugin.json 反向推断。

Root 本身就是最稳定的来源。

---

# 9. Entry Path

固定为 repo-relative POSIX path：

```text
ai-plugins/<plugin>/skills/<id>/SKILL.md
```

即使 generator 在 Windows 上运行，也必须输出 `/`，不能输出 `\`。

禁止绝对路径。

---

# 10. References 枚举

第一版推荐枚举：

```text
<skill>/references/**/*
```

仅记录普通文件的 repo-relative path。

规则：

- 递归。
- path 使用 `/`。
- 排序稳定。
- 不读取内容进入 registry。
- references 目录不存在时输出空数组。

是否同时暴露 templates/examples 应由 `skill-registry-contract.md` 决定；不要自行扩展。

---

# 11. 不生成动态字段

严禁：

```text
generatedAt
updatedAt
hostname
username
absolutePath
branch HEAD
current commit SHA
random UUID
```

原因：这些字段会破坏 deterministic output，或者制造 registry 自引用/环境耦合。

---

# 12. 排序规则

固定：

1. `skills` 按 `id` ordinal/ASCII 升序。
2. `references` 按完整 repo-relative path 升序。
3. JSON object 属性使用固定手写顺序。

不要依赖 PowerShell hashtable 默认遍历顺序作为序列化契约。

建议使用 `[ordered]` hashtable 或显式对象构造。

---

# 13. JSON 序列化

必须明确：

- UTF-8。
- 无 BOM（如仓库约定允许 BOM，应以现有 JSON 风格为准；优先无 BOM）。
- 2 空格 indentation。
- LF line ending。
- 文件末尾一个 newline。
- 不输出多余 trailing whitespace。

PowerShell 5.1 的编码默认行为容易产生 UTF-16/BOM，因此不要直接依赖未经控制的 `Out-File` 默认编码。

实现 Agent 必须显式控制写入编码。

---

# 14. Deterministic Test

必须有测试证明：

```text
run generator
hash output = X
run generator again
hash output = X
```

并至少在逻辑上覆盖 CRLF/LF 输入差异不改变 registry semantic output。

---

# 15. Check 比较策略

推荐比较最终规范化的完整文本 bytes/string，而不是只 parse JSON 后比较对象。

原因：

CI 还需要约束：

- 排序。
- indentation。
- final newline。
- canonical output。

因此：

```text
expected canonical text == committed text
```

才是 PASS。

---

# 16. Missing Registry

`-Check` 时若：

```text
ai-plugins/skill-registry.json
```

不存在，应失败并提示：

```text
Run generate-skill-registry.ps1 -Apply
```

`-Apply` 则允许首次创建。

---

# 17. Path Validation

生成前/后必须保证：

- 每个 entry path 存在。
- 每个 reference path 存在且位于对应 Skill 目录内。
- 不允许 `..` path escape。
- 不跟随生成结果引用仓库外文件。

---

# 18. Duplicate / Invalid Skill

以下必须阻断：

- duplicate id。
- invalid directory name。
- missing SKILL.md。
- missing frontmatter。
- missing name。
- missing description。
- missing metadata.version。
- invalid semver。
- entry/reference path 逃逸。

不要“尽量生成部分 registry”。发布索引必须是完整闭包。

---

# 19. 删除与重命名

Generator 永远从当前 tree 全量重建：

```text
old registry
不作为输入
```

所以：

- 删除 Skill -> entry 自动消失。
- 重命名 -> old id 消失/new id 出现。
- 删除 reference -> path 自动消失。

禁止对旧 JSON 做增量 patch。

---

# 20. 日志输出

建议输出：

```text
[INFO] scanning common-tools skills: N
[INFO] scanning dev-skills skills: M
[INFO] total skills: X
[OK] registry is current
```

Apply：

```text
[OK] wrote ai-plugins/skill-registry.json
```

Stale：

```text
[ERROR] ai-plugins/skill-registry.json is stale
Run: ...generate-skill-registry.ps1 -Apply
```

不要把完整 SKILL.md 正文打印到日志。

---

# 21. 与主 release 脚本的调用契约

Generator 应可以被：

```text
release-ai-plugins.ps1
CI
developer/manual debugging
```

三个入口复用。

不要写只在主脚本进程中才能工作的隐式 global state。

主 release Apply 调用：

```powershell
& $GeneratorPath -Apply
if ($LASTEXITCODE -ne 0) { Fail ... }

& $GeneratorPath -Check
if ($LASTEXITCODE -ne 0) { Fail ... }
```

实际错误处理方式应与现有脚本风格统一。

---

# 22. Definition of Done

- [ ] PowerShell 5.1 / 7 兼容设计。
- [ ] Check 默认只读。
- [ ] Apply 唯一目标是 registry。
- [ ] 两个 roots 全量扫描。
- [ ] duplicate id 阻断。
- [ ] frontmatter 三字段正确解析。
- [ ] POSIX repo-relative paths。
- [ ] deterministic 排序和序列化。
- [ ] UTF-8/LF/final newline 明确。
- [ ] 无动态字段。
- [ ] 删除/重命名通过全量重建自然处理。
- [ ] CI 可独立调用。
- [ ] 主 release 可安全 orchestration。
