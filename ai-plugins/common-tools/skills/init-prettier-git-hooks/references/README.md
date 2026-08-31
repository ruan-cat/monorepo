# init-prettier-git-hooks v4.0 引用索引

本目录是技能的长期知识保留层。`SKILL.md` 只给出当前执行契约；这里保存导致契约形成的错误、边界和验证方法。读取时以状态为准：

- **现行**：当前必须执行的规则。
- **已废弃**：曾被采用但已被完整证据推翻；只用于防止重犯。
- **背景**：仍有参考价值，但不能替代现行规则。

## 阅读顺序

1. [version-matrix.md](version-matrix.md)：先确认为什么必须精确锁定 `1.0.1`。
2. [runtime-loading-model.md](runtime-loading-model.md)：再区分普通 CLI、experimental CLI 与 VSCode。
3. [verification-playbook.md](verification-playbook.md)：按真实输出而不是配置外观验收。
4. [pnpm-resolution.md](pnpm-resolution.md)：仅在依赖解析失败时处理严格隔离。
5. [crlf-and-hook-incidents.md](crlf-and-hook-incidents.md)：将插件故障与 LF、worker、Hook 风险分流。
6. [decision-evolution.md](decision-evolution.md)：查看完整错误历史和决策纠偏。
7. [pr-workflow.md](pr-workflow.md)：GitHub PR 云端初始化、差异格式化和安全写回边界。

## 从 v2 迁移的知识

| v2 内容                                          | 保留位置                                            | v3 状态                  |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------ |
| 对象插件是唯一安全写法                           | `decision-evolution.md`、`runtime-loading-model.md` | 已废弃                   |
| 仅 Markdown override 对象可兼容 experimental CLI | `decision-evolution.md`                             | 已废弃                   |
| `prettier-plugin-lint-md@1.0.1`                  | `version-matrix.md`                                 | 现行，但新增三层版本核验 |
| experimental CLI 使用 `--no-parallel`            | `crlf-and-hook-incidents.md`                        | 现行，并补齐 format 命令 |
| 配置所有权和用户改动保护                         | `SKILL.md`                                          | 现行                     |
| lint-md 顶层声明前的完整历史 JSDoc               | `templates/prettier.config.mjs`                     | 现行，受保护知识块       |
| LF 三层治理与 renormalize 风险                   | `crlf-and-hook-incidents.md`                        | 现行                     |
| Hook 安装和 lint-staged 副作用需授权             | `crlf-and-hook-incidents.md`                        | 现行                     |
| PR 云端格式化与通用 Node/pnpm 初始化             | `pr-workflow.md`                                    | 现行，v4.0 无条件安装    |

引用文件只包含可对外复用的技术事实，不记录本机路径、内部报告位置、内部测试位置或私有记忆编号。
