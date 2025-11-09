# 思考

开发本包的思考

## 动机： 为什么要做这个包？

我高强度的使用 claude code，需要一个工具实现任务完成后的通知，并用 AI 总结任务报告内容。

## 询问 AI 并确定大概的思路

- https://gemini.google.com/share/857515862373
- https://github.com/copilot/share/02671392-0840-8470-a051-b84560024178

经过询问，可以初步设定思路，做一个 node 包，用 node 包来调用 node-notifier ，实现在 window 系统内通知。在 claude code 的 hooks 配置内完成调用。

## 在 hooks 内不能直接调用 typescript 文件

每次 claude code 的 hooks 执行时，都直接使用该包的 npx 形式。直接使用 dist 文件，直接就能用的文件。

不能纯粹依靠 tsx 来直接运行 typescript，安装 claude code 插件市场时，是直接克隆仓库，但是不会默认安装依赖。所以直接使用 tsx 运行 hooks 插件是行不通的，因为没有上下游依赖。

所以只能选择保守的方案，发包，走 tsup 打包的流程。

## 目前没办法播放语音

不清楚为什么。node-notifier 没办法播放预设的音响。

## 对其他竞品的思考

## termiClaude

- 仓库： https://github.com/xuemk/termiClaude

这个工具实现任务完成后的通知，是在内部的对话框内完成通知的，不是在 claude code 的 cli 内通知的。我的使用习惯是在 claude code 内以 cli 完成对话和沟通的，不可能用 termiClaude 提供的对话框来完成对话。

### mcp-windows-notify

- 仓库： https://github.com/timtoday/mcp-windows-notify

个人感觉这个工具有点怪异，不清楚这个工具是什么时候开始调用的？是完全依赖 AI 自主决定什么时候是任务完成，并自主通知的么？

不太信得过这种方案，因为这个完全取决于 AI 模型的智能情况。如果遇到智能程度不高的模型，估计无法主动实现触发 mcp。
