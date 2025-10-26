# claude code 的任务提示工具

在 claude code 任务完成后，利用 hooks 配置，实现任务完成后全局提示。预期使用 window 的弹框提示用户任务已完成。

正在思考如何开发实现。

## 基本思路

发布一个包，然后每次 claude code 的 hooks 执行时，都直接使用该包的 npx 形式。直接使用 dist 文件，直接就能用的文件。

不能纯粹依靠 tsx 来直接运行 typescript，安装 claude code 插件市场时，是直接克隆仓库，但是不会默认安装依赖。所以直接使用 tsx 运行 hooks 插件是行不通的，因为没有上下游依赖。

所以只能选择保守的方案，发包，走 tsup 打包的流程。

## 参考对话

- https://gemini.google.com/share/857515862373
- https://github.com/copilot/share/02671392-0840-8470-a051-b84560024178

## 预设曼波语音

在完成任务后，播放默认的曼波语音。

## 封装配置文件到 claude code 插件配置内
