---
"@ruan-cat/utils": patch
---

**安全增强**：为 `copyClaudeAgents` 函数添加路径安全验证

修改位置：`packages/utils/src/node-esm/scripts/copy-claude-agents.ts`

**主要改进**：

1. **路径安全验证**：`target` 参数现在禁止使用绝对路径
   - 使用 `path.isAbsolute()` 进行跨平台路径检测
   - 当传入绝对路径时会抛出明确的错误信息
   - 防止意外覆盖系统目录（如 `/etc`, `C:\Windows` 等）

2. **改进的 TypeScript 类型定义**：
   - 更新 `CopyClaudeAgentsOptions` 接口文档
   - 明确标注 `target` 必须是相对路径
   - 添加 `@throws` 标签说明错误情况
   - 提供正确和错误的使用示例

3. **更清晰的错误提示**：
   ```plain
   target 参数不允许使用绝对路径，这可能导致意外的文件覆盖。
   当前传入的路径: "/path/to/dir"
   请使用相对路径，例如: "src/docs/prompts/agents"
   ```

**影响范围**：

- ✅ 不影响现有正确使用相对路径的代码
- ⚠️ 如果之前使用了绝对路径，现在会抛出错误（这是预期行为，可防止潜在风险）

**升级指南**：
如果你的代码中使用了绝对路径作为 `target`，请改为相对路径：

```typescript
// ❌ 旧代码（不再支持）
copyClaudeAgents({ target: "/absolute/path/agents" });

// ✅ 新代码（推荐）
copyClaudeAgents({ target: "dist/agents" });
```
