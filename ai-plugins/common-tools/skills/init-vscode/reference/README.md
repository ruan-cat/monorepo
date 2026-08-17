# init-vscode reference 索引

本目录保存 `init-vscode` 安装后仍然需要的**当前、可执行参考规则**。这些文件随 skill 一起分发，正常执行不依赖源 monorepo 的开发期报告、测试路径或本机绝对路径。

## 当前参考

| 文件 | 主题 | 何时读取 | 当前状态 | 自动化覆盖 |
| --- | --- | --- | --- | --- |
| `extension-replacement-migrations.md` | 扩展 replacement mapping、scope、preflight/postflight、回滚 | 扩展推荐发生替换，或目标项目命中已知旧扩展 ID/settings/command 时 | 当前有效 | 由模板 JSONC/PR diff 与仓库 CI 做静态覆盖；runtime 仍按文档分层验收 |
| `2026-08-16-todo-tree-ripgrep-migration.md` | Todo Tree 激活失败与 ripgrep 私有路径事故的可复用经验 | Todo Tree/Better Todo Tree 迁移、`command not found`、ripgrep 路径或运行时验收问题 | 当前有效 | 规则型参考；GUI/runtime 项不能由静态 CI 代替 |

## 加载边界

1. `SKILL.md` 是执行入口；普通 VS Code 初始化不需要无条件加载所有 reference。
2. 命中 extension replacement 时，必须先读 `extension-replacement-migrations.md`。
3. Todo Tree -> Better Todo Tree、`command not found`、ripgrep executable/path、legacy settings/keybindings 等场景，再读 `2026-08-16-todo-tree-ripgrep-migration.md`。
4. reference 只保存当前规则，不保存开发期全文快照；如果未来需要历史归档，应使用明确的 archive 层并从正常执行导航中隔离。
5. 如果 reference 与 `SKILL.md` 冲突，以更新后的 `SKILL.md` + 当前 reference 的更具体规则为准，并在维护时消除冲突。

## 对外分发约束

- 路径示例以安装后的 skill 目录和目标项目相对路径为基准。
- 不写开发机盘符、用户目录绝对路径或源仓库 `docs/plan` / 内部测试文件路径。
- 不要求用户回源读取事故报告才能完成正常迁移。
- 任何用户级绝对路径只能在一次真实执行中通过当前平台定位，并作为该次反馈/备份证据，不写成长期规则。
- 静态配置、CLI/Extension Host、GUI/runtime 三层证据必须区分；没有 GUI 证据时不能把 reference 中的历史结论当作当前环境 PASS。
