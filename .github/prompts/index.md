# 本项目的杂项提示词

## 本项目待办任务

- @ruan-cat/vercel-deploy-tool 运行时增加 dry 模式，干燥运行整个流程，不实际真的部署。模仿【turbo run build:docs --dry-run】的方式。
- 编写掘金文章，说明对 dry 模式的思考与设计。

## 01 统一设置 `themeConfig.editLink.pattern` 的取值

1. 阅读 `packages\vitepress-preset-config\src\docs\.vitepress\config.mts` 文件，以该配置文件的 `themeConfig.editLink.pattern` 为例子，重新设置整个项目全部的 `.vitepress\config.mts` 配置文件。
2. 配置文件的匹配地址为 `https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/:path` ，请你根据被配置的 package 子包文件位置，更替为正确的地址。
3. 根据 glob 匹配 `**/.vitepress/config.mts` ，全面地读取本项目全部的 vitepress 配置文件，设置 `themeConfig.editLink.pattern` 。

## 02 处理打包错误

`@ruan-cat/vitepress-preset-config` 包的 build 命令会出现错误，请帮我修复该错误。

你也可以运行根包的 build 命令来检查错误。

## 03 制作基于 turbo 的 prebuild 命令，统一封装全体子包的 automd 运行命令

请你在 turbo.json 内，为全部的 "prebuild" 命令，制作一个全局的 turbo 任务，预期在运行 turbo 的 build 任务前，先完成 turbo 的 prebuild 任务。

## 04 处理 claude code 钩子错误 `task-complete-notifier.sh` 缺失 CLAUDE_PROJECT_DIR 的报错

```log
  ⎿ Stop says: Plugin hook error:
    C:\Users\pc\.claude\plugins\marketplaces\ruan-cat-tools\claude-code-marketplace\common-tools/scripts/task-complete-notifier.sh: line 72:
    CLAUDE_PROJECT_DIR: unbound variable

  ⎿ Stop says: Plugin hook error:
    C:\Users\pc\.claude\plugins\marketplaces\ruan-cat-tools\claude-code-marketplace\common-tools/scripts/task-complete-notifier.sh: line 72:
    CLAUDE_PROJECT_DIR: unbound variable
```

这些报错是来自于 C 盘的，其本质就是本项目的配置出错了。请你检查本项目的 `scripts/task-complete-notifier.sh` ，修复该故障，并确保 claude code 插件使用本 hooks 时，不会再出现以上的错误。

## 05 处理 claude code 通知钩子每次都重复运行两次的故障

请阅读 `claude-code-marketplace\common-tools\hooks\hooks.json` 配置。这是一个 claude code 的插件商城的插件，用于实现定时执行通知，我注意到每次执行钩子的时候，都会执行两次钩子。请问多余的钩子是哪里来的？claude code 是怎么合并我安装的插件商城的钩子的？

我在运行 claude code 时，经常会出现这样的情况。这是怎么一回事啊？

`Running PostToolUse hooks… (1/2 done)`

## 06 检查无头模式下 gemini 的输入数据，和输出结果，并排查为什么 gemini 每次总结时，总结文本都只有五个字：`任务已完成`

阅读：

- claude-code-marketplace\common-tools\scripts\task-complete-notifier.sh
- claude-code-marketplace\common-tools\hooks\hooks.json 的 `bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh` 部分

这是一个 claude code 插件，这个插件预期在 Stop 钩子执行时，收集对话和思考的全部上下文，并交给本地的 gemini 执行总结，以无头形式完成总结。

1. 帮我制作一个机制，确保每次输入的数据都能够写入到当前电脑合适的日志存储位置，以日志的形式，存储 `task-complete-notifier.sh` 运行时的全部数据。
   - 这些数据包括：
     - 输入的上下文
     - 运行时的日志
     - 输出的结果
2. 请你帮我在当前用户电脑的 `C:\Users\pc\AppData\Local\Temp` ，即用户的 `AppData\Local\Temp` 文件夹内，新建一个名为 `claude-code-task-complete-notifier-logs` 的文件夹。在这个文件夹内存储 `task-complete-notifier.sh` 产出的日志文件。
3. 日志文件的名称命名格式： `YYYY-MM-DD__HH:mm:ss__当前运行hooks的目录地址，且不包含非法字符的地址` 。
4. 从 claude code 的 hooks 的 stdin 的 JSON 数据内获取到，cwd 数据，进而帮助你拼接目录地址。请阅读文档： https://docs.claude.com/en/docs/claude-code/hooks 了解输入数据 stdin 的格式。
5. 帮我认真排查一下，为什么我在以无头模式运行 gemini 时，总结的文本总是只有五个字：`任务已完成` 。这个很不符合我的期望，总结效果很差。
6. 帮我认真调研思考一下，为了完成短时间内的总结与通知效果，使用 `gemini-2.5-flash` 模型合适么？我可以换成别的 `gemini-2.5-pro` 模型么？运行速度会不会太慢？请你确保在 5 秒的时间预算内，使用合适的模型，取得最好的模型总结效果。

### 更改文档

适当阅读：

- claude-code-marketplace\common-tools\README.md
- claude-code-marketplace\common-tools\CHANGELOG.md

1. 为本次修改及时更新说明文档。
2. 更新 claude code 插件的版本号。

## 07 排查为什么电脑有那么多未关闭的 npx

如下图所示：

![2025-11-03-22-36-12](https://s2.loli.net/2025/11/03/aZN7IuxryEofFnY.png)

自从我使用了 `@ruan-cat/claude-notifier` 包，以 `pnpm dlx @ruan-cat/claude-notifier ...` 的方式高强度调用该工具时，我 window 电脑就出现了好多未关闭的 npx 。

这是怎么一回事呢？为什么会出现这种情况？多个未关闭的 npx 确定和 `@ruan-cat/claude-notifier` 包有关系么？

## 08 ~~处理 `● Stop hook prevented continuation` 故障提示~~ ✅ 已解决

**问题描述：**

在使用 claude code 插件时，出现提示 `● Stop hook prevented continuation`，导致 Claude Code 无法继续执行。

![2025-11-03-23-03-59](https://s2.loli.net/2025/11/03/gDTIvcAUodlhQup.png)

**根本原因分析：**

1. **`tee` 命令导致 I/O 阻塞**
   - 在 Gemini API 调用中使用 `2>&1 | tee -a "$LOG_FILE"` 同时记录日志和捕获输出
   - 管道阻塞导致脚本挂起

2. **`pnpm dlx` 调用挂起**
   - 通知器调用使用 `pnpm dlx` 可能需要下载包
   - Windows Git Bash 中 `timeout` 命令不可靠

3. **缺少全局错误处理**
   - 没有错误陷阱确保脚本总是返回成功
   - 异常时阻塞 Stop hook

**修复方案（已实施）：**

1. **移除 `tee` 命令，改用分离的日志记录方式**

   ```bash
   # 修复前（会阻塞）
   SUMMARY=$(timeout 5s gemini ... 2>&1 | tee -a "$LOG_FILE" | head -n 1)

   # 修复后（不阻塞）
   GEMINI_OUTPUT=$(timeout 5s gemini ... 2>&1 || echo "")
   echo "$GEMINI_OUTPUT" >> "$LOG_FILE" 2>/dev/null || true
   SUMMARY=$(echo "$GEMINI_OUTPUT" | head -n 1 | tr -d '\n')
   ```

2. **通知器后台运行，避免阻塞主流程**

   ```bash
   # 修复后：后台运行，不等待完成
   (
     cd "$PROJECT_DIR" 2>/dev/null || cd /
     timeout 8s pnpm dlx @ruan-cat/claude-notifier@latest task-complete --message "$SUMMARY" >> "$LOG_FILE" 2>&1
   ) &
   log "Notifier started in background (PID: $!)"
   ```

3. **添加错误陷阱，确保总是返回成功**

   ```bash
   trap 'log "Script interrupted, returning success"; echo "{\"decision\": \"proceed\"}"; exit 0' ERR EXIT
   ```

4. **优化超时时间，确保快速返回**
   - Gemini flash: 5s
   - Gemini pro: 5s
   - Default model: 4s
   - 通知器: 8s（后台）

**测试结果：**

- ✅ 脚本能在约 17 秒内完成
- ✅ 返回有效的 JSON 输出：`{"decision": "proceed", "additionalContext": "..."}`
- ✅ 即使 Gemini 和通知器失败，也能正常返回
- ✅ 不再阻塞 Claude Code

**相关文件：**

- claude-code-marketplace/common-tools/scripts/task-complete-notifier.sh:6-273

## 09 修复上下文缺少的故障

阅读：

- `claude-code-marketplace\common-tools\scripts\task-complete-notifier.sh`
- `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs` 目录内的全部日志文件。

我希望 `task-complete-notifier.sh` 作为 claude code 的插件，实现运行完毕后根据完整的对话上下文

1. 帮我调研一下，怎么利用 claude code 的钩子系统，获取到足量的，全部的上下文，并写入到日志内？请帮我调研这个机制。
2. 请帮我设计好一个合适的机制，如果你需要设计出多个 sh 脚本协作完成任务，请说明你的设计。
3. 如果你需要再 claude code 钩子的不同阶段内，获取到全量足量的上下文，请跟我说明你的想法和设计。
4. 我的最终需求是，在一轮完整的 claude code 对话内，你实现一个对话上下文记录机制，写入到日志文件内，并最终调用 gemini，或者是其他 cli 机制的无头调用的本地模型，实现短时间内简短的内容总结。

### 01 回答 AI 的问题

改进的钩子入口机制：

1. 在 UserPromptSubmit 钩子记录用户输入，和初始化会话日志。
2. 在 Stop 钩子记录 agent 响应，并生成 gemini 总结。

适当的压缩合并你设计的 sh 脚本。

使用多钩子方案，但是你只使用这两个钩子。

问题：

1. 怎么利用钩子系统获取全量上下文？
   - 使用 transcript_path 字段读取 JSONL 文件
   - 提取用户输入、Agent 响应
2. 需要多个脚本协作。是的。
3. 在哪个钩子阶段获取上下文？
   - 仅仅两个钩子： UserPromptSubmit 和 Stop 。
4. 调用模型生成总结的机制？
   - Gemini CLI（优先）
   - 关键词提取（兜底）
   - 不考虑本地的 Ollama/LM 。因为不是大多数人本地都准备好了 Ollama/LM 。

### 02

1. 仅保留一个 README.md 文件。将 `claude-code-marketplace\common-tools\scripts\README.md` 相关的介绍，适当的迁移，删减，移动到 `claude-code-marketplace\common-tools\README.md` 文件内。最后删除掉 `claude-code-marketplace\common-tools\scripts\README.md` 文件。
2. 去添加钩子，而不是删改原本就配置好的钩子。对于 `claude-code-marketplace\common-tools\hooks\hooks.json` 钩子配置文件，本来就准备好一些钩子了，你只增加需要的钩子。
3. 对于 `claude-code-marketplace\common-tools\hooks\hooks.json` 钩子配置文件，其说明文本，我不想看到关于什么 V2 版本的说明。我不喜欢看到专门划定出来的 V2 版本。
4. 不要新增加一个独立的 `task-complete-notifier-v2.sh` 文件。你就直接删改原本就有的 `task-complete-notifier.sh` 文件即可。不需要你增加新的脚本。

### 03 做好 claude code 插件版本更新准备

1. 将本次更改，编写简单简要的更新日志，写入 claude-code-marketplace\common-tools\CHANGELOG.md 文件内。
2. 对于 claude code 插件 claude-code-marketplace\common-tools 和 .claude-plugin\marketplace.json 文件，请你按照本次更新的内容，更新版本号。
3. 将你的设计，思考，经验教训，编写成一份简要明晰的文档，写入到 docs\reports 内。报告 markdown 文件名称，要加上日期，小写英文名。报告用中文编写。

## 10 修复 claude code 钩子出现的故障

阅读以下日志：

```log
This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:
Error: Unknown hook decision type: proceed. Valid types are: approve, block
    at gc2 (file:///C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/@anthropic-ai+claude-code@2.0.32/node_modules/@anthropic-ai/claude-code/cli.js:3460:1222)
    at An5 (file:///C:/Users/pc/AppData/Local/pnpm/global/5/.pnpm/@anthropic-ai+claude-code@2.0.32/node_modules/@anthropic-ai/claude-code/cli.js:3467:238)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
```

该错误是在 claude code 钩子使用了新的脚本后出现的。对于 `claude-code-marketplace\common-tools\hooks\hooks.json` 的 UserPromptSubmit 钩子而言，现在确实实现了记录对话的信息，日志文件夹内也出现了期望的用户对话文本，也确实写入到日志内了。

但是这导致 claude code 内部出现故障了，请你分析故障日志，并帮我修复该故障。

请你重点处理以下文件，避免出现该错误：

- claude-code-marketplace\common-tools\scripts\user-prompt-logger.sh
- claude-code-marketplace\common-tools\scripts\transcript-reader.js
- claude-code-marketplace\common-tools\scripts\task-complete-notifier.sh

## 11 修复 claude code 钩子无法阅读有效的上下文日志的故障

<!-- TODO: 等待网络恢复了就开始处理 -->

请阅读以下日志的信息：

- `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs\2025-11-04__23-45-38__D__code_github-desktop-store_001-Smart-Community(nwt-q).log`
- `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs\2025-11-04__23-57-41__D__code_github-desktop-store_001-Smart-Community(nwt-q).log`
- `C:\Users\pc\AppData\Local\Temp\claude-code-task-complete-notifier-logs\2025-11-05__00-04-06__D__code_github-desktop-store_gh.ruancat.monorepo.log`

对于 `claude-code-marketplace\common-tools\scripts\task-complete-notifier.sh` 命令，在执行 `bash ${CLAUDE_PLUGIN_ROOT}/scripts/task-complete-notifier.sh` 时，出现故障，导致没办法阅读完整的上下文信息，进而导致 gemini 总结失败。

请你认真阅读相关逻辑，并确保运行 `claude-code-marketplace\common-tools\scripts\transcript-reader.js` 时不会出现类似的错误。

我希望你更改工具脚本代码的运行方式，在 `claude-code-marketplace\common-tools\scripts\task-complete-notifier.sh` 内：

1. transcript-reader.js 改写成纯 transcript-reader.ts 文件，改换成纯 typescript 文件。
2. 用当前机器预装好的全局 node 库 tsx 来运行 typescript 文件。
3. 通过直接运行 `tsx transcript-reader.ts` 的方式来运行 typescript 脚本文件。
4. 如果本机不存在 tsx 这个全局 node 包，请你直接放弃该方案，就当做是读取文件失败。并且将不存在全局 tsx 包的情况，写入到日志文件内，供未来复盘排查。
