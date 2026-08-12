# 2026-08-13 Skill Router MCP 长任务 Terra 模型用量预算评估

> 报告执行工具：Codex desktop agent（本地仓库读写、OpenAI 官方资料检索）
>
> 评估模型：GPT-5.6 Terra（假设采用该模型执行后续 Codex 长任务）
>
> 报告日期：2026-08-13

## 结论先行

仅凭“Pro 订阅剩余 35%”不能确认一定够或一定不够，因为我无法读取你的账户 Usage Dashboard，而当前 Codex 对 Plus/Pro 主要按 token 计费，实际 credits 取决于输入 token、缓存输入 token、输出 token、上下文复用、并发代理和 fast mode。

基于当前长任务的剩余范围，我的判断是：

- 只完成 CP-01～CP-03（本地 package、核心 tools、workerd/production harness）：35% 额度有较高概率够，但仍不是保证。
- 完成 CP-01～CP-04（再加 CI、Cloudflare candidate、构建配置和 preview 证据）：35% 额度处于临界区，取决于当前总 credits 和上下文缓存率。
- 完成 CP-01～CP-05（再加真实 Cloudflare promotion、ChatGPT Developer Mode、Workspace review、生产 smoke 与回滚）：不建议把 35% 当作可靠预算；外部权限、等待、失败重试和长上下文会显著增加消耗。

因此最稳妥的策略是：先用 Terra 推进 CP-01，完成一个可验证 checkpoint 后查看 Usage Dashboard 的实际消耗，再决定是否继续；不要一开始承诺 35% 能覆盖整个 goal。

## 官方计费与限额事实

截至 2026-08-13，OpenAI 官方 Codex rate card 说明：

| GPT-5.6 Terra token 类型 | 每 1M token credits |
| ------------------------ | ------------------: |
| 输入 token               |                  50 |
| 缓存输入 token           |                   5 |
| 输出 token               |                 300 |

官方还说明：

1. Codex 已从按消息的近似计费迁移到按 token 类型计费；实际消耗取决于任务的输入、缓存输入和输出构成。
2. Reasoning/Ultra 可能运行额外 agent，不能只用消息数量估算。
3. Codex、ChatGPT Work、ChatGPT for Excel 和 Workspace Agents 在适用账户上可能共享 agentic usage/credit pool。
4. Pro 的不同模型可能有独立 allowance；达到某个模型 allowance 后，该模型可能暂时不可用，界面会显示重置时间。
5. Pro $100 与 Pro $200 的核心能力相近，但 usage allowance 不同；官方没有在公开帮助页给出“剩余 35% 等于多少 Terra token”的固定换算。

官方资料：

- <https://help.openai.com/en/articles/20001106>
- <https://help.openai.com/en/articles/12642688>
- <https://help.openai.com/en/articles/9793128-what-is-chatgpt-business>
- <https://help.openai.com/en/articles/20001354-gpt-5-6-in-chatgpt>

## 当前长任务的剩余工作量

当前 OpenSpec change 已完成 CP-00 的 0.1～0.6，尚未创建 runtime package。剩余执行范围为 CP-01～CP-05，任务数量约 46 项，原计划时间为：

| 剩余 checkpoint                   | 原计划有效工作时间 | 主要用量风险                                                    |
| --------------------------------- | -----------------: | --------------------------------------------------------------- |
| CP-01 最小 MCP Runtime            |          6–10 小时 | SDK 版本、transport 配置、并发隔离、测试失败重试                |
| CP-02 SourceSnapshot 与核心 tools |         12–20 小时 | 大量源文件、单元测试、GitHub fake transport、错误边界           |
| CP-03 workerd/production harness  |          8–14 小时 | Nitro/Cloudflare runtime 上下文、长配置和多轮构建排错           |
| CP-04 CI、文档、candidate         |          6–12 小时 | Wrangler、Cloudflare Builds、外部配置证据                       |
| CP-05 生产、ChatGPT、回滚         |          4–10 小时 | 外部权限、等待、人工 UI 验收和失败重试                          |
| **合计**                          |     **36–66 小时** | **不是连续 36–66 小时模型生成，而是包含工具等待和外部状态处理** |

这不是“36–66 小时都要一直消耗模型”的意思。真正消耗 credits 的部分主要是：读取长上下文、规划、代码生成、测试失败分析、工具调用后的复盘，以及长任务恢复时重新装载的上下文。

## Terra credits 的区间估算

由于没有你的真实 Dashboard 数值，只能使用情景模型。下面假设工作以单主代理为主、少量并行审计、不使用 fast mode，并把输入拆成“未缓存输入”和“缓存输入”。

| 情景                  | 未缓存输入 | 缓存输入 | 输出 | 估算 Terra credits | 解释                                           |
| --------------------- | ---------: | -------: | ---: | -----------------: | ---------------------------------------------- |
| 精简推进 CP-01～CP-03 |         5M |      20M |   2M |             约 950 | 复用上下文良好，失败较少，外部部署不纳入       |
| 常规完成 CP-01～CP-04 |        10M |      30M |   4M |           约 1,850 | 包含多轮测试/构建排错和 candidate 配置         |
| 重度完成 CP-01～CP-05 |        20M |      50M |   8M |           约 3,650 | 包含生产/ChatGPT 外部 gate、失败重试和长上下文 |

计算公式：

```text
Terra credits ≈ 未缓存输入(M) × 50
              + 缓存输入(M) × 5
              + 输出(M) × 300
```

这是预算区间，不是 OpenAI 对本任务的实际报价。尤其是输出 token 和额外 agent 会让重度情景明显上浮；fast mode 也可能提高费率。

## “剩余 35%”如何换算

设 Usage Dashboard 当前本周期可用于本任务的总 credits 为 `Q`，则剩余预算约为：

```text
剩余预算 = 0.35 × Q
```

与上面的情景比较：

| Dashboard 总 credits `Q` | 剩余 35% | 对精简情景 | 对常规情景  | 对重度情景  |
| -----------------------: | -------: | ---------- | ----------- | ----------- |
|                    2,000 |      700 | 不足       | 不足        | 不足        |
|                    5,000 |    1,750 | 可能够     | 临界/略不足 | 不足        |
|                   10,000 |    3,500 | 够         | 可能够      | 临界/略不足 |
|                   15,000 |    5,250 | 够         | 够          | 可能够      |

但 `Q` 必须从你的 Usage Dashboard 获取，不能从 Pro 月费、某个聊天窗口的百分比或网上的旧消息数估算。

## 对本长任务的实际建议

### 推荐方案：分段执行

1. Terra 只推进 CP-01：创建 package、锁定 SDK、完成最小 MCP contract test。
2. 记录 CP-01 实际 credits、输入/输出趋势、是否发生上下文重载或模型 fallback。
3. 如果 CP-01 消耗低于剩余预算的 15%～20%，继续 CP-02；如果超过 25%，先暂停评估。
4. CP-02 完成后再决定是否使用 Terra 继续 CP-03，或切换更低成本模型承担机械性验证。
5. CP-04/CP-05 的 Cloudflare 和 ChatGPT 外部操作不要预先消耗大量模型额度；应在权限和 endpoint 准备好之后集中执行。

### 不推荐方案：一次性要求 Terra 做完整 goal

这样会把以下成本集中在一个长上下文中：

- 25 个原始 prompt 文件的恢复读取。
- OpenSpec 工件、源码、测试和 lockfile 的持续上下文。
- 多轮失败排错。
- Cloudflare dashboard/preview/production 外部等待。
- ChatGPT Developer Mode 和 Workspace review 的人工证据。

即使最终代码正确，也很难在开始前准确保证剩余 35% 一定覆盖。

## 最终判断

如果“35%”是一个较大的 Pro/Codex credits 池的剩余比例，并且你接受分 checkpoint 恢复，那么 Terra 很可能足以完成 CP-01～CP-03；完成到 CP-04 有条件可行；覆盖 CP-05 则不应作保证。

如果“35%”只是某个模型 allowance 的百分比，而不是 Codex Usage Dashboard 中可用于 agentic tasks 的 credits 余额，那么目前信息不足，无法做可靠判断。

真正决策前，请查看：Codex Settings → Usage Dashboard，记录当前可用 credits、最近几次任务消耗、是否共享 credits pool、是否开启 fast mode/auto top-up，以及模型 allowance 的 reset time。拿到这些数据后，才能把本报告的区间收敛为更准确的预算。
