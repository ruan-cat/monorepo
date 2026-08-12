# release-ai-plugins

该技能把插件发布的固定文件修改收敛到一个 PowerShell 入口，并将两个 Skill roots 生成
为 `ai-plugins/skill-registry.json`。脚本默认只预演，必须显式 `-Apply` 才写文件；registry
由独立 generator 生成，不允许人工维护。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-ai-plugins.ps1 `
  -Version 8.3.3 -ChangeType patch -Skill release-ai-plugins `
  -Summary "强化发布流程并增加脚本化校验" -DryRun
```

通过 DryRun 后，把 `-DryRun` 换成 `-Apply`。新增 skill 时先更新对应插件根目录 README，再传入 `-NewSkill <skill-name>`；脚本会阻断缺失 README 的发布。

Registry 可独立诊断：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/generate-skill-registry.ps1 -Check
```

`-Check` 只读并比较 canonical UTF-8/LF 输出；过期时运行同一脚本的 `-Apply`，再把
`skill-registry.json` 与 Skill 变更放在同一 commit。v1 只保存 discovery/search/entry 字段，
不枚举 `references/`、`templates/`、`examples/`，也不包含 timestamp 或 commit SHA。

CI 维护入口是 `.github/workflows/ai-plugins-skill-registry-check.yml`。普通 Skill 内容或版本变更
会由 path filter 自动触发；只有 generator 路径、CLI、扫描 roots、schema、权限或触发范围变化时，
才需要同步修改该 workflow。release 主脚本会校验 workflow 仍为只读 `-Check` 契约。

脚本固定处理六个 `plugin.json`、三个 marketplace、两个插件 `CHANGELOG.md`，集中生成并校验
`skill-registry.json`，并验证版本一致性、JSON 可解析性、skill metadata、README 和 `git diff --check`。
