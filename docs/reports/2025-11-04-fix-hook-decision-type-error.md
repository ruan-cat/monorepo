# Claude Code 钩子决策类型错误修复报告

**日期**: 2025-11-04
**版本**: v0.6.0 → v0.6.1
**严重程度**: 🔴 Critical（严重）
**影响范围**: UserPromptSubmit 和 Stop 钩子
**修复状态**: ✅ 已修复

---

## 执行摘要

在 v0.6.0 版本中引入的双钩子协作机制（UserPromptSubmit 和 Stop 钩子）存在严重的实现错误：钩子脚本返回了不支持的决策类型 `"proceed"`，导致 Claude Code 内部抛出异常并崩溃。本次修复将所有钩子的返回值从 `"proceed"` 改为官方支持的 `"approve"`，彻底解决了这个问题。

---

## 问题描述

### 故障现象

用户在使用 v0.6.0 版本的 `common-tools` 插件后，Claude Code 出现如下错误：

```log
This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:
Error: Unknown hook decision type: proceed. Valid types are: approve, block
    at gc2 (file:///C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/@anthropic-ai+claude-code@2.0.32/node_modules/@anthropic-ai/claude-code/cli.js:3460:1222)
    at An5 (file:///C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/@anthropic-ai+claude-code@2.0.32/node_modules/@anthropic-ai/claude-code/cli.js:3467:238)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
```

### 故障影响

1. **UserPromptSubmit 钩子失效**: 虽然成功记录了用户输入到日志文件，但导致 Claude Code 崩溃
2. **Stop 钩子失效**: 虽然成功生成了 Gemini 总结，但导致 Claude Code 无法继续执行
3. **用户体验受损**: 插件的核心功能（对话记录 + 智能总结）无法正常使用

### 问题定位

通过分析错误日志，明确定位到问题根源：

- **错误信息**: `Unknown hook decision type: proceed. Valid types are: approve, block`
- **问题文件**:
  - `claude-code-marketplace/common-tools/scripts/user-prompt-logger.sh:60`
  - `claude-code-marketplace/common-tools/scripts/task-complete-notifier.sh:48`
  - `claude-code-marketplace/common-tools/scripts/task-complete-notifier.sh:247`
- **错误代码**: `echo "{\"decision\": \"proceed\"}"`

---

## 根本原因分析

### 官方 API 规范

根据 [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks) 官方文档，钩子返回的 JSON 必须包含 `decision` 字段，且**只支持两种值**：

| 决策类型  | 说明                             | 使用场景                     |
| --------- | -------------------------------- | ---------------------------- |
| `approve` | 允许操作继续，不阻塞 Claude Code | 正常执行，记录日志，发送通知 |
| `block`   | 阻止操作继续，显示阻塞消息       | 需要用户确认或满足特定条件   |

### 错误来源

在 v0.6.0 的实现中，开发者错误地使用了 `"proceed"` 作为决策类型。这可能是由于：

1. **对 API 文档理解不足**: 没有仔细阅读官方文档的钩子返回值规范
2. **参考了错误的示例**: 可能参考了其他项目或早期版本的不正确实现
3. **测试不充分**: 没有在真实环境中完整测试钩子的返回值处理

### 为什么功能能部分工作？

值得注意的是，尽管返回了错误的决策类型，但钩子的核心功能（记录日志、生成总结）仍然能够执行。这是因为：

1. **钩子执行在前**: 脚本的实际逻辑（记录、总结）在返回决策之前就已经完成
2. **异常发生在后**: Claude Code 在解析钩子返回值时才抛出异常
3. **文件已写入**: 日志文件和通知在异常发生前已经成功写入

这种"部分成功"的现象容易让开发者误以为实现是正确的，从而延迟了问题的发现。

---

## 修复方案

### 修复策略

采用**最小改动原则**，只修改钩子的返回值，不改变其他逻辑：

1. 将所有 `"proceed"` 替换为 `"approve"`
2. 确保三个关键位置都被修复
3. 保持其他功能逻辑不变

### 修复代码对比

#### user-prompt-logger.sh:60

**修复前**:

```bash
# ====== 快速返回 ======
echo "{\"decision\": \"proceed\"}"  # ❌ 错误的决策类型
exit 0
```

**修复后**:

```bash
# ====== 快速返回 ======
echo "{\"decision\": \"approve\"}"  # ✅ 正确的决策类型
exit 0
```

#### task-complete-notifier.sh:48

**修复前**:

```bash
# ====== 错误陷阱 ======
trap 'log "Script interrupted, returning success to prevent blocking"; echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT
```

**修复后**:

```bash
# ====== 错误陷阱 ======
trap 'log "Script interrupted, returning success to prevent blocking"; echo "{\"decision\": \"approve\"}"; exit 0' ERR EXIT
```

#### task-complete-notifier.sh:247

**修复前**:

```bash
# ====== 向 Claude Code 输出成功信息 ======
OUTPUT_JSON="{\"decision\": \"proceed\", \"additionalContext\": \"✅ 任务总结: ${SUMMARY}\"}"
```

**修复后**:

```bash
# ====== 向 Claude Code 输出成功信息 ======
OUTPUT_JSON="{\"decision\": \"approve\", \"additionalContext\": \"✅ 任务总结: ${SUMMARY}\"}"
```

### 测试验证

修复后需要验证以下场景：

- [x] UserPromptSubmit 钩子正常记录用户输入
- [x] Stop 钩子正常生成 Gemini 总结
- [x] Claude Code 不再抛出 "Unknown hook decision type" 错误
- [x] 通知功能正常工作
- [x] 日志文件正常生成

---

## 设计反思

### 为什么会犯这个错误？

1. **API 文档理解不到位**
   - 问题：开发时没有仔细阅读官方的钩子 API 文档
   - 教训：对于第三方平台的 API，必须严格遵守官方文档的规范

2. **缺少集成测试**
   - 问题：只测试了钩子的功能逻辑（记录、总结），没有测试返回值的正确性
   - 教训：集成测试应该覆盖 API 的完整流程，包括返回值的验证

3. **错误的参考来源**
   - 问题：可能参考了不正确的示例代码或早期版本的实现
   - 教训：优先参考官方文档和官方示例，对非官方来源保持警惕

### 如何避免类似问题？

#### 1. 建立 API 规范检查清单

在实现任何第三方 API 之前，必须完成以下检查：

- [ ] 阅读官方文档的 API 规范部分
- [ ] 了解所有必需字段和可选字段
- [ ] 了解每个字段的有效值范围
- [ ] 查看官方提供的示例代码
- [ ] 测试所有可能的返回值组合

#### 2. 增强测试覆盖率

```bash
# 集成测试脚本示例
test_hook_decision_types() {
  # 测试 approve 决策
  result=$(bash user-prompt-logger.sh < test_input.json)
  assert_contains "$result" '"decision": "approve"'

  # 确保不包含错误的决策类型
  assert_not_contains "$result" '"decision": "proceed"'
  assert_not_contains "$result" '"decision": "continue"'
}
```

#### 3. 代码审查关注点

在代码审查时，特别关注：

- 是否严格遵循 API 文档的规范
- 返回值是否使用了有效的枚举值
- 错误处理是否覆盖了所有异常情况
- 是否有集成测试验证 API 调用的正确性

#### 4. 文档和注释

在关键位置添加明确的注释：

```bash
# ====== 快速返回 ======
# IMPORTANT: Claude Code 只接受两种决策类型：
# - "approve": 允许操作继续（正常情况）
# - "block": 阻止操作继续（需要用户确认）
# 参考：https://docs.claude.com/en/docs/claude-code/hooks
echo "{\"decision\": \"approve\"}"
exit 0
```

---

## 经验教训

### 关键学习点

1. **严格遵守 API 规范**
   - API 文档中明确列出的枚举值必须严格遵守
   - 不要自行创造或猜测可能的值
   - 即使功能部分工作，也可能隐藏着严重的错误

2. **测试的重要性**
   - 功能测试 ≠ 完整测试
   - 必须测试 API 的完整流程，包括返回值的处理
   - 集成测试应该在真实环境中运行

3. **错误的隐蔽性**
   - "部分成功"的功能最危险，容易让开发者误以为实现正确
   - 必须验证整个调用链，不能只看表面现象
   - 日志和监控可以帮助发现隐藏的错误

4. **文档的价值**
   - 官方文档是最权威的参考
   - 详细的注释可以帮助未来的维护者理解设计意图
   - 问题报告和修复记录是宝贵的知识资产

### 未来改进方向

1. **建立自动化测试**
   - 为所有钩子编写集成测试
   - 测试所有可能的返回值和错误情况
   - 在 CI/CD 流程中自动运行测试

2. **增强错误监控**
   - 添加钩子执行状态的监控
   - 记录 Claude Code 的错误日志
   - 建立告警机制，及时发现问题

3. **完善开发文档**
   - 编写插件开发指南
   - 列出常见的陷阱和最佳实践
   - 提供正确的示例代码

4. **代码审查流程**
   - API 调用必须经过审查
   - 检查是否符合官方文档规范
   - 验证测试覆盖率

---

## 参考资料

- [Claude Code Hooks Reference](https://docs.claude.com/en/docs/claude-code/hooks) - 官方钩子 API 文档
- [Claude Code Plugins Reference](https://docs.claude.com/en/docs/claude-code/plugins-reference) - 官方插件开发文档
- [common-tools CHANGELOG.md](../../claude-code-marketplace/common-tools/CHANGELOG.md) - 完整的版本更新历史
- [user-prompt-logger.sh](../../claude-code-marketplace/common-tools/scripts/user-prompt-logger.sh) - UserPromptSubmit 钩子实现
- [task-complete-notifier.sh](../../claude-code-marketplace/common-tools/scripts/task-complete-notifier.sh) - Stop 钩子实现

---

## 变更总结

### 修改的文件

1. `claude-code-marketplace/common-tools/scripts/user-prompt-logger.sh`
   - 第 60 行：`"proceed"` → `"approve"`

2. `claude-code-marketplace/common-tools/scripts/task-complete-notifier.sh`
   - 第 48 行：`"proceed"` → `"approve"`（错误陷阱）
   - 第 247 行：`"proceed"` → `"approve"`（正常输出）

3. `claude-code-marketplace/common-tools/CHANGELOG.md`
   - 添加 v0.6.1 版本的更新说明

4. `.claude-plugin/marketplace.json`
   - 更新版本号：`0.6.0` → `0.6.1`

5. `claude-code-marketplace/common-tools/.claude-plugin/plugin.json`
   - 更新版本号：`0.6.0` → `0.6.1`

### 兼容性

- ✅ 向后兼容：无破坏性变更
- ✅ 即时生效：用户更新到 v0.6.1 后立即修复
- ✅ 无需迁移：不需要任何手动配置或数据迁移

---

## 结论

本次修复解决了一个严重但容易修复的 API 使用错误。问题的根源在于对官方 API 规范理解不足，以及缺少完整的集成测试。通过这次经验，我们学到了：

1. **严格遵守 API 文档**是第三方集成的基本原则
2. **完整的测试覆盖**可以及早发现隐藏的错误
3. **详细的文档和注释**有助于未来的维护和问题排查
4. **持续改进**的开发流程可以避免类似问题再次发生

未来，我们将建立更完善的测试和审查流程，确保插件的稳定性和可靠性。

---

**维护者**: ruan-cat (1219043956@qq.com)
**仓库**: [https://github.com/ruan-cat/monorepo](https://github.com/ruan-cat/monorepo)
**许可证**: MIT
