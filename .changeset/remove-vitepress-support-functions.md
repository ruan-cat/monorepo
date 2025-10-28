---
"@ruan-cat/utils": minor
---

重构：移除 VitePress 文档管理相关函数

将所有用于支持 VitePress 预设包的文档管理工具函数迁移至 `@ruan-cat/vitepress-preset-config` 包，实现更合理的职责分离：

**删除的函数**：

- `addChangelog2doc` - 将变更日志添加到文档目录
- `copyChangelogMd` / `hasChangelogMd` - 复制和检查 CHANGELOG.md 文件
- `copyClaudeAgents` / `hasClaudeAgents` - 复制 .claude/agents 文件夹到文档目录
- `copyReadmeMd` / `hasReadmeMd` / `hasCapitalReadmeMd` / `hasLowerCaseReadmeMd` - README 文件复制和检查相关函数

**结构优化**：

- 将 `yaml-to-md.ts` 从 `scripts/` 子目录提升至 `node-esm/` 目录
- 移除了大量注释代码，保持代码整洁

**影响范围**：
这些函数现已迁移到 `@ruan-cat/vitepress-preset-config` 包中，原有使用这些函数的项目需要从新的包中导入。

**迁移指南**：

```typescript
// 旧导入方式（已废弃）
import { addChangelog2doc, copyReadmeMd } from "@ruan-cat/utils/node-esm";

// 新导入方式
import { addChangelog2doc, copyReadmeMd } from "@ruan-cat/vitepress-preset-config";
```
