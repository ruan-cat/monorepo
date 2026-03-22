# 目标仓库清单（可维护）

本文件是 `pr-ruancat-repo` 技能唯一的仓库清单来源。  
后续扩展时，只改本文件，不改 `SKILL.md`。

## 默认批量 PR 仓库

| 序号 | repo                        | 默认目标分支优先级    | 启用 |
| :--: | :-------------------------- | :-------------------- | :--: |
|  1   | `ruan-cat/notes`            | `dev > main > master` |  ✅  |
|  2   | `ruan-cat/monorepo`         | `dev > main > master` |  ✅  |
|  3   | `ruan-cat/11comm`           | `dev > main > master` |  ✅  |
|  4   | `ruan-cat/10wms`            | `dev > main > master` |  ✅  |
|  5   | `ruan-cat/09oa`             | `dev > main > master` |  ✅  |
|  6   | `Nonameboyy/zero-one-mes`   | `dev > main > master` |  ✅  |
|  7   | `ruan-cat/stars-list`       | `dev > main > master` |  ✅  |
|  8   | `ruan-cat/rm-monorepo`      | `dev > main > master` |  ✅  |
|  9   | `nwt-q/001-Smart-Community` | `dev > main > master` |  ✅  |

## 维护约定

1. 新增仓库：直接在表格末尾新增一行，`repo` 必须用 `owner/name` 格式。
2. 临时停用：将“启用”改为 `❌`，不要删除历史条目。
3. 分支策略变更：仅改“默认目标分支优先级”列，保持统一可读性。
4. 用户指定仓库子集时，运行时只处理“用户指定集合 ∩ 启用仓库集合”。
