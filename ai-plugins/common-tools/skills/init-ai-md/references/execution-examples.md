> **何时读**：执行各步骤需要对照具体场景时；五个场景（全新初始化 / 增量更新 / 差异补全 / 初始化技能并生成技能表 / 增量更新发现新技能）为 SKILL.md 执行流程的逐字示例，与流程冲突时以 SKILL.md 为准。

## 执行示例

### 场景 1：全新项目初始化

```markdown
用户：请帮我初始化 AI 记忆文件

执行流程：

1. 检测到无 AGENTS.md → 创建 AGENTS.md
2. 扫描 templates/ 目录，建立可用记忆项清单
3. 使用 AskUserQuestion 询问用户需要哪些记忆项
4. 用户选择后，按序号顺序插入选中的模板内容
5. 确认 AGENTS.md 已创建，继续执行技能检查和技能表生成
```

### 场景 2：增量更新现有项目

```markdown
用户：请更新我的 AGENTS.md 记忆文件

执行流程：

1. 检测到已有 AGENTS.md → 读取现有内容
2. 扫描现有二级标题，建立现存记忆项清单
3. 扫描 templates/ 目录，建立可用记忆项清单
4. 对比分析，标注每个记忆项的状态（缺失/需更新/已完整）
5. 使用 AskUserQuestion 询问用户需要处理哪些记忆项
6. 用户选择后，对每个选中项执行差异对比和增量补全
7. 检测到存在 CLAUDE.md/GEMINI.md → 删除旧内容并写入固定重定向
8. 回读 AGENTS.md 与重定向文件，完成验收
```

### 场景 3：差异对比补全示例

```markdown
用户：更新 AGENTS.md 中的"编写测试用例规范"章节

执行流程：

1. 读取 AGENTS.md 中该章节的完整内容
2. 读取对应的记忆项模板内容
3. 逐行对比，发现：
   - 缺失描述段落
   - 缺失测试文件格式或断言规范
4. 在对应位置补全缺失内容
5. 保持原有的自定义内容不变
```

### 场景 4：初始化本地技能并生成技能表

```markdown
用户：请帮我初始化 AI 记忆文件

执行流程：

1. 检测到无 AGENTS.md → 创建 AGENTS.md
2. 扫描 templates/ 目录，建立可用记忆项清单
3. 使用 AskUserQuestion 询问用户需要哪些记忆项
4. 用户选择后，按序号顺序插入选中的模板内容
5. 检查 .agents/skills/ → 不存在 record-bug-fix-memory
6. 无条件创建 .agents/skills/fix-bug/record-bug-fix-memory/SKILL.md
7. 扫描 .agents/skills/ 全部技能 → 生成「本项目的技能表」章节
8. 将技能表插入 AGENTS.md 的开头位置（一级标题之后、其他二级标题之前）
9. 对存在的 CLAUDE.md/GEMINI.md 写入固定重定向并完成验收
```

### 场景 5：增量更新时发现新技能

```markdown
用户：请更新我的 AGENTS.md 记忆文件

执行流程：

1. 检测到已有 AGENTS.md → 读取现有内容
2. 扫描 templates/ 和已有记忆项 → 对比分析
3. 用户选择更新记忆项 → 执行差异补全
4. 检查 .agents/skills/ → 发现已有 record-bug-fix-memory
5. 扫描 .agents/skills/ → 发现用户新增了 code-style 技能
6. 对比现有技能表 → 识别新增技能
7. 补全技能表，新增 code-style 条目
8. 检测到存在 CLAUDE.md/GEMINI.md → 删除旧内容并写入固定重定向
```
