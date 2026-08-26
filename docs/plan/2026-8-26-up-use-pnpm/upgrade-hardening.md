# pnpm 全局升级与 approve-builds 加固实施计划

> **给后续 AI agent：** 本文是执行全局 pnpm 升级规范加固的实施计划。执行前先读取本文、全局 `use-pnpm/SKILL.md` 和当前机器的实时 pnpm 状态；不得把历史版本号当作当前事实。

**目标：** 将全局包升级、构建脚本审批和原生模块失败处理整理为一套可重复、可审计、可止损的 `use-pnpm` 工作流。

**架构：** 先盘点运行时、全局目录、registry、直接依赖和待构建脚本，再按“高频升级 / 按需升级 / 暂缓”分组处理。升级与 `approve-builds` 分离；审批采用最小白名单，原生编译失败时保留已写入的审批策略并停止继续重试。

**技术栈：** Windows PowerShell、Node.js、Corepack、pnpm 10、全局 pnpm workspace、`pnpm-workspace.yaml`。

## 全局约束

- 所有面向用户和 agent 的新增文档使用简体中文。
- 任何执行前先确认 `where.exe node`、`where.exe pnpm`、`where.exe corepack`、`node -v`、`pnpm -v`。
- 不使用 `pnpm up -L -g` 作为日常升级命令；只对经过分组的包执行 `pnpm update -g --latest <packages>`。
- `pnpm approve-builds -g` 不得默认使用 `--all`；必须交互选择明确白名单。
- `node-pty`、`bun`、语音采集等原生或平台相关包默认暂缓，除非用户明确需要并且工具链已验证。
- 不执行 `pnpm approve-builds` 以外的全局构建策略覆盖；不手写 `.modules.yaml`。
- 升级、审批、构建和运行验证分别记录命令、退出码和关键输出。
- 发现用户已有的全局包、配置或进程时，不删除、不回滚、不覆盖；只修改用户明确授权的全局依赖和 pnpm 生成文件。

---

## 一、已确认的机器事实（作为流程设计输入）

以下事实来自 2026-08-26 的一次真实 Windows 环境执行，后续 agent 必须重新核对，不得盲目复用版本号：

- Node.js：`v22.23.1`。
- pnpm：`10.34.5`；全局 `package.json` 曾声明 `pnpm@10.33.4`，存在版本漂移检查需求。
- `pnpm root -g`：`C:\Users\pc\AppData\Local\pnpm\global\5\node_modules`。
- 全局依赖区：`C:\Users\pc\AppData\Local\pnpm\global\5`。
- 内容寻址 store：`F:\store\pnpm\store\v10`。
- registry：`https://registry.npmmirror.com/`；一次 HEAD 测试约 1767ms，而 npm 官方源约 419ms，registry 延迟会显著影响全局升级耗时。
- 全局依赖规模：升级前约 43 个直接包，包含多个大型 AI CLI 和部署 CLI。
- `pnpm approve-builds -g` 的一次真实编译曾因 `node-pty` 触发 Visual Studio `MSB8040`：缺少 Spectre-mitigated Libraries。
- 交互审批完成后，即使后续构建进程被中断，pnpm 的 `onlyBuiltDependencies` 仍可能已经写入；验收必须分别检查策略文件和构建结果。

## 二、包分层与审批基线

### 2.1 高频升级包

建议每周检查，遇到安全公告或关键功能发布时立即升级：

```text
@openai/codex
@anthropic-ai/claude-code
@google/gemini-cli
@qwen-code/qwen-code
opencode-ai
@kilocode/cli
@deepseek-ai/dsh
@mimo-ai/cli
@musistudio/claude-code-router
agent-browser
memorix
skills
```

### 2.2 构建脚本审批的建议白名单

只有下列包在确认实际用途后才进入审批选择：

```text
agent-browser
opencode-ai
workerd
@deepseek-ai/dsh-subprocess-local
@kaitranntt/ccs
@kilocode/cli
@larksuite/cli
@mimo-ai/cli
koffi
```

选择理由：前三项分别对应浏览器自动化、OpenCode CLI 和 Wrangler 本地运行时；其余项目是本地子进程、原生 FFI 或 CLI 自身安装脚本。它们不是“看到就必须批准”，而是“使用对应功能时有明确价值”。

### 2.3 默认暂缓或忽略

```text
node-pty
bun
@qwen-code/audio-capture
@google/genai
@fission-ai/openspec
```

说明：`node-pty` 当前已知会触发 Spectre 库缺失的 C++ 编译失败；`bun` 和音频采集属于平台能力；`@google/genai` 通常不需要本机原生构建；OpenSpec 当前已有明确的 ignored policy。除非用户提出具体功能需求并完成工具链预检，否则不要批准。

## 三、后续 agent 的执行步骤

### 任务 1：实时盘点与备份

**文件/配置：** 全局 pnpm 目录及其 `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`。

- [ ] 执行并保存以下只读信息：

```powershell
where.exe node
where.exe pnpm
where.exe corepack
node -v
pnpm -v
pnpm config get registry
pnpm config get global-dir
pnpm config get store-dir
pnpm config get virtual-store-dir
pnpm store path
pnpm root -g
pnpm bin -g
pnpm list -g --depth 0
```

- [ ] 将全局 `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml` 复制为同目录 `.bak` 文件；备份路径必须由 `pnpm root -g` 动态计算。
- [ ] 检查是否存在多个 `pnpm` 来源或 Corepack/NVM Desktop 路径混用。

### 任务 2：分批升级高频包

- [ ] 使用分批命令，避免一次解析全部全局依赖：

```powershell
pnpm update -g --latest @openai/codex @anthropic-ai/claude-code @google/gemini-cli @qwen-code/qwen-code
pnpm update -g --latest opencode-ai @kilocode/cli @deepseek-ai/dsh @mimo-ai/cli
pnpm update -g --latest @musistudio/claude-code-router agent-browser memorix skills
```

- [ ] 每批记录退出码、实际升级版本、deprecated/peer dependency 警告和 bin shim 警告。
- [ ] 发现某批脚本卡住时，只等待两次状态检查；无进展则中断该批并保留日志，不要连续盲目重试。
- [ ] 版本号为精确 pin 的包只有在用户明确要求时才使用 `--latest` 越过 pin。

### 任务 3：选择性执行全局 approve-builds

- [ ] 先运行 `pnpm approve-builds -g`，确认交互列表与实时待审批列表一致。
- [ ] 仅选择任务 2.2 的白名单；不得选择任务 2.3 的暂缓项。
- [ ] 不使用 `pnpm approve-builds -g --all`，因为它会把无关原生脚本一并放开。
- [ ] 确认后观察每个 postinstall/install 脚本；出现原生编译错误时立即停止继续构建。
- [ ] 中断后仍检查全局 `pnpm-workspace.yaml`：审批策略是否已经写入，不能把“策略写入成功”和“所有构建成功”混为一谈。

### 任务 4：升级后的最小验收

- [ ] 执行：

```powershell
pnpm list -g --depth 0
pnpm root -g
pnpm bin -g
pnpm store path
pnpm config get virtual-store-dir
```

- [ ] 对高频 CLI 做版本烟雾检查，例如：`codex --version`、`claude --version`、`gemini --version`、`opencode --version`、`agent-browser --version`、`memorix --version`、`skills --version`；若命令名不同，先从对应 package 的 bin 字段确认。
- [ ] 检查 `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 与 `ignoredBuiltDependencies` 是否符合白名单，不出现意外的绝对 `virtual-store-dir`。
- [ ] 检查全局 bin shim 是否存在；对 bin 创建失败的包单独记录，不通过重复升级掩盖问题。
- [ ] 输出“包升级成功 / 审批策略写入成功 / 构建脚本执行成功 / CLI 可运行”四个独立结论。

### 任务 5：逐包 rebuild 定位长时间无输出

`pnpm rebuild` 不支持 `-g` 参数。验证全局包时，先进入 `pnpm root -g` 返回路径的父目录，再一次只执行一个包：

```powershell
$globalDir = Split-Path -Parent (pnpm root -g)
Push-Location $globalDir
try {
  pnpm rebuild agent-browser --reporter append-only
  pnpm rebuild opencode-ai --reporter append-only
  pnpm rebuild workerd --reporter append-only
  pnpm rebuild '@deepseek-ai/dsh-subprocess-local' --reporter append-only
  pnpm rebuild '@kaitranntt/ccs' --reporter append-only
  pnpm rebuild '@kilocode/cli' --reporter append-only
  pnpm rebuild '@larksuite/cli' --reporter append-only
  pnpm rebuild '@mimo-ai/cli' --reporter append-only
  pnpm rebuild koffi --reporter append-only
}
finally {
  Pop-Location
}
```

执行纪律：

- [ ] 不把上述命令合并成一条批量 rebuild；每个包单独记录开始时间、结束时间、退出码和最后一行输出。
- [ ] 单包约 30 秒无新输出时停止该包，并记录为“候选卡点”；不要继续等待，也不要立刻扩大审批范围。
- [ ] 本次实测 9 个包均在约 0.43–0.52 秒内退出码为 `0`，没有发现单个脚本长时间卡住。
- [ ] `node-pty` 不纳入本清单：它此前已知会触发 Visual Studio `MSB8040`，属于独立的原生工具链问题。
- [ ] 若所有单包 rebuild 都快速成功，而批量 `approve-builds` 仍无输出，应将问题归类为 pnpm 收尾、链接或子进程清理阶段，不得武断归因给最后显示的包。

## 四、失败分流规则

### registry 或网络慢

- 记录当前 registry 和单包请求延迟。
- 只在用户授权后切换 registry；切换后重新执行一个小包的 `pnpm view <pkg> version` 验证。
- 不把“解析很慢”误判成原生编译失败。

### `MSB8040`、node-gyp、MSBuild 失败

- 标记为原生工具链问题，不继续扩大审批范围。
- 对 `node-pty` 这类包保持暂缓；记录缺少的 Visual Studio 组件。
- 不删除全局依赖树，不手改 `.modules.yaml`，不使用绝对 `virtual-store-dir` 绕过错误。

### approve-builds 命令退出码非零

- 先区分：用户中断、脚本构建失败、交互输入失败、权限/路径失败。
- 读取 `pnpm-workspace.yaml` 判断审批策略是否已持久化。
- 只有在修复具体根因后，才对相关包单独执行 `pnpm rebuild -g <package>` 或重新安装；禁止用 `--all` 兜底。

### peer dependency 警告

- 记录警告所属顶层包和版本。
- 不因为 peer warning 自动回滚整个全局升级；只有 CLI 实际启动失败时才进一步处理。

## 五、需要回填全局 `use-pnpm` 技能的内容

后续 agent 修改 `C:\Users\pc\.agents\skills\use-pnpm\SKILL.md` 时，至少补充以下稳定规则：

1. 新增“全局升级品味”章节：禁止日常 `pnpm up -L -g`，采用分组 `pnpm update -g --latest`。
2. 新增“approve-builds 最小白名单”章节：交互选择明确包，禁止默认 `--all`。
3. 新增“升级与审批分离”章节：包版本升级成功不等于构建脚本审批成功。
4. 新增“原生模块止损”章节：`node-pty`、`koffi`、`onnxruntime-node` 等必须先做工具链和功能需求判断。
5. 新增“策略持久化验收”章节：检查全局 `pnpm-workspace.yaml`，区分 `onlyBuiltDependencies` 和 `ignoredBuiltDependencies`。
6. 新增“中断后的闭环”章节：记录退出码和剩余脚本，不因部分成功声称全流程成功。
7. 保留现有 Corepack、NVM Desktop、global-dir、store-dir、virtual-store-dir 规则，不用本次文档中的机器专属路径替换通用占位符。

## 六、完成判定

只有同时满足以下条件，后续 agent 才能报告“升级规范加固完成”：

- 高风险高频包已按分组命令升级，并有每批退出码和版本证据。
- `9router` 等明确要求移除的包不再出现在 `pnpm list -g --depth 0`。
- 审批策略只包含经确认的白名单，暂缓包仍未被批准。
- 原生构建失败已被准确归因，未通过扩大审批范围掩盖。
- 全局 bin、核心 CLI 版本和 `pnpm list -g` 验收通过。
- `use-pnpm/SKILL.md` 的新增规则可迁移，不包含本机绝对路径、临时版本号或未经验证的“全部成功”结论。
