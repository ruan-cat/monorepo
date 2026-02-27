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
