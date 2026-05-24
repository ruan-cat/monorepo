# tasks.md 编写规范

`tasks.md` 是 OpenSpec 工作流中最关键的执行载体。其质量直接决定后续 `/opsx:apply` 的执行质量。

## 规范 1：任务必须落实到单文件级别

每一个任务条目必须同时满足三个要素：

- **明确文件路径**：精确写出受影响文件的完整相对路径（如 `packages/utils/src/foo.ts`）
- **明确操作类型**：使用 `[新增]`、`[修改]`、`[删除]` 等前缀标注操作类型
- **明确修改内容**：描述该文件需要做什么具体改动（增加什么函数、修改什么逻辑、删除什么代码）

这样做的原因：粗粒度的任务描述（如"更新配置"）在实际执行时会产生歧义，导致 AI 无法确定目标文件和操作范围，从而引发遗漏和缺省。精确到文件级别，才能让每个任务条目都是可独立验证的执行单元。

### 正确示例

```markdown
- [ ] [修改] `packages/utils/src/index.ts` - 在 exports 列表末尾新增 `export * from "./foo"`
- [ ] [新增] `packages/utils/src/foo.ts` - 创建 `formatDate()` 工具函数，接收 Date 对象，返回 `YYYY-MM-DD` 格式字符串
- [ ] [修改] `packages/utils/package.json` - 在 `exports` 字段中新增 `"./foo"` 子路径映射
```

### 错误示例（禁止使用此类粗粒度描述）

```markdown
- [ ] 添加 formatDate 工具函数
- [ ] 更新包配置
- [ ] 处理导出
```

---

## 规范 2：任务总量 ≥ 5 时，必须设计试点批次

当任务总数达到 5 个或以上时，需要在正式任务执行前，先划分出一个小的**试点批次（Pilot Batch）**来验证方向。这是风险管理的核心手段——大批量变更时，先用最小代价验证模式是否正确，避免方向偏差后的大规模返工。

### 试点批次的选取原则

1. **代表性**：覆盖变更的核心逻辑，能代表整批任务的技术难度和变更模式
2. **最小化**：1-3 个任务为宜，但要能形成可验证的完整闭环
3. **低风险**：优先选影响范围小、副作用少的文件；高风险的公共基础设施（如 `index.ts` 主入口、全局配置）不适合作为首批试点
4. **可验证**：试点完成后，能通过构建、测试或人工检查来确认结果是否符合预期

### tasks.md 结构模板（含试点批次）

```markdown
## 试点批次（Pilot Batch）

> 目的：先完成最小可验证单元，通过测试和反馈后再推进后续批次。
> 完成标准：试点文件修改完毕，本地构建通过，功能行为符合预期。

- [ ] [修改] `packages/foo/src/bar.ts` - 增加 `processItem()` 方法，实现单条数据处理逻辑（代表核心变更模式）

## 主体任务（Main Tasks）

> 在试点批次验证通过后，继续执行以下任务。

- [ ] [修改] `packages/foo/src/list.ts` - 调用 `processItem()` 处理列表中的每个元素
- [ ] [修改] `packages/foo/src/api.ts` - 在 API 处理器中调用 `processItem()`
- [ ] [新增] `packages/foo/src/utils/validate.ts` - 提取校验逻辑为独立工具函数
- [ ] [修改] `packages/foo/tests/bar.test.ts` - 为 `processItem()` 新增单元测试覆盖
```

---

## 规范 3：禁止事项

- **禁止**编写无法直接定位到文件的模糊任务（如「处理相关文件」、「更新配置」）
- **禁止**将多个文件的修改合并到同一个任务条目
- **禁止**在任务总数 ≥ 5 时跳过试点批次设计
- **禁止**把高风险的公共基础设施文件（如 `index.ts` 主入口、全局配置）放入试点批次

---

## 执行中动态补全任务

执行 `/opsx:apply`、`/opsx:verify` 或人工复核时，如果发现当前 change 的 `tasks.md` 漏掉实现、验证、证据或依赖任务，必须先把遗漏补回 `tasks.md`，再继续实现或验收。`tasks.md` 是唯一可执行任务源，不得创造第二任务源。

### 触发条件

- 实现依赖缺失，导致原任务无法闭环。
- 验证失败暴露遗漏的文件、endpoint、测试、HTTP/browser/DB/write evidence 或 guard。
- 子代理复核发现 specs 到任务的追踪断裂，或发现已确认范围内的文件未覆盖。
- 批次验收缺少必要的 HTTP、browser、DB、写入证据或替代验证记录。
- 用户在同一 change 范围内追加已确认要求，且不改变目标边界。

### 追加位置

- 优先追加到对应业务章节或对应批次下，保持执行顺序清晰。
- 跨切片规则可追加到「动态补全任务」小节。
- 「动态补全任务」小节只属于 `tasks.md` 的组织方式，不得形成聊天 checklist、`agent-progress.md`、`agent-findings.md` 或子代理报告里的第二任务源。

### 去重规则

- 按文件路径、endpoint、操作类型、验收目标和证据来源去重。
- 已有任务能覆盖同一缺口时，只补强原条目的动作或验收标准。
- 不得重复追加语义相同的 backlog 条目。

### 粒度规则

- 补全任务必须继续使用 OpenSpec checkbox 格式：`- [ ] [操作类型] 路径 - 具体动作与验收标准`。
- 真实 Nitro 迁移任务优先写到 endpoint/file-level，例如 handler、adapter、repository、runtime manifest、caller、contract test、HTTP gate、browser evidence、DB evidence、write guard。
- 每条任务必须有可定位文件或明确 endpoint，并包含可验收结果或证据来源。

### 禁止规则

- 禁止新增「继续探索」「完善相关内容」「后续处理」这类无文件、无验收的模糊任务。
- 禁止把 fallback evidence、`READY_CONFIGURED`、Vitest 通过、HTTP 200、blocked guard 误写成 `DB_READY`、exact migrated、shadow-off 或 retirement candidate。
- 禁止把当前 `proposal.md`、`design.md`、`specs/**` 未覆盖的新目标伪装成动态补全任务；目标边界改变时应暂停并评估是否需要新的 OpenSpec change。
- 任务补全后必须运行 `openspec validate <change-name> --strict`，未通过前不得勾选完成或声明验收完成。

---

## 执行时的任务粒度原则

执行 `/opsx:apply` 时，遵循以下原则来保证质量：

1. **文件级粒度执行**：每次只修改一个文件，立即标记完成，不允许跨文件批量操作
2. **先试点再推进**：先完成「试点批次」的任务，验证通过后再继续「主体任务」
3. **及时更新状态**：完成每个任务后立即将 `- [ ]` 改为 `- [x]`；发现遗漏任务时先补写 `tasks.md` 并运行 strict validate，保持进度透明
