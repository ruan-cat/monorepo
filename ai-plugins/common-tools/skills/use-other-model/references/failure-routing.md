# 失败分流与回退策略

失败时先确定层级，再只修这一层。不要笼统说“模型不工作”，也不要靠同参数重试掩盖真实失败。

## 总表

| 层级 | 典型信号 | 第一动作 |
| --- | --- | --- |
| `PREFLIGHT_BLOCKED` | 工作目录/路径/身份/权限/验收/预算冲突 | 不启动真实任务；修任务合同 |
| CLI 启动失败 | 参数报错、进程起不来 | 运行当前 CLI `--help`，核对最小命令 |
| provider/auth 失败 | 配置未注入、401/403、model not found、宿主安全策略阻断 | 核对实际 shell、provider/model 和原始输出 |
| tool/permission 失败 | permission denied、范围外路径、工具错误 | 修正 scope/permission/tool 条件 |
| task execution 失败 | 任务理解错、编译/测试/运行失败 | 读原始 stdout/stderr/JSONL 与 execution log |
| artifact/verifier 失败 | 缺失产物、额外文件、验收失败、规则被篡改 | `VERIFIER_FAIL`，主代理复核 |
| browser verification 失败 | 页面/布局/交互不符合要求 | 记录具体问题，决定唯一一次修正重试或接管 |
| cleanup 风险 | 密钥残留、证据误删、临时文件泄漏 | 单独清理并报告，不覆盖 artifact 状态 |

## 1. Preflight blocked

以下问题应该在模型消耗真实任务 token 前发现：

- working directory 不对
- allowlist / expected files 冲突
- 跨工作区路径不可达
- 显式 provider/model 身份不完整
- 必需认证配置不存在
- 验收规则未冻结
- 预算或权限模式互相冲突

动作：

1. 写 `PREFLIGHT_BLOCKED`。
2. 保存阻断证据。
3. 修正任务合同。
4. 不运行真实任务 prompt。

## 2. CLI 启动失败

症状：

- CLI 参数不存在
- 进程直接退出
- 当前版本不支持文档里假定的参数

动作：

1. 运行当前版本 `--help`。
2. 回到对应最小官方模板。
3. 核对 shell、工作目录和参数。
4. 没有直接命令失败证据时，不加 wrapper。

报告或设计稿中的 `--dry-run`、`--scope`、`--read-only`、`models --json` 等期望能力，只有 `--help` 明确存在才可使用。

## 3. Provider / Auth

区分：

- 配置未注入
- provider 拒绝认证
- 模型名不可用
- endpoint/baseURL 错误
- 宿主安全策略拒绝注入

动作：

1. 看实际调用 shell，不看聊天里“应该已经设置”的变量。
2. 读取原始 stdout/stderr/结构化事件。
3. 显式 provider 模式核对完整 `provider/model`。
4. 宿主安全策略阻断写 `BLOCKED_EXTERNAL_POLICY`。

不要把 provider 失败改写成模型能力失败、任务执行失败或 launcher 失败。

## 4. Tool / Permission

症状：

- 外部目录被拒绝
- 工具调用 permission denied
- 自动加载 skill 扩大范围
- 结构化事件出现关键 tool error

硬规则：

**exit code 0 也不能覆盖 permission/tool error。**

动作：

1. 核对 working directory 与 allowlist。
2. 收窄或修正 permission/tool scope。
3. 若要重试，必须是本任务唯一一次失败重试，并且失败条件已经变化。

## 5. Task Execution

症状：

- 会话启动了，但没有按封包执行
- 把任务当成聊天总结
- 完整命令被改写成无关规划/fallback/release/sync
- 编译、测试或运行失败

动作：

1. 先读原始 JSON/JSONL、stdout/stderr。
2. 再读 execution log。
3. 判断：
   - 任务理解错误
   - 文件读取不足
   - 编译/测试错误
   - 运行错误
   - 完整命令被过度复杂化
4. 只修当前原因，不重写整套执行系统。

## 6. Artifact / Verifier

以下任一成立即 `VERIFIER_FAIL`：

- expected artifact 缺失
- changed files 与 expected set 不一致
- 文件越过 write allowlist
- frozen verification command 失败
- 执行者修改 verifier/test/evaluation/score/CI/acceptance 让自己通过
- 原始证据与派生结果冲突

执行者不能自行修改 verifier 后重新宣布 success。

详细确定性检查见 `evidence-verification.md`。

## 7. Browser Verification

症状：

- 页面打不开
- 首屏白屏
- 视觉布局明显错误
- 核心交互无响应
- 子会话跳过浏览器检查

动作：

1. 记录具体 URL、视觉/交互问题。
2. 区分启动、路由、布局、交互或工具不可用。
3. 问题局部且重试条件可改变 → 可使用唯一一次重试。
4. 已收敛成局部补丁或重试价值低 → 主代理接管。

禁止：

- 把 build pass 说成页面完成
- 把浏览器不可用当默认免责
- 用“看起来正常”代替证据

## 8. Cleanup

artifact pass 与 cleanup 是不同状态。

检查：

- API key/token 临时文件
- 环境变量残留
- 原始证据是否被误删
- 任务目录是否出现范围外敏感信息

cleanup 未完成时单独报告风险，不把前面状态改写成“全部完成”。

## 9. 重试上限

同一任务最多 **一次失败重试**。

允许重试的前提：

- 已经明确失败层；
- 失败条件发生实质变化，例如修正路径、权限、provider 配置或任务封包；
- 保留上一轮原始证据。

以下属于无效重试：

- 相同命令
- 相同上下文
- 相同权限
- 相同 provider/model 配置
- 只是“再试一次”

达到上限后主代理接管。

## 10. 判断顺序

1. preflight
2. CLI start
3. provider/auth
4. tool/permission
5. task execution
6. artifact/verifier
7. browser verification
8. cleanup
9. retry limit

每一层只处理自己的证据，不跨层代偿。
