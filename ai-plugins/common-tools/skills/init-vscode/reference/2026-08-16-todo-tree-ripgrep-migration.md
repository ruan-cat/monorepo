# Todo Tree ripgrep 迁移经验

## 现象

旧 Todo Tree 可能在 VS Code UI 中仍然保留 Activity Bar / Tree View 等静态贡献入口，但扩展激活过程已经失败。此时用户点击 Refresh 等入口，会看到类似：

```text
command 'todo-tree.refresh' not found
```

这个下游症状不应直接解释成“命令配置丢了”。需要继续检查 Extension Host 激活链路和外部 executable 解析。

## 根因模式

已确认的一类根因是：扩展依赖 VS Code 私有内部 ripgrep 布局，而 VS Code 升级后内部目录发生变化；旧扩展继续查找历史路径，导致 ripgrep 解析失败，activation 提前退出，后续命令没有完成运行时注册。

可复用结论：

```text
静态 UI contribution 仍存在
!= extension activation 成功
!= command 已完成运行时注册
```

因此遇到 `command not found` 时，应先找 fresh Extension Host / runtime 日志中的 activation dependency failure，而不是仅检查 package.json 的 commands/contributes。

## 为什么不能修成“复制一个 rg.exe”

`resources/app/node_modules*`、`@vscode/ripgrep*` 等目录属于 VS Code 私有实现细节，不是稳定 API。

禁止把以下做法当长期修复：

- 把新版 VS Code 自带的 `rg.exe` 复制到旧扩展预期的历史目录；
- 在长期设置中硬编码 VS Code 私有内部 ripgrep 绝对路径；
- 每次 VS Code 升级后继续维护一层内部目录兼容垫片。

正确方向是使用不依赖 VS Code 私有布局的扩展实现。对于 Better Todo Tree，没有显式 override 时应优先让扩展自身 resolver / packaged ripgrep 负责定位。

## Replacement 方向

当前 `init-vscode` 维护：

```text
Gruntfuggly.todo-tree -> FanaticPythoner.better-todo-tree
```

这是一条**当前高兼容替代方向**，不是“任何配置都 100% 完美 drop-in”的承诺。

迁移需要同时考虑：

- 工作区 `recommendations` / `unwantedRecommendations`；
- legacy `todo-tree.*` 与 current `better-todo-tree.*` settings namespace；
- User Settings 的独立授权与备份；
- legacy keybindings / commands；
- ripgrep override；
- visual/runtime 差异；
- 回滚策略。

完整算法与 gate 见 `extension-replacement-migrations.md`。

## JSONC 的关键教训

注释文本不是活动配置。例如：

```jsonc
{
	"better-todo-tree.general.tags": [
		"TODO",
		// "参考资料",
		"待测试",
	],
}
```

活动标签只有 `TODO` 和 `待测试`。如果探针只是用正则提取引号字符串，就会把被注释的 `参考资料` 错算成活动配置，并可能在迁移中把它“复活”。

未来迁移必须：

- JSONC-aware 地区分活动键和值与注释；
- 不把 `// "todo-tree.xxx": ...` 当 legacy 活动键；
- 不把字符串内部的 `//` 当注释起点；
- 保留中文值与原有注释；
- 避免重写整个 User Settings 导致无关格式漂移。

## `unwantedRecommendations` 的边界

把 `Gruntfuggly.todo-tree` 写入工作区 `unwantedRecommendations`，只表示“这个工作区不再希望推荐它”。它不能证明：

- 扩展已卸载；
- 扩展已禁用；
- Extension Host 已重新加载；
- Better Todo Tree 已成功激活；
- Refresh/跳转/过滤等命令已经实际工作。

因此不能把 extensions.json 的静态 diff 当成完整迁移验收。

## 迁移风险 gate

### BLOCKER

- legacy `subTagRegex` 不是有效 JavaScript RegExp：先修复正则，再继续。

### WARN / 人工验收

- `customHighlight`：foreground/background/icon/ruler 等视觉表现需要人工对照；
- multiline regex：需要真实 runtime 验证；
- UTF-16 文件：需要 workspace scan 验证；
- legacy keybinding / command：静态无法证明兼容时必须实际触发；
- 没有 fresh Extension Host 日志：只能 pending，不能推断 activation PASS。

### WARN/FAIL

- ripgrep override 指向 VS Code 私有内部目录：不要迁移旧绝对路径；优先回到新扩展自身 resolver / packaged ripgrep。

## 验收边界

### 静态配置层

确认 JSONC 合法、replacement mapping 正确、settings namespace 正确、活动标签/配置快照一致、没有陈旧内部路径。

### CLI / Extension Host 层

确认新扩展真实安装，并使用 fresh 日志排除 activation failure、`command not found`、ripgrep/executable missing。

### GUI / runtime 层

至少覆盖任务适用的：

- Reload Window；
- Tree View / Activity Bar 真实出现；
- Refresh；
- 跳转；
- Filter / Group / Expand/Collapse；
- 高亮/视觉差异；
- fresh restart；
- 大仓库性能。

只有适用的三层证据都满足，才能写“replacement 验证通过”。否则使用：

```text
CLI/settings migration completed
runtime GUI acceptance pending
```

或等价的分层状态，不能把历史某次机器上的 PASS 复用成当前环境结论。

## 回滚原则

首轮迁移可以在用户授权后保留旧扩展安装但禁用一个验收周期，以便快速回滚。稳定验收后再由用户决定是否卸载旧扩展。

如果需要修改 User Settings：

1. 先明确用户级 scope；
2. 创建迁移前备份；
3. 只迁移活动 legacy 键；
4. 记录 namespace 变化；
5. 失败时用备份恢复，而不是通过 VS Code 私有二进制路径做长期垫片。

## 未来维护约束

- 更新 replacement mapping 前重新确认扩展 ID、上游维护/归档状态、VS Code engine 与安装渠道。
- 不把某一次事故报告的本机绝对路径或开发期文件位置写入对外 skill。
- 不把“存在兼容层”夸大成“所有配置和 UI 完全一致”。
- 未来如果 Better Todo Tree 自身失去维护或出现更合适替代，应更新当前 mapping 和 reference，而不是让历史决定永久覆盖新证据。
