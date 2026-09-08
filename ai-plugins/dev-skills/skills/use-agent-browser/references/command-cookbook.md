# agent-browser 命令手册

> 本文是 use-agent-browser 技能的参考层：可直接复制的命令配方。所有命令语法以 `agent-browser skills get core` 的当前版本输出为最终权威——本文写法经过实测核对，但 CLI 演进后以 core 内容为准（历史上就出现过 `wait --time` 写法过期、改为裸毫秒参数的先例）。

## 1. 安装与自检

```log
npm i -g agent-browser              # 或 pnpm i -g agent-browser（pnpm 全局故障时遵循 use-pnpm 技能）
agent-browser install               # 首次准备浏览器
agent-browser install --with-deps   # Linux 补齐系统依赖
agent-browser doctor                # 启动链路自检；doctor --fix 自动修复
agent-browser upgrade               # 版本漂移时升级
agent-browser skills list           # 查看当前版本全部内置技能
agent-browser skills get core       # 动手前必读；--full 附完整命令参考与模板
```

任务超出普通网页时加载专项技能：`agent-browser skills get electron|slack|dogfood`（Electron 桌面应用、Slack 工作区、探索性测试/QA）。

## 2. 标准工作流

```log
agent-browser open <URL>                # URL 原样使用，禁止改写
agent-browser wait --load networkidle   # 导航后先等待
agent-browser get title                 # 读标题确认真实加载，防 404/保护页
agent-browser snapshot -i               # 交互快照，取 @eN 元素引用
agent-browser click @e1                 # 或 fill @e2 "text"、select、press、scrollintoview
agent-browser wait 1000                 # 固定等待用裸毫秒参数，不是 --time
agent-browser screenshot <task-prefix>-<step>.png
agent-browser eval "简单表达式"
agent-browser close                     # 任务结束必须收口
```

要点：

- 每次导航后固定节奏「等待 → 读标题 → 再操作」，不连续盲操作。
- `snapshot -i` 输出可访问性树与 `@eN` 引用；在自动化脚本中解析引用：`grep -oP '@e\d+' snapshot.txt`。
- 元素找不到时先重新 `snapshot -i`（页面变化后旧 `@eN` 引用会失效），不要对着过期引用反复点击。

## 3. 会话、profile 与登录态

```log
agent-browser --session <name> open <URL>                          # 命名会话
agent-browser --session <name> --restore open <URL>                # 启动并恢复状态
agent-browser session id --scope worktree --prefix <app>           # 稳定的 worktree 作用域会话 ID
agent-browser --profile <name> open <URL>                          # 复用用户 Chrome profile（涉及用户数据，先授权）
```

- Chrome 连接器模式（连接用户本机 Chrome）：需要 Chrome 扩展 + Native Messaging 就绪；Chrome 未运行时返回 "Browser is not available"——等待用户打开 Chrome 或明确授权，不得擅自拉起用户浏览器。
- 无头/自动化环境与会话：本机接管的实例必须登记端口、profile 目录、PID 与关闭策略（见案例集 `cases-process-governance.md`）。

### MCP 形态的工具集选择

MCP 挂载形态（`agent-browser mcp`）按场景裁剪工具集，避免全量工具挤占上下文：

```log
agent-browser mcp --tools core,network,state,tabs   # 日常推荐：导航/快照/交互 + 网络 + 状态 + 多 tab
agent-browser mcp --tools all                       # 全量：含 debug / react / mobile 等专项
agent-browser mcp --tools core                      # 轻量：仅导航/快照/交互/截图
```

- 纯页面验收选日常推荐档；需要拦截/HAR/cookies/storage 持久化时补 network/state；调试 React 应用才考虑全量。
- 具体工具集清单以 `agent-browser mcp --help` 与 `skills get core` 当前输出为准。

## 4. Windows 接管与降级配方

```log
# 配方 A（首选）：接管本机 Chrome —— 可证明浏览器来源、可见窗口验收
"C:\Program Files\Google\Chrome\Application\chrome.exe" --user-data-dir=<临时目录> --remote-debugging-port=9222
agent-browser --cdp 9222 open <URL>

# 配方 B：headless 降级 —— 自动启动反复失败时
chrome --headless=new --remote-debugging-port=9222
agent-browser connect 9222

# 配方 C：追加启动参数 —— 自动启动 exit code 3 / 无 DevToolsActivePort 时
agent-browser --args "--no-sandbox" open <URL>
```

- 动画密集页面（GSAP / Three.js / ECharts 循环动画）禁止使用配方 B：JS 驱动动画在无头模式以最高帧率运行，会打满 CPU。
- Chrome 安装路径因机器而异，以 `agent-browser doctor` 输出为准。

## 5. 等待配方

| 场景          | 命令                                                                                                          |
| :------------ | :------------------------------------------------------------------------------------------------------------ |
| 普通导航      | `wait --load networkidle`                                                                                     |
| 明确元素出现  | `wait_for_selector`                                                                                           |
| 固定间隔      | `wait 1000`（裸毫秒）                                                                                         |
| 动画/大屏稳定 | 先 `set viewport 1920 1080`，等 loading 消失与入场动画自然完成（首屏 8s 量级），再用 `eval` 轮询 DOM 数值序列 |

动画页轮询模板（`eval` 取数值序列，连续两次一致视为稳定；示例节奏：每 0.3s 采样一次、最多 40 次 ≈ 12s）：

```log
agent-browser eval "Array.from(document.querySelectorAll('.count-card .value')).map(el => el.textContent.trim()).join(',')"
```

SSR 水合判定模板：

```log
agent-browser eval "!!document.querySelector('#__nuxt').__vue_app__"     # true = 已水合
agent-browser eval "import(entrySrc + '?v=diag').catch(e => String(e))"  # 动态重执行 entry 抓真实模块错误
```

## 6. 调试配方

```log
agent-browser network requests        # 请求列表（按实际命令名以 skills get core 为准）
agent-browser console                 # console 输出
agent-browser errors --clear          # 清空后复验页面错误
agent-browser get count img           # 细粒度 DOM 统计
agent-browser get attr @e1 href       # 取元素属性
agent-browser get url                 # 当前 URL
```

- console 捕获不可靠或需要导入链定位时：playwright-core `connectOverCDP` 直连，监听 `Network.requestWillBeSent` 取 `params.initiator.url` 定位真实导入方——只定位到「哪个包崩了」不够，必须定位「谁导入了它」，否则会修错依赖。
- 接口验证记录 method、URL、status、关键响应字段；只捕获本轮触发的请求。
- 交互模拟纪律：先用 `snapshot -i` 确认按钮/表单/入口真实存在，再通过页面已有入口触发（click / fill / press）；不绕过 UI 直接改内部变量冒充用户行为——那证明的是脚本，不是页面。

### 受控验收：network route mock

对 AI 对话等不可预测的外部流式接口，用 network route 把真实请求替换为固定、可结束的流式响应（如 AI SDK 的 data-stream 格式），实现不依赖真实后端、可重复的纯前端受控验收：

```log
agent-browser network route <pattern> <固定可结束的响应>   # 具体语法以 skills get core 当前版本为准
```

- mock 响应必须带终止帧，否则页面永远处于流式状态，无法验收「完成」态。
- 受控 mock 只覆盖 UI 渲染与交互闭环；「真实后端/真实模型响应」的结论必须另做真实链路验收，两类证据分开记录，不得互相替代。

## 7. 常见命令速查

| 命令                                    | 用途                                       |
| :-------------------------------------- | :----------------------------------------- |
| `open <URL>`                            | 打开页面（URL 原样）                       |
| `snapshot -i`                           | 可访问性快照 + @eN 引用                    |
| `click / fill / select / press @eN`     | 元素交互                                   |
| `scrollintoview @eN`                    | 元素滚入视口（截图前必做）                 |
| `set viewport <w> <h>`                  | 设置视口（带空格，不是 set-viewport）      |
| `screenshot [name]`                     | 截图（默认落系统临时目录）                 |
| `wait --load networkidle` / `wait 1000` | 条件等待 / 固定等待                        |
| `get title / url / count / attr`        | 细粒度读取探针                             |
| `eval "expr"`                           | 页面内脚本（复杂脚本走 stdin/base64 入口） |
| `--session <name> --restore`            | 命名会话与状态恢复                         |
| `--cdp <port>` / `connect <port>`       | CDP 接管 / 连接已有浏览器                  |
| `doctor` / `upgrade` / `close`          | 诊断 / 升级 / 收口                         |
