# 破坏性变更详细示例

> 当需要编写破坏性变更提交时，参考此文件获取完整上下文和示例。

## 示例：从项目提取技能并重构为通用版本

```text
🦄 refactor(nitro-api-development)!: 从 11comm 项目提取技能并重构为通用版本

BREAKING CHANGE: 删除了 reference.md 和 templates.md，替换为 references/ 和 templates/ 子目录结构。

- 移除 reference.md
- 移除 templates.md
- 新增 references/ 子目录（含 7 个专项文档）
- 新增 templates/ 子目录（含 2 个可复用 TypeScript 文件）
```

## 示例对比：短 vs 长

| 场景 | 简短写法（SKILL.md 默认） | 完整写法（需详细迁移说明时） |
|:-----|:-------------------------|:--------------------------|
| 单行变更 | `BREAKING CHANGE: 函数签名从 X 改为 Y` | 同上 |
| 多维度变更 | 汇总为一条说明 | 逐条列出变更点 + 迁移步骤 |
| 大型重构 | 突出核心不兼容点 | 完整 CHANGELOG 式说明 |

## 最佳实践

- `BREAKING CHANGE:` 正文中说明**变更内容 + 影响范围 + 迁移方式**
- 如果有多条不兼容变更，使用无序列表分行
- 保持 body 面向"用户/调用方"视角，而非"实现细节"视角
