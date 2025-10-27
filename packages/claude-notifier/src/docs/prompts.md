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
