# 兼容策略记录（模板）

本模板用于记录已做出的兼容策略选择，便于审计与回滚。

> 默认推荐：**使用 runner**。放弃 runner 的前提条件见 [`references/windows-compatibility.md`](../references/windows-compatibility.md)。

## 选定策略

| 分支                         | 选择    |
| ---------------------------- | ------- |
| Runner（推荐默认）           | 是 / 否 |
| pnpm patch（次选）           | 是 / 否 |
| 无额外层（仅满足严格前提时） | 是 / 否 |

## 选择 runner 时填写

| 项                                          | 说明                              |
| ------------------------------------------- | --------------------------------- |
| runner 脚本路径                             | （如 `scripts/relizy-runner.ts`） |
| `getWorkspacePackages()` 扫描目录           | （如 `apps`，或多目录合并）       |
| 是否覆盖 `relizy.config.ts` 中所有 packages | 是 / 否                           |
| 是否有配套测试                              | 是 / 否，位置：                   |

## 选择 pnpm patch 时填写

| 项                       | 说明                                |
| ------------------------ | ----------------------------------- |
| patch 对应的 relizy 版本 | （精确版本，升级后需重评）          |
| 补丁文件路径             | （如 `patches/relizy@x.y.z.patch`） |
| baseline tag 由谁维护    | （人工流程 / 其他脚本）             |

## 选择无额外层时必须确认

以下全部为「是」方可选无层策略：

- [ ] 开发与 CI 环境均为 Linux/macOS，已验证无 `grep`/`head`/`sed` 报错
- [ ] 所有目标子包已手工确认具备 `@scope/pkg@x.y.z` baseline tag
- [ ] 团队已建立新增子包后及时打 baseline tag 的流程
- [ ] 已成功执行过至少一次 `relizy release --dry-run`

## 理由

（描述选择原因，注意：兼容层**不修改 relizy 的版本语义**，只补齐调用链前置条件。）
