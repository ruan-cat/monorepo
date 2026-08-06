# OpenCode 直连 provider 参考

本文件是方案 C 的直接启动参考。它显式配置 provider、endpoint 和模型，与方案 D 省略 `--model` 的裸启动内部模型路径并存。

## 最小 smoke check

在实际执行 `opencode run` 的同一个 PowerShell 会话中运行：

```powershell
$env:ANTHROPIC_API_KEY = "<api-key>"
$env:OPENCODE_CONFIG_CONTENT = '{"provider":{"anthropic":{"options":{"baseURL":"https://<anthropic-compatible-endpoint>/v1"}}}}'
opencode run --model "anthropic/claude-fable-5" "reply with ok"
```

执行边界：

- `ANTHROPIC_API_KEY` 承载认证信息，不得写入 skill、任务封包或日志；
- `OPENCODE_CONFIG_CONTENT` 显式覆盖 Anthropic 兼容 endpoint，公共模板只保留占位符；
- `--model provider/model` 是方案 C 的必要信号，用于验证用户指定 provider 和模型；
- `ANTHROPIC_MODEL` 不是 OpenCode 方案 C 的必需变量，不得加入启动门禁；
- 聊天消息里的 `$env:` 命令不会自动进入当前 PowerShell，必须在实际调用 shell 中重新注入。

## 可直接读取的脚本

在 skill 安装目录下运行：

```powershell
pwsh -File scripts/smoke-opencode-provider.ps1 `
  -Model "anthropic/claude-fable-5"
```

脚本只检查本次直连所需的两个环境变量，然后原样调用 OpenCode 并返回退出码。它不读取 `ANTHROPIC_MODEL`，不扫描进程，不做 cleanup，也不伪造结果。

## 与裸启动内部模型的边界

如果用户没有指定 provider、API key、baseURL 或 `--model provider/model`，而是要求使用 OpenCode 自身默认模型，转到方案 D，读取 `opencode-headless-launch-templates.md`。不要从 provider 失败自动改写成方案 D；两条路径验证的是不同能力。
