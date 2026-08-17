# 失败分流与回退策略

方案 B、方案 C 或方案 D 失败时，不要笼统说“模型不工作”。

必须先判断它属于哪一层失败，再处理。

## 分流总表

| 失败类型               | 典型表现                                             | 第一动作                                   |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------ |
| 启动失败               | CLI 参数报错、进程起不来、OpenCode/Claude CLI 不可用 | 跑 `claude --help` 或 `opencode --help`    |
| 方案 C provider 层失败 | 配置未注入、认证拒绝、模型名不可用、安全策略拒绝注入 | 核对当前 shell、显式 `--model` 和原始输出  |
| 方案 D 默认模型层失败  | 默认模型选择、变体不可用、OpenCode 配置错误          | 读取原始 JSONL 和 `opencode models` 输出   |
| 执行失败               | 子会话跑起来了，但命令失败或任务理解错               | 读 JSON 结果、execution log、stdout/stderr |
| 浏览器验收失败         | 构建通过，但页面显示或交互不对                       | 记录具体视觉问题，决定继续委托还是本地接管 |
| 连续两轮失败           | 已经修过一轮仍失败                                   | 停止委托，主代理接管                       |

## 1. 启动失败

### 常见症状

- `claude` 不接受某个参数
- 进程直接退出
- 显式 provider 路径中的环境变量没有生效
- 没进入可编辑模式

### 处理步骤

1. 运行 `claude --help`
2. 确认以下参数是否可用：
   - `-p`
   - `--permission-mode`
   - `--tools`
   - `--output-format`
   - `--append-system-prompt`
3. 如果是方案 C 或其他显式 provider 路径，检查 provider 环境变量；方案 D 不要求这些变量
4. 检查主代理是否把系统提示和任务封包路径写对了
5. 如果是方案 C 或 D，运行 `opencode --help`
6. 必要时做一次最小 smoke check

### 最小 smoke check

```bash
claude -p --output-format json "reply with ok"
```

如果 smoke check 都失败，先修启动层问题，不要继续怀疑任务内容。

方案 C 的 OpenCode 直连 provider 最小 smoke check：

```powershell
$env:ANTHROPIC_API_KEY = "<api-key>"
$env:OPENCODE_CONFIG_CONTENT = '{"provider":{"anthropic":{"options":{"baseURL":"https://<anthropic-compatible-endpoint>/v1"}}}}'
opencode run --model "anthropic/claude-fable-5" "reply with ok"
```

方案 D 的 OpenCode 裸启动最小 smoke check：

```bash
opencode run --format json --variant max "只回答 OPENCODE_DEFAULT_MODEL_SMOKE_OK，不调用工具，完成后退出。"
```

如果 OpenCode CLI 可以启动但指定 provider/model 失败，方案 C 转入 provider 层；默认模型选择或变体失败，方案 D 转入默认模型层。不要互相代替，也不要改 Claude Code 启动器。

## 2. 方案 C provider 层失败

### 常见症状

- 当前 shell 中没有 API key 或 provider 配置
- 聊天消息里给了 `$env:` 赋值，但没有进入实际子进程环境
- provider 返回 401、403、404、model not found 或 endpoint 错误
- 宿主环境在子进程创建前拒绝注入 API key

### 处理步骤

1. 核对当前 shell 的环境变量，而不是只看聊天文本。
2. 读取 OpenCode 或 Claude CLI 的原始 stdout/stderr。
3. 区分四种状态：
   - `配置未注入`
   - `provider 拒绝认证`
   - `模型名不可用`
   - `宿主安全策略拒绝注入`
4. 安全策略阻断写成 `BLOCKED_EXTERNAL_POLICY`。
5. 不把 provider 层失败改写成启动器失败、模型能力失败或任务执行失败。

如果显式 provider 层失败，先修配置传播、认证或模型名；不要增加启动 wrapper、进程扫描或 cleanup 逻辑。

## 3. 方案 D 默认模型层失败

### 常见症状

- 默认模型无法选择或本机 OpenCode 配置不可用
- `--variant max` 不被当前默认模型支持
- OpenCode 返回默认模型元数据或本机认证链路错误

### 处理步骤

1. 读取原始 JSONL 和 stderr。
2. 仅在错误给出 provider 线索时运行 `opencode models <provider> --verbose`，核对当前模型和可用变体。
3. 只在有具体错误时调整 `--variant` 或 OpenCode 配置。
4. 不要因为默认模型失败就自动改写为方案 C。

## 4. 执行失败

### 常见症状

- 子会话能启动，但没有按任务封包执行
- 编译失败
- 测试失败
- 运行失败
- 子会话把任务当成聊天总结
- 完整命令未执行就被改写成规划、fallback、release、sync 或外部模型委托

### 处理步骤

1. 读取 JSON 输出
2. 读取 execution log
3. 读取 stdout/stderr
4. 判断是哪一类失败：
   - 任务理解错误
   - 完整命令被复杂化
   - 文件读取不足
   - 编译错误
   - 测试错误
   - 运行错误
5. 只修当前这一层的问题，不要一口气重写整个流程

### 常见修复动作

- 任务理解错误 → 重写任务封包
- 完整命令被复杂化 → 判为任务理解错误；纠偏一次后仍不回到原命令，主代理接管，只保留原命令和验收标准
- 文件读取不足 → 补 `Read first`
- 编译/测试错误 → 明确验证命令和目标范围
- 运行错误 → 补启动顺序、依赖、环境说明

## 5. 浏览器验收失败

### 常见症状

- 页面打不开
- 首屏白屏
- 布局明显错位
- 核心交互无响应
- 子会话没有执行浏览器检查

### 处理步骤

1. 先记录具体问题
2. 判断问题属于：
   - 页面未启动
   - 路由不对
   - 视觉布局错误
   - 交互错误
   - 浏览器工具不可用
3. 决定继续路径：
   - 问题清晰且局部 → 可再委托一轮
   - 问题已明显收敛到局部补丁 → 主代理直接接管更快

### 绝对不要做的事

- 不要把“构建通过”说成“页面完成”
- 不要把“浏览器不可用”当成默认免责
- 不要只写“看起来正常”这种模糊日志

## 6. 连续两轮失败

这是硬停止条件。

如果已经发生：

1. 第一次失败后修正模板/封包再试
2. 第二次仍失败

那么：

- 停止继续使用外部模型
- 主代理直接接管
- 向用户明确说明已回退到本地执行

不要在错误执行模式上无限打补丁。

## 推荐判断顺序

每次失败后按这个顺序判断：

1. **启动层** 有没有错
2. **方案 C provider 层** 有没有错
3. **方案 D 默认模型层** 有没有错
4. **执行层** 有没有错
5. **浏览器验收层** 有没有错
6. 是否已经达到 **两轮失败**

只有层级判断清楚，修复才会有效。
