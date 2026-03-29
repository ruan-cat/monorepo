# Codex 配置文档

本文档说明如何在 Codex CLI 场景下接入 `@ruan-cat/claude-notifier`，让 Codex 在任务完成或需要你回来处理时发送 Windows 系统通知。

## 适用场景

- 你在使用 `codex` CLI，而不是 Claude Code hooks
- 你希望 Codex 结束一轮处理后发系统通知
- 你希望 Codex 需要你确认、补充信息或回来查看结果时发提醒

## 工作原理

Codex 本身不会直接调用 `@ruan-cat/claude-notifier`。

推荐接法是三层：

1. Codex CLI 在 `~/.codex/config.toml` 中通过 `notify = [...]` 配置一个外部脚本
2. 外部脚本接收 Codex 传入的 JSON payload
3. 该脚本再调用 `claude-notifier task-complete` 或 `claude-notifier interaction-needed`

也就是说：

- Codex 负责在合适的事件点执行外部命令
- `codex-notify-ccntf.ps1` 负责解析 payload
- `@ruan-cat/claude-notifier` 负责真正展示 Windows 通知

## 前置条件

推荐先全局安装 `@ruan-cat/claude-notifier`，这样脚本里可以直接调用短命令 `claude-notifier`：

```bash
pnpm add -g @ruan-cat/claude-notifier
```

也可以使用 npm：

```bash
npm install -g @ruan-cat/claude-notifier
```

安装后先手动验证：

```bash
claude-notifier task-complete --message "Codex 通知测试"
```

如果这一步没有弹出系统通知，先不要继续排查 Codex，先确认 `claude-notifier` 本身可用。

## 配置文件位置

Codex 的用户级配置文件位置：

```plain
Windows: %USERPROFILE%\.codex\config.toml
macOS/Linux: ~/.codex/config.toml
```

本文档聚焦 Windows + PowerShell 的接入方式。

## 推荐配置

### 1. `config.toml` 关键配置

在 `%USERPROFILE%\.codex\config.toml` 中增加或确认以下内容：

```toml
notify = [
  "powershell.exe",
  "-NoProfile",
  "-ExecutionPolicy",
  "Bypass",
  "-File",
  "C:\\Users\\你的用户名\\.codex\\codex-notify-ccntf.ps1"
]

[tui]
notifications = ["approval-requested", "agent-turn-complete"]
notification_method = "auto"
```

说明：

- `notify` 指定 Codex 在通知事件发生时执行的外部命令
- `agent-turn-complete` 表示 Codex 完成一轮处理时触发
- `approval-requested` 表示 Codex 需要你回来处理时触发
- `notification_method = "auto"` 让 TUI 使用当前平台的默认通知方式

### 2. `codex-notify-ccntf.ps1` 脚本

将以下脚本保存到 `%USERPROFILE%\.codex\codex-notify-ccntf.ps1`：

```powershell
param(
    [Parameter(Position = 0)]
    [string]$PayloadJson = ""
)

$ErrorActionPreference = "SilentlyContinue"

function Get-NotifyText {
    param(
        [Parameter(ValueFromPipeline = $true)]
        $Value
    )

    if ($null -eq $Value) {
        return ""
    }

    if ($Value -is [string]) {
        return $Value.Trim()
    }

    $properties = @("text", "message", "title", "content")
    foreach ($name in $properties) {
        $property = $Value.PSObject.Properties[$name]
        if ($property) {
            $text = Get-NotifyText $property.Value
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                return $text.Trim()
            }
        }
    }

    if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
        $parts = New-Object System.Collections.Generic.List[string]
        foreach ($item in $Value) {
            $text = Get-NotifyText $item
            if (-not [string]::IsNullOrWhiteSpace($text)) {
                $parts.Add($text.Trim())
            }
        }

        return [string]::Join(" ", $parts).Trim()
    }

    return [string]$Value
}

if ([string]::IsNullOrWhiteSpace($PayloadJson) -and $args.Count -gt 0) {
    $PayloadJson = [string]$args[0]
}

if ([string]::IsNullOrWhiteSpace($PayloadJson)) {
    exit 0
}

try {
    $payload = $PayloadJson | ConvertFrom-Json
} catch {
    exit 0
}

if ($payload.type -notin @("agent-turn-complete", "approval-requested")) {
    exit 0
}

$message = ""
$lam = $payload."last-assistant-message"
$ims = $payload."input-messages"
if ($lam) {
    $message = Get-NotifyText $lam
} elseif ($ims) {
    $message = Get-NotifyText $ims
} else {
    $message = "Codex 已完成当前处理，请回到终端查看。"
}

$message = $message.Trim()

$taskDescription = ""
if ($payload.cwd) {
    $taskDescription = [string]$payload.cwd
}

$shortMessage = $message
if ($shortMessage.Length -gt 120) {
    $shortMessage = $shortMessage.Substring(0, 120) + "..."
}

$needsInteraction = $payload.type -eq "approval-requested"

$interactionPatterns = @(
    "\?",
    "请确认",
    "请提供",
    "请回复",
    "请回答",
    "请选择",
    "需要你的",
    "需要您",
    "等待你的",
    "等待您",
    "还需要",
    "缺少",
    "无法继续",
    "需要审批",
    "需要批准",
    "approve",
    "approval",
    "confirm",
    "choose",
    "select",
    "please provide",
    "please confirm",
    "need your input",
    "waiting for your input",
    "cannot continue"
)

foreach ($pattern in $interactionPatterns) {
    if ($message -match $pattern) {
        $needsInteraction = $true
        break
    }
}

if ($needsInteraction) {
    claude-notifier interaction-needed `
      --title "Codex - 需要你处理" `
      --message "Codex 正在等你回来处理" `
      --interaction-details $shortMessage `
      --sound warning `
      --icon alice/timeout.gif
} else {
    claude-notifier task-complete `
      --title "Codex" `
      --message $shortMessage `
      --task-description $taskDescription `
      --sound success `
      --icon success
}

exit 0
```

## 什么时候会通知

在上面的配置下，通常会在下面两类事件通知你：

- `agent-turn-complete`
  - Codex 完成一轮处理，已经把结果交回给你
  - 这是最常见的一类通知
- `approval-requested`
  - Codex 需要你回来处理
  - 例如确认、补充信息、查看结果、继续下一步

脚本还做了一层文本模式兜底。

即使事件类型本身是 `agent-turn-complete`，只要消息里出现如下语义，也会被视为“需要你处理”：

- 请确认
- 请提供
- 请选择
- need your input
- please confirm

这样做的原因是某些情况下 Codex 的文本回复已经明确要求你介入，但事件类型未必能完整表达这个语义。

## 为什么不能直接把 payload 强转成字符串

这是 Codex 场景下最容易踩的坑。

Codex 传给外部脚本的 `last-assistant-message` 或 `input-messages`，不一定总是纯字符串。有时它们是对象或对象数组。比如：

```text
@{title=Check Codex notify config}
```

如果你在 PowerShell 里直接写：

```powershell
$message = [string]$payload."last-assistant-message"
```

或者：

```powershell
$message = [string]::Join(" ", @($payload."input-messages"))
```

就可能把整个对象转成 `@{title=...}` 这种字符串，最终通知里会出现类似：

```text
{title:检查 Codex notify 配置}
```

上面提供的 `Get-NotifyText` 就是用来解决这个问题的。它会优先从结构里提取：

- `text`
- `message`
- `title`
- `content`

这样通知里展示的是可读文本，而不是对象的序列化残影。

## 常见问题

### 1. 通知完全不弹

先按顺序排查：

1. 手动执行：

```bash
claude-notifier task-complete --message "测试通知"
```

2. 确认 `%USERPROFILE%\.codex\config.toml` 里的 `notify = [...]` 路径正确
3. 确认 `%USERPROFILE%\.codex\codex-notify-ccntf.ps1` 实际存在
4. 重新打开一个新的 Codex 会话再测试

### 2. 通知里出现 `@{title=...}` 或 `{title:...}`

这是因为脚本把结构化对象直接转成了字符串。请使用上文的 `Get-NotifyText` 版本脚本，而不是简单的 `[string]` 强转版本。

### 3. 只有“完成”通知，没有“需要你处理”

先检查两点：

- `config.toml` 是否真的订阅了 `approval-requested`
- 脚本是否只处理了 `agent-turn-complete`

如果脚本里有类似下面这段：

```powershell
if ($payload.type -ne "agent-turn-complete") {
    exit 0
}
```

那它会直接忽略 `approval-requested`。

### 4. 很少收到 `approval-requested`

如果你的 Codex 配置是：

```toml
approval_policy = "never"
```

那么严格意义上的审批型事件本来就会少一些。此时更常见的是：

- 一轮处理结束后的完成通知
- 文本内容判断为“需要你回来处理”的提醒通知

## 推荐实践

- 推荐全局安装 `@ruan-cat/claude-notifier`，避免 `npx` 冷启动
- 推荐把脚本固定放在 `%USERPROFILE%\.codex\codex-notify-ccntf.ps1`
- 推荐同时订阅 `agent-turn-complete` 和 `approval-requested`
- 推荐脚本内优先提取结构化 payload 的文本字段，而不是直接把对象转字符串

## 相关文档

- 参考 [CLI 使用文档](./cli.md) 了解所有通知命令
- 参考 [Claude Code 配置文档](./claude-code.md) 了解 hooks 场景的集成方式
