# 全局 pnpm 升级与审批清单

本清单是可执行模板。执行前把 `<packages>` 替换为经过用途确认的包名；不要把历史机器版本或路径当作当前事实。

## 执行合同（低等级模型必读）

- 严格按章节顺序执行，一次只运行一个代码块；不要合并批次或跳过盘点。
- 每一步写入执行账本：`步骤 | 命令 | 退出码 | 关键输出 | 下一步`。退出码非零、路径为空、输出矛盾或命令无新输出时立即标记 `STOP`。
- 交互审批只选已确认用途的候选包；不确定就不选。禁止运行 `pnpm approve-builds -g --all`。
- 任何原生编译错误、超时或中断都保留日志和策略文件，停止整批重试；完成状态必须分别给出四项结论。

### 授权与前置条件

1. 用户未明确授权全局写操作时，只执行第 1 节；盘点完成后报告结果并请求授权，不得自行进入第 2 节。
2. 进入下一节前，账本中上一节的退出码必须是 `0`；否则保持 `STOP`。
3. `pnpm approve-builds -g` 出现交互选择时，暂停并把待选包列表交给用户确认；模型不得猜选、代选或声称“已审批”。
4. `<packages>`、`<package>` 只是占位符，不能原样运行。必须从本清单的已列包中选定具体名称，并把选定名称写入账本。

执行账本示例：

```text
1 | pnpm -v | 0 | 10.x | 继续第 1 节
2 | pnpm update -g --latest agent-browser | ? | 待记录 | 非零则 STOP
```

## 1. 运行时与全局区盘点

```powershell
where.exe node
where.exe pnpm
where.exe corepack
node -v
pnpm -v
corepack --version
pnpm config get registry
pnpm config get global-dir
pnpm config get store-dir
pnpm config get virtual-store-dir
pnpm store path
pnpm root -g
pnpm bin -g
pnpm list -g --depth 0
```

备份 `pnpm root -g` 返回目录的父目录中的 `package.json`、`pnpm-lock.yaml`，以及全局 `node_modules\.modules.yaml`，再进行写操作。

## 2. 高频包分组升级

每批单独执行并记录退出码、实际版本、deprecated/peer 警告和 bin shim 警告：

```powershell
pnpm update -g --latest @openai/codex @anthropic-ai/claude-code @google/gemini-cli @qwen-code/qwen-code
pnpm update -g --latest opencode-ai @kilocode/cli @deepseek-ai/dsh @mimo-ai/cli
pnpm update -g --latest @musistudio/claude-code-router agent-browser memorix skills
```

不要使用 `pnpm up -L -g` 扫描式升级；批次无进展时只进行两次状态检查，随后停止该批并保留日志。

## 3. 选择性审批

先运行交互命令，只有确认实际用途后才选择白名单包：

```powershell
pnpm approve-builds -g
```

候选白名单：`agent-browser`、`opencode-ai`、`workerd`、`@deepseek-ai/dsh-subprocess-local`、`@kaitranntt/ccs`、`@kilocode/cli`、`@larksuite/cli`、`@mimo-ai/cli`、`koffi`。

默认暂缓：`node-pty`、`bun`、`@qwen-code/audio-capture`、`@google/genai`、`@fission-ai/openspec`。禁止使用 `pnpm approve-builds -g --all` 兜底。

## 4. 策略与构建验收

无论审批命令成功、失败还是被中断，都检查策略是否已写入：

```powershell
$globalDir = Split-Path -Parent (pnpm root -g)
Get-Content (Join-Path $globalDir 'pnpm-workspace.yaml')
```

确认 `onlyBuiltDependencies` 仅含明确批准项，`ignoredBuiltDependencies` 保留暂缓项。策略写入成功不等于构建成功；遇到 `MSB8040`、node-gyp 或 MSBuild 错误，记录缺失组件并停止扩大审批范围。

## 5. 最小运行验证

```powershell
pnpm list -g --depth 0
pnpm root -g
pnpm bin -g
pnpm store path
pnpm config get virtual-store-dir
```

对已升级 CLI 按其 `bin` 字段执行版本检查，例如：

```powershell
codex --version
claude --version
gemini --version
opencode --version
agent-browser --version
memorix --version
skills --version
```

分别输出：包升级成功、审批策略写入成功、构建脚本执行成功、CLI 可运行。不要用单一“全流程成功”替代四项结论。

## 6. 单包 rebuild 卡点定位

`pnpm rebuild` 不接受 `-g`。进入全局区父目录后，一次只执行一个已批准包：

```powershell
$globalDir = Split-Path -Parent (pnpm root -g)
Push-Location $globalDir
try {
  pnpm rebuild <package> --reporter append-only
}
finally {
  Pop-Location
}
```

单包约 30 秒无新输出就停止并记录为候选卡点；不要继续盲等、扩大审批或把问题归因给最后显示的包。
