# release-ai-plugins

该技能把插件发布的固定文件修改收敛到一个 PowerShell 入口；`skill-registry.json` 的文本解析、
JSON 生成与 canonical 校验则收敛到独立的 Node `.mjs` generator。发布脚本默认只预演，必须显式
`-Apply` 才写文件；registry 不允许人工维护。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-ai-plugins.ps1 `
  -Version 8.3.3 -ChangeType patch -Skill release-ai-plugins `
  -Summary "强化发布流程并增加脚本化校验" -DryRun
```

通过 DryRun 后，把 `-DryRun` 换成 `-Apply`。新增 skill 时先更新对应插件根目录 README，再传入 `-NewSkill <skill-name>`；脚本会阻断缺失 README 的发布。

Registry 可直接用 Node 独立诊断：

```bash
node ./scripts/generate-skill-registry.mjs --check
```

过期时运行：

```bash
node ./scripts/generate-skill-registry.mjs --apply
```

PowerShell 兼容入口 `generate-skill-registry.ps1 -Check/-Apply` 仍保留给 release 主脚本和旧调用方，
但它只负责把参数转发给 Node，不再处理 SKILL.md、JSON、缩进、转义或行尾。

Node generator 只使用内置模块，无需安装额外依赖。它先把输入行尾统一为 LF，再读取既有
frontmatter 子集；最终 canonical 定义固定为 `JSON.stringify(registry, null, 2) + "\n"`，以 UTF-8
写入。这样 JSON 字符串转义、两空格缩进和末尾 LF 都由同一个运行时负责，而不是针对不同
PowerShell serializer 继续维护补丁。

v1 只保存 discovery/search/entry 字段，不枚举 `references/`、`templates/`、`examples/`，也不包含
timestamp 或 commit SHA。

CI 维护入口是 `.github/workflows/ai-plugins-skill-registry-check.yml`。普通 Skill 内容或版本变更会由
path filter 自动触发；CI 在 Ubuntu 与 Windows 上使用仓库最低支持的 Node 版本运行同一 generator，
不安装项目依赖。只有 generator 路径、CLI、扫描 roots、schema、权限或触发范围变化时，才需要同步
修改该 workflow。release 主脚本仍会校验 workflow 保持只读 `-Check` 契约。

主发布脚本仍固定处理六个 `plugin.json`、三个 marketplace、两个插件 `CHANGELOG.md`，集中生成并校验
`skill-registry.json`，并验证版本一致性、JSON 可解析性、skill metadata、README 和 `git diff --check`。
本次迁移不顺手重写这些发布编排逻辑；Node 只接管 Skill Registry 的 canonical ownership。
