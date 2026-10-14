> **何时读**：需要复核合并优先级的完整定义（数组合并 / 对象深度合并 / 简单值用户优先 / 策略键例外 / 可选插件合并）时读取；正文工作流程步骤 3 已内联可执行的策略键清单，两者冲突时以正文策略键为准。

## 合并逻辑详解

### 数组合并

对于 `recommendations`、`unwantedRecommendations` 等数组字段，默认去重合并：

```javascript
// 伪代码
merged = [...new Set([...userArray, ...templateArray])];
```

去重后保留所有项。

**replacement 例外：** 在执行上述并集前，先应用 `reference/extension-replacement-migrations.md` 中的映射。命中的旧扩展先从 `recommendations` 移除，再加入新扩展，并把旧扩展加入 `unwantedRecommendations`；用户明确要求保留旧扩展时除外。普通并集不得把已被 mapping 移除的旧 ID 重新加回来。

`vue.server.includeLanguages` 虽为数组，但属于策略键，不适用默认去重合并，必须收敛为 `["vue"]`，不得包含 `"markdown"`。

### 对象深度合并

对于嵌套对象（如 `files.exclude`、`files.watcherExclude`、`search.exclude`）：

```javascript
// 伪代码
merged = {
	...templateObject,
	...userObject, // 用户的键值对优先
};
```

用户已有的键保持不变，模板中新增的键会被添加。

### 简单值优先级

对于 `explorer.fileNesting.enabled`、`terminal.integrated.cwd` 等简单值：

- 如果用户已有配置，**完全保留用户的值**
- 如果用户没有配置，使用模板值

### 策略键例外

以下键不走“用户优先”，而是必须按模板收敛：

- `files.eol` → 必须为 `"\n"`
- `vue.server.includeLanguages` → 必须为 `["vue"]`，不得包含 `"markdown"`
- `search.indexing.maxFileSize` → 必须为 `1048576`
- `typescript.disableAutomaticTypeAcquisition` → 必须为 `true`
- `typescript.tsserver.watchOptions` → 必须补齐 `useFsEvents` 与 `dynamicPriority`
- `typescript.tsdk` → 默认使用 `node_modules/typescript/lib`
- `typescript.tsserver.maxTsServerMemory` → 缺失或低于 `4096` 时补齐，高风险项目可升到 `8192`

### 可选插件配置合并

对于用户选择添加的可选插件配置（git-graph、cursor、i18n-ally）：

- 使用与 settings.json 相同的深度合并逻辑
- 对于 `git-graph.repository.onLoad.showSpecificBranches` 等数组字段，去重合并
- 对于 `files.associations` 等对象字段，合并键值对
- 用户现有配置始终优先，不会被覆盖
