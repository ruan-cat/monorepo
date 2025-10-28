<!--
	一次性提示词
	已完成 后续有拓展需求基本上会在这里新增并并迭代。
	但是对于本包来说，作为单一用途的小包，基本上不会继续更新迭代了。
 -->

# 制作基于 node npx 的通知工具

我需要做一个基于 node-notifier 包的通知工具，以 claude code hooks 配置的形式，在 claude code 完成一个任务后，就使用基于 node-notifier 的工具，实现在 window 系统内使用系统弹框，提示用户已完成 claude code 任务。

## 术语说明

- 通知包： 即本项目，`packages\claude-notifier` 内的 node 包。
- 工作目录： 即 `packages\claude-notifier` 目录。

## 业务要求实现细则

### 明确通知场景： claude code 通知场景

在以下场景内，你要实现 claude code 完成任务后，通知我。

1. 完成任务后提示： 完成 claude code 任务后。
2. 长任务定时提示： 任务时长定时提示。当任务已经执行了 6 分钟了，就出来提醒我，某个任务已经执行了 6 分钟了。按照 6 10 18 25 45 的时间间隔，定时提醒我某个长效任务的执行情况。
3. 连接超时提示： 在网络连接超时时，做出报错提示。
4. 其他错误提示： 出现其他种类的错误时，请及时提示。

### 明确业务范围： 不需要你设计具体的 hooks.json 写法

这是具体的 claude code 插件商城的写法，不是你负责的范畴，你只需要专注于实现一个具体有用的，基于 npx 命令行的 node 包

## 通知框交互行为

- 通知框默认时长： 2.5 秒
- 允许用户点击关闭。

## 技术要求实现细则

1. 纯 typescript 语言，不允许编写 javascript。
2. 构建工具使用 tsup 实现打包。
3. 本 node 包对外提供一个 bin 命令行，未来预期运行 `npx @ruan-cat/claude-notifier` 或 `npx ruan-cat-claude-notifier` 时，就能以命令
4. 必须设计一个 cli.ts 文件，实现命令行运行。
5. index.ts 文件仅仅负责对外导出，不要编写复杂逻辑。
6. 要求使用**参数**的方式，来满足不同通知场景的提示。在运行命令时，通过传递不同的参数，实现不同的通知框样式调整。
7. 关于项目的整体架构，你可以参考目录 `configs-package\commitlint-config` ，可以参考这个包的实现方式。请你先整体性的阅读这个包，以这个包为参考，做整体性的架构设计。

## 后续跟踪修改需求

### 01

1. CLI 命令参数设计方案： 方案 B：使用子命令区分场景
2. 长任务定时提示的实现方式：
   - Claude Code 的 hooks 能够在任务执行中间定时调用吗？我也不清楚，请你自己去查阅相关资料。如果可以定时调用，那么就设计好预留的参数给 claude code 调用即可。如果没有，那我们自己内部实现一个简单的定时器。
   - 不需要设计多余的 start-timer 和 stop-timer 命令来控制。
   - 是累计时间。不是间隔时间。
3. 通知参数的详细配置：
   - 通知标题，可以自定义。但是我希望你实现的时候，直接预设好标题就行。预期绝大多数情况下不需要你设置标题。
   - 通知时长，默认 2.5 秒，不做调整了。就默认 2.5 秒。
   - 播放声音，默认 true。使用 window 系统内默认的通知音响，并且允许配置一套预设，请你设计一个音响预设配置。比如配置字符串 'manbo' ，就会读取指定目录内的音频文件。你还要多提供一个参数，让我可以给每个通知自定义预设好的音响。
   - 通知图标路径，需要。
   - 目前我就想到这么多需要被支持的参数，未来我很可能会让你继续增加新的参数。
4. 与现有代码的关系：毫无关系，你直接把 notify.ts 和 setup.ts 删掉，按照你的设计来重做代码。
5. 包的文档和示例： 就按照你说的，在 README 中提供。但你不要删掉现在 README 已有的内容，先留着，等我以后来删改调整即可。

### 02

1. 音频文件的组织方式： B. 文件夹方式
2. 如何选择使用哪个文件： C. 允许指定
3. 音频文件格式： 我偏好 .mp3 格式。

### 03 重构编写文档

请帮我重构文档，便于后续阅读

- packages\claude-notifier\src\docs\architecture.md 编写整个项目的文件架构体系，便于阅读了解整个架构体系。
- packages\claude-notifier\src\docs\use\api.md 以 api 形式使用 `@ruan-cat/claude-notifier` 包的完整例子。
- packages\claude-notifier\src\docs\use\cli.md 以 cli 命令行的形式使用本包的完整例子。
- packages\claude-notifier\src\docs\use\claude-code.md 在 claude code 相关的配置文件，配置本包的完整例子。
- packages\claude-notifier\src\docs\how-to-add-assets.md 如何添加静态资源的文档，请你适当的拆分，精简 `packages\claude-notifier\src\assets\README.md` 文件的说明。

请适当地拆分 packages\claude-notifier\README.md ，将主 README.md 的内容拆分到上述的文件内，并补充上述文档的例子说明。

### 04 处理故障

针对 `packages\claude-notifier\package.json` 的命令：

- 生产环境命令 test:cli:task-complete:alice-icon:prod
- 开发环境命令 test:cli:task-complete:alice-icon

在运行生产环境命令时，会出现无法找到图片和音频的错误。请注意控制台输出的结果，判别清楚故障原因，并修复该故障。确保运行生产环境命令时，能够正常使用 assets 内的资源。

### 05 将默认的图标设置成小爱丽丝版本

~~将 icon 输出的结果，设置成 packages\claude-notifier\src\assets\icons\alice 目录下提供的动态图。~~

~~在使用通知时，如果不提供任何 icon 参数时，就默认使用 alice 预设。~~

~~请你更改 packages\claude-notifier 包相关的逻辑。~~

**✅ 已完成 (2025-10-28)**

已将默认图标设置为 Alice 版本：

- task-complete: 默认使用 `alice/success.gif`
- error: 默认使用 `alice/error.gif`
- timeout: 默认使用 `alice/timeout.gif`
- long-task: 默认使用 `alice/timeout.gif`

相关变更：

1. 在 `IconPreset` 枚举中添加了 `ALICE_SUCCESS`, `ALICE_ERROR`, `ALICE_TIMEOUT` 三个新预设
2. 更新了所有命令的默认图标参数
3. 更新了 CLI 帮助文档，添加了 alice 图标预设说明
