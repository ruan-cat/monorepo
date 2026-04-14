# 前端任务浏览器验收模板

只要任务涉及以下任一内容,就应附带这份模板:

- 页面
- 组件
- 样式
- 交互
- 图表
- 可视化布局

## 硬规则

1. 不能只靠 `build/test` 判断页面任务完成
2. 浏览器不可用时必须明确记录原因
3. 浏览器验收未完成时,结论只能是“验证不完整”

## 标准模板

```markdown
# Browser Verification Packet

## URL

- Open: `http://localhost:5173/#/`
- If a different route is required, open that exact route.

## Start or reuse local server

- Start command: `pnpm dev`
- Reuse allowed: `yes`
- If reusing an existing server, confirm the route is reachable before continuing.

## Visual targets

- Confirm the first screen renders successfully.
- Confirm there are no obvious layout breaks.
- Confirm the target component/page matches the expected structure.

## Visual comparison goals

- [写清楚要比对的视觉目标]
- [例如: 卡片是否等高、标题是否对齐、主按钮是否在首屏可见]

## Required interactions

1. [交互 1]
2. [交互 2]
3. [交互 3]

At least one core interaction must be executed.

## Failure thresholds

Treat the check as failed if any of the following happens:

- page does not load
- obvious layout corruption
- required interaction does not respond
- console/runtime error blocks the flow

## Required browser log fields

Record all of the following in the execution log:

1. URL visited
2. Whether the page loaded
3. What was visually checked
4. Which interaction was executed
5. What went wrong, if anything
6. Why browser verification was skipped, if skipped
```

## 最小执行要求

最少要完成:

1. 打开指定 URL
2. 看首屏是否加载
3. 看是否有明显布局错误
4. 跑至少一个核心交互
5. 写回 execution log

## 浏览器不可用时的记录模板

```plain
Browser verification blocked.
Reason: [why unavailable]
Skipped checks:
- [visual target]
- [interaction target]
Current conclusion: verification incomplete
```

## 主代理复核要求

即便子会话已经写了浏览器日志,主代理仍需要:

1. 判断日志是否具体
2. 判断验收项是否真的执行了
3. 必要时自己重新打开页面复核
