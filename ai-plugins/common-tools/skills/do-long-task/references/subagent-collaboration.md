# 子代理协作规则

本文件用于长任务中的子代理探索、编辑、复核和动态补全候选处理。

## 职责边界

子代理可以：

- 探索项目代码和文档。
- 复核实现是否满足 OpenSpec 工件。
- 在明确写入范围内编辑文件。
- 提出动态补全候选。
- 报告验证失败、遗漏任务、风险和可疑设计。

子代理不能：

- 创建第二任务源。
- 把自己的报告当执行清单。
- 直接替代 `tasks.md`。
- 擅自修改不属于自己写入范围的文件。
- 把未验证内容标记为完成。

## 动态补全候选格式

子代理返回建议时使用以下格式：

```markdown
### 建议补全任务

- 来源：验证失败 / 设计遗漏 / specs 未覆盖 / 实现依赖缺失
- 建议任务：`- [ ] [修改] path - 具体动作与验收标准`
- 是否需要同步 design/specs：是 / 否
- 验证方式：命令、HTTP、browser、DB 或人工复核
```

## 主代理职责

主代理负责：

- 去重。
- 合并。
- 排序。
- 判断是否属于当前 OpenSpec change。
- 写入 `tasks.md`。
- 必要时同步 `design.md` 或 `specs/`。
- 运行 OpenSpec validate。
- 判断是否满足勾选 `[x]` 的条件。

## 子代理写入规则

分配子代理编辑时，必须明确：

- 写入文件范围。
- 禁止回滚用户或其他代理的改动。
- 与其他编辑者的并发边界。
- 期望输出：改了哪些文件、验证了什么、剩余风险。

多子代理并行时，尽量拆成互不重叠的写入范围。若子代理结果冲突，由主代理合并，不让子代理互相覆盖。

## Superpowers 职责划分

Superpowers 不负责决定做哪个大任务，只负责指导每个小阶段如何高质量完成。

可按场景使用：

- `test-driven-development`：实现小阶段前先建立可验证目标。
- `systematic-debugging`：验证失败或行为异常时定位根因。
- `subagent-driven-development` / `dispatching-parallel-agents`：多个独立任务可并行时拆给子代理。
- `requesting-code-review`：完成重要阶段后做复核。
- `verification-before-completion`：完成声明前运行并读取验证结果。

不要让 Superpowers 的 implementation plan 成为第二主任务源；OpenSpec `tasks.md` 仍是唯一主任务源。
