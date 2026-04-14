# 方案 B:启动独立 Claude Code 会话

## 核心架构

下面这张图保留的是 **方案 B 的职责分层**,不是旧参数模板本身。

```plain
┌─────────────────────────────────────────────────────────────┐
│ 主会话 (当前会话)                                            │
│                                                              │
│  1. 分析任务需求                                             │
│  2. 写任务封包 / 验收标准                                    │
│  3. 生成启动模板与系统提示                                   │
│  4. 启动独立 Claude Code 会话                                │
│  5. 读取结果并重新验证                                       │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ 独立执行链路
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 子会话 (独立 Claude Code 进程)                              │
│                                                              │
│  1. 读取任务封包                                             │
│  2. 读取目标文件                                             │
│  3. 修改文件 / 执行命令                                      │
│  4. 运行验证                                                 │
│  5. 前端任务执行浏览器验收                                   │
│  6. 写 execution log 并退出                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 定位

方案 B 不是“再开一个聊天窗口”,而是启动一个 **无人值守的独立编码代理**。

这个子会话必须具备以下责任:

1. 自己先读任务封包
2. 自己读目标文件
3. 自己修改文件
4. 自己运行验证命令
5. 前端任务自己做浏览器检查
6. 自己写 execution log
7. 完成后退出

如果主代理无法把任务压缩成这样的执行契约,就不要使用方案 B。

## 已核实的 CLI 参数

本节基于 **2026-04-15** 在本机运行的 `claude --help` 与 `claude -p --help` 核实。

当前可用的关键参数包括:

- `-p, --print`
- `--permission-mode <mode>`
- `--tools <tools...>`
- `--output-format <format>`
- `--append-system-prompt <prompt>`

这意味着新的标准模板应优先使用:

- `claude -p`
- `--permission-mode bypassPermissions`
- `--tools default`
- `--output-format json`

而不是继续把 `--dangerously-skip-permissions` 当作默认起点。

## 关键技术点

### 1. 仍然需要绕过嵌套会话检查

方案 B 依旧依赖:

```bash
unset CLAUDECODE
```

这一步没有变,变化的是后续默认启动参数已经从旧的 `--dangerously-skip-permissions` 收敛到了 `--permission-mode bypassPermissions`。

### 2. 仍然是“主会话编排,子会话执行”

主会话负责:

- 拆解任务
- 写任务封包
- 生成启动模板
- 读取结果并复核

子会话负责:

- 实际读文件
- 改文件
- 跑命令
- 做验证

### 3. 文件仍然是通信媒介

虽然现在新增了任务封包和浏览器验收模板,但设计模式仍然是文件通信:

```plain
主会话编写:
  ├─ context-packet.md         # 任务封包
  ├─ unattended-system-prompt.txt
  └─ [可选] browser-verification.md

子会话读取和写入:
  ├─ context-packet.md
  ├─ execution-log.md
  └─ result.json
```

保留这层图例说明的目的,就是让使用者快速看懂“谁负责什么、通过什么交接”。

## 方案 B 的默认契约

### 1. 默认启动模式

- 使用 **非交互** 的 `claude -p`
- 让子会话收到完整任务后一次性执行
- 输出写入 JSON 结果文件和 execution log

### 2. 默认权限模式

- 使用 `--permission-mode bypassPermissions`
- 因为方案 B 的本质就是无人值守执行
- 仅在高风险场景下才主动降权

### 3. 默认工具集

- 使用 `--tools default`
- 不要再把工具能力留给子会话临场猜测

### 4. 默认输出格式

- 使用 `--output-format json`
- 这样主代理更容易读取执行结果和状态

### 5. 默认系统提示

- 通过 `--append-system-prompt` 注入硬约束
- 必须明确说明:不要反问、先读文件、先验证、完成后退出

## 必备输入

启动前主代理至少要准备:

1. **Provider 配置**
   - 见 `environment-variables.md`

2. **任务封包**
   - 见 `context-packet-template.md`

3. **启动模板**
   - 见 `claude-code-launch-templates.md`

4. **前端浏览器验收模板**
   - 如果任务涉及 UI、页面、组件、样式、交互
   - 见 `frontend-browser-verification-template.md`

5. **失败分流预案**
   - 见 `failure-routing.md`

## 标准工作流

### Step 1: 先判断任务级别和预算

- 简单任务:5 分钟以内
- 中等任务:10-20 分钟
- 复杂任务:20-45 分钟

如果任务超过 45 分钟仍无法拆分,不要直接硬上。

### Step 2: 写任务封包

主代理必须先写完整的任务封包文件。

封包内至少要写:

1. Working directory
2. Branch
3. Read first
4. Allowed edits
5. Do not do
6. Verification commands
7. Browser verification target
8. Required output log
9. Completion rule

### Step 3: 前端任务补浏览器验收要求

如果任务涉及页面或 UI,必须再补一份浏览器验收模板:

- URL
- 首屏加载标准
- 视觉对比目标
- 核心交互步骤
- 失败时如何记录

浏览器不可用时也必须写明原因。

### Step 4: 生成无人值守系统提示

系统提示至少要覆盖:

- 你是 unattended coding agent
- 不要反问,除非任务封包本身冲突
- 先读文件,再改代码,再跑命令,再验证
- 前端任务必须做浏览器检查
- 完成后立即退出

### Step 5: 使用标准启动模板

直接使用 `claude-code-launch-templates.md` 中的 PowerShell 或 Bash 模板。

默认命令核心骨架如下:

```bash
claude -p \
  --permission-mode bypassPermissions \
  --tools default \
  --output-format json \
  --append-system-prompt "<硬约束系统提示>" \
  "<主提示>"
```

### Step 6: 读取结果和 execution log

主代理至少需要读取:

- JSON 结果
- execution log
- 如果命令失败,还要读 stdout/stderr

### Step 7: 主代理重新验证

这一步不能省。

主代理必须重新:

1. 查看 `git diff`
2. 运行关键验证命令
3. 前端任务确认浏览器结果

只有这一步完成后,才能说任务完成。

## 浏览器验收规则

前端任务默认最少包含:

1. 打开本地 URL
2. 观察首屏是否加载
3. 检查是否有明显布局错误
4. 执行至少一个核心交互
5. 把观察结果写入 execution log

如果子会话跳过了这一步,主代理要把它视为 **验收不完整**,而不是“基本完成”。

## 超时与预算

建议主代理按阶段设置超时:

| 阶段       | 建议时长 |
| ---------- | -------- |
| 启动会话   | 2 分钟   |
| 编码执行   | 30 分钟  |
| 构建/测试  | 5 分钟   |
| 浏览器验收 | 5 分钟   |

复杂任务的 orchestrator 超时建议至少 15 分钟,通常按 30 分钟起配。

## 回退策略

### 启动失败

- 跑 `claude --help`
- 核实参数是否可用
- 核实 provider 环境变量
- 必要时退回兼容模式

### 执行失败

- 看 JSON 结果
- 看 execution log
- 看 stdout/stderr

### 浏览器验收失败

- 先记录具体视觉或交互问题
- 再决定继续委托,还是主代理直接接管

### 连续两轮失败

- 停止使用外部模型
- 主代理直接接管

详细流程见 `failure-routing.md`。

## 何时不该使用方案 B

1. 任务目标仍然模糊
2. 无法明确允许修改范围
3. 无法定义验证命令
4. 前端任务却没有浏览器环境和替代证据
5. 主代理没有时间重新复核

这些情况都说明当前更适合直接执行,而不是委托。
