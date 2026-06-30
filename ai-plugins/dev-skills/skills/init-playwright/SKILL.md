---
name: init-playwright
description: >-
  在 pnpm monorepo 初始化 Playwright 三件套（@playwright/test + @playwright/cli +
  playwright-mcp），含 e2e/视觉测试骨架、MCP 配置、AI skills 生成、AI 记忆更新。
  内置无头浏览器 CPU 过载事故复盘与故障排查指南：可排查 headless 模式下的
  高 CPU 占用（100%）、浏览器卡死、Chromium 进程残留无法退出、
  大屏 3D WebGL 渲染性能问题；提供紧急止损步骤和长期回归检查清单。
  当用户提及 playwright 初始化、大屏视觉测试、e2e 测试搭建、
  playwright monorepo 配置、pw_core/pw_visual MCP 等时触发。
  也适用于无头浏览器性能故障排查、headless CPU 100% 诊断、
  Chromium 进程残留清理、浏览器进程无法退出处理、
  大屏 3D 渲染性能调优等排查场景。
user-invocable: true
metadata:
  version: "1.1.0"
---

# 在 pnpm monorepo 初始化 Playwright 工具链

本技能记录在 Vue 3 + Vite + TypeScript pnpm monorepo 中初始化 Playwright 三件套的完整工作流，及执行中发现的 2 个关键环境坑。

## 适用场景

- pnpm monorepo 项目首次接入 Playwright
- 大屏/可视化项目需要视觉回归测试
- 需要为 AI agent 配备浏览器驱动能力（MCP + CLI skills）
- Node 22 + Windows 环境（坑与 Node 版本/OS 相关）

## ⚠️ 无头浏览器 CPU 风险须知（重要）

**headless（无头）≠ 轻量**。无头 Chromium 仍然运行完整的浏览器引擎（Blink 排版、V8 JS 执行、WebGL/WebGPU 渲染管线），只是不显示窗口。在 **大屏 3D/可视化项目** 下，headless 模式的 CPU/GPU 消耗与 headed（有头）几乎无异：

| 场景 | 风险等级 | 说明 |
|------|----------|------|
| **pw_core MCP 持久化连接** | 🔴 高 | MCP 下的浏览器是**长连接进程**，AI 会话期间一直存活，不会用完即销毁。多个 Agent 反复调用 → 进程常驻 → 内存泄漏 → CPU 100% |
| **大屏 3D 页面反复渲染** | 🔴 高 | ECharts WebGL/3D 图表在无头模式下仍完整执行 GPU 渲染管线。每次截图/快照都触发重绘 |
| **pw_core + pw_visual 同时运行** | 🟠 中高 | 两个 Chromium 进程并行，每个 200-500MB 内存，大屏项目可能飙到 1GB+ |
| **CI 一次性测试** | 🟢 低 | 测试完成后进程自动退出，风险可控 |

**因此，使用本技能初始化的项目，必须阅读并遵循「无头浏览器安全使用规范」章节的约束**。尤其在大屏/可视化/3D 密集型项目上，优先使用 pw_visual（headed）驱动浏览器，避免让 pw_core（headless）长时间常驻。

## 工作流总览

```
装三件套 → 端口固定 → 写根级 playwright.config.ts
    → visual-stability.css → .mcp.json + MCP 配置
    → playwright-cli + AI skills 生成
    → package.json scripts (test:e2e + ci)
    → e2e 冒烟测试 → 视觉基线测试
    → AI 记忆三处更新 → 验收
```

## 步骤 1：安装三件套

```bash
pnpm add -D -w @playwright/test @playwright/cli playwright-mcp
pnpm exec playwright install chromium
pnpm exec playwright --version  # 验证
```

三件套职责：

| 包 | 用途 | 何时用 |
|---|---|---|
| `@playwright/test` | 编写和运行 e2e/visual 测试 | CI 固化、`pnpm test:e2e` |
| `@playwright/cli` | 为 AI agent 生成 skills | `playwright-cli install --skills` |
| `playwright-mcp` | AI 通过 MCP 直接驱动浏览器 | pw_core（headless，省 token **但高 CPU**）、pw_visual（headed，视觉推理） |

## 步骤 2：monorepo 子 app dev server 端口固定

每个需要测试的 app 的 `vite.config.ts` 显式设端口，避免 playwright webServer 端口冲突：

```ts
server: {
  port: 5174,          // 一期用 5173，二期用 5174，依此类推
  host: "127.0.0.1",   // 必须 127.0.0.1，不用 0.0.0.0
},
```

## 步骤 3：根级 playwright.config.ts

monorepo 推荐根目录单一配置，用 `testDir` + `testMatch` 集中管理，`projects` 区分不同 app（后续扩展）：

```ts
import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const baseURL = "http://127.0.0.1:5174";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",        // isolate from vitest *.test.ts
  outputDir: "artifacts/test-results",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },
  fullyParallel: false,              // 大屏 3D 资源，并行争抢 GPU
  workers: 1,
  retries: CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "artifacts/playwright-report" },
    ],
  ],
  use: {
    baseURL,
    /** 显式声明 headless，不依赖默认值——确保 CI 和非 CI 行为一致 */
    headless: true,
    /** 禁用 GPU 及相关加速，降低 headless 模式下的 CPU 消耗 */
    launchOptions: {
      args: [
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-dev-shm-usage",
        "--no-sandbox",
      ],
    },
    timezoneId: "Asia/Shanghai",     // 中国大屏用上海时区
    viewport: { width: 1440, height: 900 },
    stylePath: "tests/visual/visual-stability.css",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  snapshotPathTemplate: "tests/visual/__screenshots__/{testFilePath}/{arg}{ext}",
  projects: [{ name: "chromium-desktop", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm --filter <pkg-name> dev",  // 见坑 #2
    url: baseURL,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
});
```

## 坑 #1：lint-staged prettier --experimental-cli 在 Node 22 崩溃

**现象**：`lint-staged.config.js` 里 `"*": "prettier --experimental-cli --write"` 在 Node 22 沙箱环境触发 `WorkTankWorkerError: Terminated`，阻塞所有 git commit。

**根因**：prettier 3.8.1 的 `--experimental-cli` 依赖 worktank worker 池，在部分 Node 22 环境不稳定。

**修复**：
```js
// lint-staged.config.js
export default {
  /**
   * 临时去掉 prettier 的 --experimental-cli 标志。
   * prettier 3.8.1 的 --experimental-cli worktank worker
   * 在 Node 22 沙箱崩溃，回退到普通 --write，待上游修复后恢复。
   *
   * 另加 --ignore-unknown：跳过无 parser 的文件（如 .gitignore）
   */
  "*": "prettier --write --ignore-unknown",
};
```

注意：`--ignore-unknown` 很重要——不加的话 `.gitignore` 等无 parser 文件也会被 prettier 报错阻塞提交。

## 坑 #2：playwright webServer 的 pnpm filter 吞掉 --host

**现象**：`playwright.config.ts` 的 `webServer.command` 设为 `pnpm dev:<app> --host 127.0.0.1`，webServer 自动启动后返回 404。CI 模式下 `reuseExistingServer: false` 会直接失败。

**根因**：`pnpm dev:<app>` 展开为 `pnpm --filter <pkg> dev`，后面的 `--host 127.0.0.1` 被 pnpm filter 吞掉，没有传给 vite。

**修复**：不在 webServer.command 里传 `--host`/`--port`，依赖 vite.config.ts 已有的 `server` 配置：

```ts
// playwright.config.ts
webServer: {
  // 不在命令行传 --host/--port，依赖 vite.config.ts 的 server 配置
  command: "pnpm --filter <pkg> dev",
  url: baseURL,
  reuseExistingServer: !CI,
  timeout: 120_000,
},
```

通用原则：**vite 项目的 playwright webServer 所有 server 参数放 vite.config.ts，命令行只传 `dev`**。

## 步骤 4：vitest 与 playwright 命名隔离

| 测试类型 | 文件尾缀 | 目录 | 谁跑 |
|---|---|---|---|
| 单元/组件/composable | `*.test.ts` | `**/tests/` | vitest (`pnpm test`) |
| e2e/页面集成 | `*.e2e.spec.ts` | `tests/e2e/` | playwright (`pnpm test:e2e`) |
| 视觉回归 | `*.visual.spec.ts` | `tests/visual/` | playwright (`pnpm test:e2e`) |

两套配置天然隔离（vitest `include` 用 `*.test.ts`，playwright `testMatch` 用 `*.spec.ts`），无需互相 exclude。

## 步骤 5：基线截图提交策略

- 基线截图提交到 `tests/visual/__screenshots__/`（**不进 .gitignore**）
- artifacts/、test-results/、playwright-report/ 忽略
- 首次跑 `--update-snapshots` 生成基线，二次跑 `pnpm test:e2e` 验证

## ⚠️ 无头浏览器安全使用规范

### 核心原则

headless Chromium **不是轻量模式**，它在后台运行完整的浏览器引擎。以下规范帮助你在项目中安全使用 Playwright，避免 CPU 过载事故。

### ① 优先选择 headed 模式驱动浏览器

不是所有场景都适合 headless。按优先级选择：

| 推荐顺序 | 驱动方式 | 适用场景 | 理由 |
|----------|---------|----------|------|
| ✅ 最推荐 | pw_visual（headed） | AI agent 日常驱动 | 视觉效果可见、省 CPU 不会"空转" |
| ⚠️ 酌情 | pw_core（headless） | token 敏感、纯数据验证 | **省 token 不省 CPU**，大屏 3D 下 CPU 消耗与 headed 几乎相同 |
| ✅ 推荐 | playwright test（CI） | 自动化测试、回归验证 | 短生命周期，用完即销毁，风险可控 |

### ② MCP 浏览器进程是持久化的，必须管理生命周期

`pw_core` 和 `pw_visual` 通过 MCP 协议挂载，AI agent 启动后浏览器进程持续存活。**不会自动关闭**。

- **会话结束时**：必须手动关闭浏览器。在 AI agent 退出前执行：
  ```ts
  // 通过 pw_core 或 pw_visual 的 evaluate_script 关闭页面
  await page.close();
  // 或在测试脚本中使用 afterAll 钩子
  ```
- **长时间不使用**：建议在 `.mcp.json` 中配置进程超时或定期重启
- **监控 CPU**：大屏项目建议在 AI agent 使用浏览器后检查任务管理器，确认 Chromium 进程已退出

### ③ 大屏 3D 项目的特殊注意事项

如果你的项目包含 ECharts WebGL/3D 图表（如 Ring3DChart、3D 地图等），headless 模式的 CPU 消耗会显著高于纯 2D 页面：

- **不要频繁截图**：每次 `get-screenshot` 都会触发完整的 WebGL 帧渲染，CPU 飙升至 100%
- **使用 pw_visual＞pw_core**：headed 模式至少让你能观察到浏览器的运行状态
- **减少无意义的页面访问**：AI agent 应避免在 headless 下反复 "看一眼" 大屏页面
- **考虑降低截图分辨率**：在非必要场景下调小 viewport 或截图分辨率

### ④ 在 agent-progress.md 或 AI 记忆中加入浏览器进程回收提醒

建议在项目的 AI 记忆文件中加入以下约束规则：

```markdown
### Playwright 浏览器进程使用规则（CPU 安全）
- AI 驱动浏览器默认使用 pw_visual（headed），仅 token 敏感场景用 pw_core
- 每次使用浏览器后检查任务管理器，确认 Chromium 进程已退出
- 禁止在 headless 模式下对 3D 大屏页面做高频截图（每 10 秒 1 次以上）
- 大屏 3D 页面优先用 pw_visual 驱动，避免无头模式下的 GPU 空转
```

### ⑤ 在 session 结束时执行进程清理

AI 会话结束时，建议执行以下命令确认没有残留 Chromium 进程：

```bash
# Windows - 检查遗留的 Chromium 进程
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL | find /I /N "chrome.exe"
# 可选：强制关闭残留（请先确认无其他用户进程）
# taskkill /F /IM chrome.exe 2>NUL
```

```bash
# Linux/macOS
# ps aux | grep -i chromium | grep -v grep
# killall chromium  # 谨慎使用
```

## 📋 真实事故复盘：无头浏览器 CPU 过载

以下是一次真实事故的完整记录。该事故直接导致 Playwright 工具链从项目中被全面删除。记录于此，帮助后续使用者识别同类型风险。

### 事故时间线

| 时间 | 事件 | 状态 |
|------|------|------|
| **Day 1** | Playwright 工具链初始化完成：pw_core（headless）+ pw_visual（headed）MCP、playwright.config.ts、e2e 冒烟测试、视觉基线、AI 记忆三处同步 | ✅ 12 项验收全通过 |
| **Day 1→3** | AI agent 通过 pw_core 反复驱动 headless 浏览器，对大屏 3D 页面做截图/快照/页面验证 | 🔄 持续运行 |
| **Day 3** | 主机 CPU 飙升至 100%，系统明显卡顿。浏览器进程长期驻留不退出 | 🔴 严重 |
| **Day 3** | 用户决定彻底删除 Playwright 工具链，涵盖 17 项：MCP 配置、测试代码、配置文件、基线截图、AI 技能文件、package.json 依赖、AI 记忆章节 | 🗑️ 全部清除 |

### 根因分析

```
初始化 Playwright（pw_core headless MCP）
  ↓ AI agent 在 3 天内反复通过 pw_core 驱动浏览器 "查看" 大屏 3D 页面
  ↓ headless Chromium 在后台完整执行 WebGL 渲染管线（3D 环形图、3D 地图等）
  ↓ 每次 get-screenshot / get-full-snapshot 都触发完整的 GPU 帧渲染
  ↓ MCP 协议下浏览器是长连接进程，不会用完即销毁
  ↓ 浏览器进程连续运行 3 天 → 内存持续增长 → CPU 100%
  ↓ 主机性能严重下降，用户被迫删除 Playwright
```

### 关键教训

1. **MCP 浏览器是长连接，不是一次性调用** — 它会在整个 AI 会话期间存活，用完不自动关闭。这是与 `pnpm test:e2e` 一次性测试的最大区别。
2. **headless 不省 CPU** — headless 屏蔽的是窗口，不是渲染管线。大屏 3D 项目下 headless 和 headed 的 GPU 负载几乎一样。
3. **3 天内就能酿成事故** — 从初始化到全面删除只有 3 天时间周期。一旦 AI agent 开始频繁调用浏览器，CPU 问题会快速恶化。
4. **习惯性 "看一眼" 是最危险的用法** — AI agent 天然倾向于频繁截图/快照来确认页面状态，在 headless 模式下这种 "看一眼" 习惯会触发大量无用 GPU 渲染。

### 预防措施

- **初始化时就确认**：你的项目是 3D 大屏类吗？如果是，立即改用 pw_visual（headed）而非 pw_core
- **使用前先设规则**：在 `AGENTS.md` 中明确约束浏览器调用频率和方式（参考"AI 记忆更新模板"中的安全规则）
- **使用后立即检查**：每个 AI 会话结束时运行 `tasklist` 检查是否有残留 Chromium 进程
- **避免长时间无人值守**：headless 浏览器不要长时间挂机。如果必须使用，建议设置定时重启或进程超时

## 🧰 故障排查指南

如果你在使用 Playwright 过程中遇到以下现象，说明可能正在重演上述事故。

### 症状速查表

| 症状 | 排查方向 | 紧急程度 |
|------|---------|----------|
| 电脑风扇狂转、系统变卡 | 打开任务管理器，检查是否有多个 `chrome.exe` 进程（每个 200-500MB 内存） | 🔴 立即处理 |
| AI agent 每次回复都变慢 | 检查是否每个 AI 消息循环都触发了浏览器截图/快照 | 🟠 尽快优化 |
| `pnpm test:e2e` 跑完风扇还在转 | 检查是否有残留 Chromium 进程未被测试框架关闭 | 🟠 尽快修复 |
| 浏览器自动弹出窗口（headed） | 确认是否混用了 pw_core 配置但误启动了 headed 模式 | 🟡 观察调整 |

### 紧急止损步骤

如果发现 CPU 已经异常飙升：

```bash
# 步骤 1：立即检查 Chromium 进程数
tasklist /FI "IMAGENAME eq chrome.exe" 2>NUL

# 步骤 2：如果存在大量 Chromium 进程，强制关闭
taskkill /F /IM chrome.exe 2>NUL

# 步骤 3：关闭重开 AI 会话，确认浏览器工具已不在会话中
# 步骤 4：检查 .mcp.json，临时移除 pw_core/pw_visual 条目
# 步骤 5：复盘分析 — 是哪个 AI agent 行为触发了高频调用
```

### 长期回归检查清单

每次 Playwright 使用后，复查以下项目：

- [ ] `tasklist` 中无残留 `chrome.exe`
- [ ] 任务管理器 CPU 占用率回归正常水平
- [ ] AI 会话日志中无异常密集的浏览器调用记录
- [ ] 各 app 的 vite dev server 已正常关闭
- [ ] 如果是 CI 环境，检查 CI 日志中 Chromium 进程退出状态码

## AI 记忆更新模板

在 CLAUDE.md / AGENTS.md / GEMINI.md 三处插入（<300 字）：

```markdown
## Playwright 工具链

三件套职责：@playwright/test (CI 固化) | @playwright/cli (生成 skills) | playwright-mcp (AI 驱动浏览器)

命名：vitest→*.test.ts，playwright→*.spec.ts

⚠️ 浏览器进程安全规则：
- AI 驱动浏览器默认用 pw_visual（headed），仅 token 敏感场景用 pw_core
- 每次使用浏览器后检查任务管理器，确保 Chromium 进程已退出
- 禁止在 headless 模式下对 3D 大屏页面做高频截图
- 大屏 3D 页面优先用 pw_visual 驱动，避免无头模式 GPU 空转

规则：视觉对齐后必须用 @playwright/test 固化。
```

## 环境注意

- **Node 22 + Windows**：所有 node/pnpm 命令加 `NODE_OPTIONS= ` 前缀（清空有问题的 `NODE_OPTIONS=--use-system-ca`）
- **git commit**：必须用 `git-commit` 技能（查远程 commit-types.ts emoji + commitlint 预校验 + -F 文件方式）
- **pre-commit hook**：修改 lint-staged.config.js 后验证一次 commit 能通过

## 验收清单

1. `pnpm install` 无报错
2. `pnpm exec playwright --version` 输出版本号
3. `pnpm test:e2e` 3 个测试全 pass（smoke + visual）
4. `pnpm run ci` 全流程通过（vitest → build → test:e2e）
5. `.mcp.json` 含 pw_core/pw_visual
6. `.claude/skills/playwright-cli/` 有技能文件
7. AI 记忆三处 Playwright 工具链章节一致
8. 子 app vite.config.ts 端口显式固定
9. artifacts/ 被 gitignore
10. ⚠️ 无头浏览器安全规范已阅读：确认项目属于 3D 大屏类，优先使用 pw_visual（headed）而非 pw_core
11. ⚠️ 浏览器进程回收已检查：`tasklist /FI "IMAGENAME eq chrome.exe"` 无残留 Chromium 进程
