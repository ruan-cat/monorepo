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
