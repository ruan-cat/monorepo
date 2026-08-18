# 扩展 Replacement Migration

本文件维护 `init-vscode` 已确认的扩展替代关系，以及命中替代关系时必须执行的合并、scope、preflight/postflight 与回滚规则。

核心原则：**replacement mapping 是受证据约束的窄范围迁移规则，不是“看到类似扩展就自动删除旧项”的通用清理器。**

## 当前 mapping

| 旧扩展                  | 新扩展                             | 旧 settings namespace | 新 settings namespace | User Settings 可能需要迁移 | GUI/runtime 验收 | 回滚策略                                                 |
| ----------------------- | ---------------------------------- | --------------------- | --------------------- | -------------------------- | ---------------- | -------------------------------------------------------- |
| `Gruntfuggly.todo-tree` | `FanaticPythoner.better-todo-tree` | `todo-tree.`          | `better-todo-tree.`   | 是                         | 必须             | 首轮可保留旧扩展安装但禁用；验收稳定后由用户决定是否卸载 |

### Todo Tree mapping 的当前依据

- 新扩展是独立维护的 Todo Tree fork，并提供现代 VS Code 兼容方向。
- 新扩展当前 Marketplace ID 为 `FanaticPythoner.better-todo-tree`。
- 上游说明会继续读取 legacy `todo-tree.*` settings 并导入新的 namespace，但这不等于所有自定义配置、keybinding、视觉表现和运行时行为都能无条件视为 100% drop-in。
- replacement 维护者在更新模板前仍应重新核验扩展 ID、上游仓库是否 archived、维护活动、VS Code engine 范围和真实安装渠道，避免把一次正确的 mapping 固化成未来的过时事实。

## recommendations 合并算法

普通情况下：

```text
recommendations = unique(user + template)
unwantedRecommendations = unique(user + template)
```

命中 mapping 时，replacement 规则必须**先于**普通并集执行：

1. 用 JSONC-aware 方式读取 `.vscode/extensions.json` 的活动数组；注释里的字符串不算活动项。
2. 如果旧 ID 在 `recommendations` 中，删除该旧 ID。
3. 确保新 ID 存在于 `recommendations`，并去重。
4. 确保旧 ID 存在于 `unwantedRecommendations`，并去重。
5. 保留用户所有其他 recommendations/unwanted 项和其他字段。
6. 最后才执行普通模板补齐；不得让普通并集把旧 ID 重新加入 `recommendations`。
7. 反馈中使用 `replacement migration` 描述本次行为，不要只写“新增扩展推荐”。

目标形态示例：

```jsonc
{
	"recommendations": ["FanaticPythoner.better-todo-tree"],
	"unwantedRecommendations": ["Gruntfuggly.todo-tree"],
}
```

### 用户明确要求保留旧扩展

用户的显式决定优先于自动 mapping：

- 不自动从该项目 `recommendations` 删除旧 ID；
- 不自动把旧 ID 加入该项目的 `unwantedRecommendations`；
- 可以同时补充新 ID，但必须报告双推荐/兼容风险；
- 最终状态标记为“用户选择保留旧扩展，自动 replacement 未完成”，不能宣称迁移成功。

未知扩展、同类扩展、名称相似扩展都不能凭推测创建 mapping 或自动删除。

## JSONC 安全迁移

扩展推荐、Workspace Settings、User Settings 和 keybindings 可能包含注释。判断活动配置时必须满足：

- `// "参考资料"` 之类注释字符串不算活动数组元素；
- `// "todo-tree.xxx": ...` 不算活动旧键；
- 字符串值内部出现 `//` 不能被错误截断；
- 中文标签/键值必须原样保存；
- 不得为了方便解析而删除注释、恢复被注释禁用的项或重写整个文件造成无关格式漂移。

优先使用项目已有的 JSONC parser / CST 编辑能力或等价的注释感知工具。没有可安全保留注释的结构化编辑能力时，应采用最小文本补丁并在写回后使用 JSONC parser/Prettier 验证，不能回退到“正则提取全部字符串就是活动配置”。

## Scope 与授权

### 工作区 `.vscode/*`

属于 `init-vscode` 正常写集。命中 mapping 时，可以按本文件规则更新工作区的 `extensions.json` 和必要 Workspace Settings。

### VS Code User Settings / User keybindings

默认只检测并报告。只有 replacement 的完整迁移确实需要用户级修改且用户明确授权后才执行：

1. 通过当前平台/VS Code 环境定位真实 User Settings/keybindings 文件；禁止在 skill 中写死某台机器绝对路径。
2. 明确告诉用户这是用户级 scope。
3. 在修改前创建可识别的时间戳备份。
4. 使用 JSONC-aware 方式只迁移活动 legacy 键；保留注释禁用项和无关设置。
5. 不顺手格式化整个用户配置。
6. 完成后报告备份位置、迁移的 namespace/键和未迁移项。

### 全局扩展状态

安装、启用、禁用和卸载是独立运行时动作：

- `unwantedRecommendations` 不能代替禁用/卸载；
- 不得因为工作区 mapping 自动卸载旧扩展；
- 首轮迁移可在授权后保留旧扩展安装但禁用，以支持快速回滚；
- `code --list-extensions` 只证明“已安装”，不能单独证明“已禁用”。

## Replacement preflight

命中 mapping 后，在改动前尽可能收集以下证据：

- VS Code 版本；
- 旧/新扩展安装状态及版本；
- 工作区 legacy/current settings namespace；
- 需要时，用户级 legacy/current namespace（默认只检测，写入需授权）；
- legacy keybindings/commands；
- 显式 executable/path override；
- 是否有可回滚备份/基线；
- 当前 mapping 的专用风险 gate。

### Todo Tree 专用风险 gate

| 场景                                            | 处理                                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `subTagRegex` 无效 JavaScript RegExp            | **BLOCKER**：先修复正则，再继续迁移                                                  |
| `customHighlight` 存在                          | **WARN**：保留人工视觉验收，不能静态宣称等价                                         |
| multiline regex                                 | **WARN**：要求 runtime 兼容验收                                                      |
| tracked UTF-16 文件                             | **WARN**：要求 workspace scan 验收                                                   |
| 显式 ripgrep override 指向 VS Code 私有内部目录 | **WARN/FAIL**：禁止复制旧路径为长期配置；改回扩展自身 resolver/packaged ripgrep 方向 |
| legacy keybinding / command                     | 核验新命令或兼容 alias；无法静态证明时要求 GUI 人工测试                              |

私有内部路径包括但不限于 `resources/app/node_modules*`、`@vscode/ripgrep*` 一类 VS Code 实现目录。这些路径不是稳定 API，不能成为长期配置。

## Postflight 三层证据

### A. 静态配置

必须确认：

- JSONC 可解析；
- recommendations/unwanted 与 mapping 一致；
- settings namespace 符合迁移计划；
- 注释禁用项没有被误恢复；
- 没有陈旧 VS Code 私有内部二进制绝对路径；
- 需要保持的标签/配置活动值和顺序符合基线。

### B. CLI / Extension Host

尽可能确认：

- 新扩展真实安装及版本；
- 旧扩展状态符合回滚计划；
- fresh 日志中没有 activation failure、`command not found`、executable/ripgrep missing 等回归。

没有 fresh runtime 日志时只能 WARN/pending，不能因为“没看到错误”就写 PASS。

### C. GUI / runtime

按扩展能力执行适用项：

- Reload Window；
- 目标视图出现；
- Refresh/重建；
- 跳转；
- Filter / Group / Expand/Collapse；
- 高亮/视觉差异；
- fresh restart；
- 大仓库 CPU/内存/扫描稳定性（任务涉及性能时）。

只有 A + B + C 的适用项都满足时，才能声明“当前环境 replacement 验证通过”。仅完成 A 或 A+B 时，应明确报告：

```text
静态/CLI 已通过，GUI runtime acceptance pending
```

## 回滚与收口

- User Settings 有写入时，以迁移前备份作为回滚真值。
- 首轮保留旧扩展安装是一个验收周期策略，不是永久双安装。
- 稳定验收后由用户决定是否卸载旧扩展。
- 如果新扩展 runtime 验收失败，优先恢复备份/旧启用状态并保留本次失败证据，不要通过复制 VS Code 私有二进制、硬编码旧 rg 路径等方式维持脆弱兼容。
- 任何未完成的 GUI/性能验收都必须显式保留 pending 状态。
