# release-ai-plugins

该技能把插件发布的固定文件修改收敛到一个 PowerShell 入口。脚本默认只预演，必须显式 `-Apply` 才写文件。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/release-ai-plugins.ps1 `
  -Version 8.3.3 -ChangeType patch -Skill release-ai-plugins `
  -Summary "强化发布流程并增加脚本化校验" -DryRun
```

通过 DryRun 后，把 `-DryRun` 换成 `-Apply`。新增 skill 时先更新对应插件根目录 README，再传入 `-NewSkill <skill-name>`；脚本会阻断缺失 README 的发布。

脚本固定处理六个 `plugin.json`、三个 marketplace、两个插件 `CHANGELOG.md`，并验证版本一致性、JSON 可解析性、skill metadata、README 和 `git diff --check`。
