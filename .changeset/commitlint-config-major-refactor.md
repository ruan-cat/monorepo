---
"@ruan-cat/commitlint-config": major
---

# 重大破坏性变更：提交类型结构重构

本次更新对 `@ruan-cat/commitlint-config` 包进行了重大重构，包含多个破坏性变更。

## 💥 破坏性变更

### 1. 类型定义变更

- **CommitType 接口**新增 `longDescription` 可选字段
- **`description` 字段语义变更**：从原来的"中文 | 英文"混合格式，改为纯中文描述
- **`longDescription` 字段**：新增用于存储英文长描述

**迁移指南**：

```typescript
// 旧格式
{
  type: "feat",
  description: "新增功能 | A new feature"
}

// 新格式
{
  type: "feat",
  description: "新增功能",
  longDescription: "A new feature"
}
```

### 2. 提交类型名称变更

- `del` → `delete`（删除垃圾）

**影响**：使用 `del` 类型的项目需要更新为 `delete`

### 3. Emoji 图标变更

以下提交类型的 emoji 图标已更改：

- **build**: `🔧` → `🔨`
- **config**: `⚙️` → `🔧`
- **revert**: `↩` → `🔙`
- **delete** (原 del): `🗑` → `🔪`

**影响**：已有的提交历史中的 emoji 显示可能与新版本不一致

### 4. cz-git 格式化输出变更

`convertCommitTypesToCzGitFormat()` 函数完全重写：

- **新增四层对齐机制**：
  1. Emoji 图标固定对齐（占 3 个字符宽度）
  2. Type 提交类型字段对齐
  3. Description 描述字段对齐
  4. LongDescription 长描述的竖线 `|` 对齐

- **输出格式变更**：

  ```plain
  旧格式: emoji type:     description
  新格式: emoji type: description | longDescription
  ```

- **新增宽度计算函数** `getDisplayWidth()`：精确计算中文、emoji 等宽字符的显示宽度

**影响**：cz-git 的提交选择界面显示格式将完全改变

### 5. 描述文本微调

部分提交类型的描述进行了优化：

- `publish`: "发包" → "发布依赖包"
- `init`: "初始化" → "初始化项目"
- `save-file`: 简化了冗长的描述文本

## ⚠️ 升级注意事项

1. **不兼容旧版配置**：如果你的项目直接依赖 `commitTypes` 数组结构，需要更新相关代码
2. **Git 历史兼容性**：旧提交中的 emoji 可能与新规范不匹配
3. **团队协作**：建议整个团队同步升级，避免提交规范不一致
4. **自定义配置**：如果扩展了 `commitTypes`，需要按新格式更新

## ✨ 改进

- 更精确的字符宽度计算，完美支持中英文混排和 emoji
- 更清晰的视觉对齐，提升 cz-git 界面可读性
- 描述文本国际化分离，便于多语言支持
- 更直观的 emoji 选择
