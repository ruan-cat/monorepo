# Delta Specs 格式规范

Delta specs 只描述变更部分，不重复描述未变更的系统行为。使用三种语义标记区分变更类型。

## 完整格式示例

```markdown
## ADDED Requirements

### Requirement: 新功能名称

系统 MUST 提供 [功能描述]。

#### Scenario: 场景名称

- **WHEN** 前置条件
- **THEN** 预期结果
- **AND** 额外条件

## MODIFIED Requirements

### Requirement: 修改的功能

- **变化说明**: 具体变化
- **原因**: 修改原因
- **影响范围**: 受影响区域

## REMOVED Requirements

### Requirement: 废弃的功能

- **Reason**: 废弃原因
- **Migration**: 迁移路径
```

## 格式要求

1. Delta 分区使用英文标题（ADDED / MODIFIED / REMOVED）
2. 需求必须包含 MUST / SHALL / SHOULD 关键词
3. 场景使用英文 Gherkin 关键字（GIVEN / WHEN / THEN / AND）
4. 每个 Requirement 至少包含一个 Scenario
5. REMOVED 必须提供 Reason 和 Migration（说明迁移路径，避免破坏性变更没有退路）

## 动态任务与 Specs 同步规则

执行中动态补全任务时，先判断新增任务是否改变 OpenSpec 已描述的行为、技术路线或目标边界。

1. 动态任务若新增或改变用户可观察行为，必须同步更新 `specs/**/spec.md`。
2. 动态任务若改变技术路线、架构决策或实现约束，必须同步更新 `design.md`。
3. 动态任务若只补齐执行遗漏，且不改变用户可观察行为或技术路线，可以只更新 `tasks.md`。
4. 同步 `specs/**` 或 `design.md` 后，必须运行 `openspec validate <change-name> --strict`。
