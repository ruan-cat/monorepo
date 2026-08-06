# OpenCode 裸启动参考

本文件是方案 D 的直接启动参考。它使用 OpenCode 自己的默认模型选择链，不配置 Anthropic provider，也不把 OpenCode 包装成 Claude Code。

## 最小 smoke check

在已经安装并登录 OpenCode 的当前 shell 中运行：

```powershell
opencode run --format json --variant max "只回答 OPENCODE_DEFAULT_MODEL_SMOKE_OK，不调用工具，完成后退出。"
```

这条命令：

- 省略 `--model`，让 OpenCode 根据本机配置和凭据选择默认内部模型；
- 使用 `--format json` 输出原始 JSON 事件；
- 使用 `--variant max` 请求当前默认模型支持的最高推理档位。模型或版本变化时，先用 `opencode models <provider> --verbose` 核实可用变体；
- 不使用 `--auto`，因为 smoke check 不需要工具权限。

## 无头任务启动

先在任务目录准备 `context-packet.md`，再运行 skill 内脚本：

```powershell
pwsh -File scripts/launch-opencode-headless.ps1 `
  -Workdir "<repo-root>" `
  -TaskDir "<repo-root>/.use-other-model/task-001" `
  -Variant max
```

脚本直接执行以下等价命令：

```powershell
opencode run `
  --format json `
  --auto `
  --variant max `
  --dir "<repo-root>" `
  "Act as an unattended coding agent. Read '<repo-root>/.use-other-model/task-001/context-packet.md' first, follow it exactly, verify the result, write execution-log.md, and exit without questions."
```

stdout 原样写入 `result.jsonl`，stderr 单独写入 `stderr.log`，脚本返回 OpenCode 的退出码。脚本不生成伪造状态、不扫描进程、不做 cleanup，也不注入 API key。

## 结果验收

退出码为 0 只证明 OpenCode 进程正常结束，不等于任务验收通过。主代理必须依次读取：

1. `result.jsonl` 中的原始事件、工具调用和 `step_finish.reason`；
2. 任务实际输出文件；
3. `execution-log.md`；
4. 独立验证命令结果。

## 与 provider 直连的边界

本文件不使用 `--model provider/model`、`ANTHROPIC_API_KEY` 或 `OPENCODE_CONFIG_CONTENT`。只有用户明确要求指定 provider/model 时，才转到方案 C 的 `opencode-provider-launch-templates.md`；不要把 provider 配置默认塞进裸启动模板。
