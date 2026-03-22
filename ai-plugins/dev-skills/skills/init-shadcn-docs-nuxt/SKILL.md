---
name: init-shadcn-docs-nuxt
description: 初始化或重构任意组件库/项目的 `shadcn-docs-nuxt` 文档站。用于快速建立可运行、可构建、可维护的 Nuxt 文档底座，并规避常见误区（配置复杂化、模块兼容、MDC 语法错误、Windows 构建假卡死）。当用户提及"搭建组件库文档""接入 shadcn-docs-nuxt""重做 Nuxt 文档站""迁移文档模板"时触发。
user-invocable: true
metadata:
  version: "1.0.0"
---

# 初始化 `shadcn-docs-nuxt` 组件库文档

以"最小可用 + 快速稳定"为目标，给任意项目建立可长期维护的 `shadcn-docs-nuxt` 文档站。

> 本技能拆分为三层：
>
> - **SKILL.md** — 导航与流程
> - **references/** — 排错手册与配置说明
> - **templates/** — 可直接复制的代码模板（含完整注释，注释即文档）
>
> 执行时按流程推进，遇到配置细节查 reference，需要代码直接读 template。

## 模板文件索引（templates/）

代码模板包含完整的注释说明，**注释中记录了每个配置项的根因、不配置的后果、以及历史事故**。使用时直接读取模板文件，不要跳过注释。

| 模板文件                                                                 | 对应文档站文件            | 说明                             |
| ------------------------------------------------------------------------ | ------------------------- | -------------------------------- |
| [`templates/nuxt.config.minimal.ts`](templates/nuxt.config.minimal.ts)   | `nuxt.config.ts`          | 最小启动骨架                     |
| [`templates/nuxt.config.full.ts`](templates/nuxt.config.full.ts)         | `nuxt.config.ts`          | 生产级完整配置（含全部兼容补丁） |
| [`templates/app.config.ts`](templates/app.config.ts)                     | `app.config.ts`           | 站点元信息与 UI 配置             |
| [`templates/tailwind.config.js`](templates/tailwind.config.js)           | `tailwind.config.js`      | 完整 Tailwind + shadcn-vue 主题  |
| [`templates/assets/css/tailwind.css`](templates/assets/css/tailwind.css) | `assets/css/tailwind.css` | CSS 入口 + 亮/暗主题变量         |
| [`templates/assets/css/main.css`](templates/assets/css/main.css)         | `assets/css/main.css`     | 自定义样式示例                   |
| [`templates/shims/debug.ts`](templates/shims/debug.ts)                   | `shims/debug.ts`          | debug ESM 兼容 shim              |
| [`templates/workspace-aliases.ts`](templates/workspace-aliases.ts)       | `workspace-aliases.ts`    | 组件库源码别名函数               |
| [`templates/plugins/ui-lib.ts`](templates/plugins/ui-lib.ts)             | `plugins/xxx.ts`          | Nuxt Plugin 注册模式             |
| [`templates/package.json`](templates/package.json)                       | `package.json`            | 依赖与脚本基线                   |
| [`templates/prettierrc.json`](templates/prettierrc.json)                 | `.prettierrc`             | MDC 防护（兜底方案）             |
| [`templates/prettierignore`](templates/prettierignore)                   | `.prettierignore`         | MDC 防护（主方案）               |

## 参考文档索引（references/）

| 文件                                                       | 内容                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| [`references/nuxt-config.md`](references/nuxt-config.md)   | 按需补丁策略、禁改项清单                                  |
| [`references/compat.md`](references/compat.md)             | ESM/CJS 兼容速查表、排查顺序、常见误判表                  |
| [`references/tailwind-css.md`](references/tailwind-css.md) | content 扫描规则、CSS 变量格式、常见样式问题排查          |
| [`references/mdc-prettier.md`](references/mdc-prettier.md) | MDC 标准语法、5 种错误写法对照、hydration mismatch 因果链 |
| [`references/windows.md`](references/windows.md)           | 构建假卡死、子进程链清理、EPERM 文件锁、单进程复现法      |
| [`references/workspace.md`](references/workspace.md)       | 别名顺序陷阱、plugin 注册、i18n 单语、OG Image、目录结构  |

---

## 核心原则（5 条铁律）

1. **保持精简**：`nuxt.config.ts` 和 `app.config.ts` 先最小化，不先堆功能。
2. **先跑通再美化**：优先确保 `dev` / `build` 稳定，再做样式和内容扩展。
3. **先修运行链再修样式**：交互异常（暗黑模式、侧边栏折叠失效）先查 hydration 和模块导入报错，不要先改 CSS。
4. **避免错误扩展**：不要第一时间折腾 i18n / icon 自定义方案，先使用模板默认可用路径。
5. **内容语法严格**：MDC 容器语法要标准化，参见 [`references/mdc-prettier.md`](references/mdc-prettier.md)。

---

## 历史事故强约束（6 条记忆）

执行本技能时，**必须默认带着这些"已发生过"的事故记忆**：

1. **不要假设 workspace 组件库已经先构建完成**；文档站需要能直接从源码启动。→ 见 [`references/workspace.md`](references/workspace.md)
2. **不要把交互失效先归因到样式**；先排除 hydration 被模块导入错误打断。→ 见 [`references/compat.md`](references/compat.md)
3. **不要让 prettier 改写 `content/**/\*.md` 的 MDC 结构**。→ 见 [`references/mdc-prettier.md`](references/mdc-prettier.md)
4. **不要在 Windows 下把"日志停住"直接判定为"进程卡死"**，先排查残留子进程。→ 见 [`references/windows.md`](references/windows.md)
5. **不要一开始就重写 i18n / icon 体系**；先拿模板默认链路跑通。→ 见 [`references/nuxt-config.md`](references/nuxt-config.md)
6. **不要直接启用 `ogImage` 模块**；会触发 `vue.runtime.mjs does not provide an export named toValue` 的 500 错误。→ 见 [`references/nuxt-config.md`](references/nuxt-config.md)

---

## 推荐参考仓库优先级

按以下顺序学习并抽取配置（从高到低）：

1. **`nuxt-umami-docs`**（真实项目的稳定配置范式）
2. **`shadcn-docs-nuxt-starter`**（最小骨架）
3. **`shadcn-docs-nuxt`**（框架源码，仅用于查默认行为）
4. **`shadcn-docs-ui-thing`**（组件库扩展思路，谨慎吸收）

每个仓库重点优先阅读这 6 个文件：`package.json` → `nuxt.config.ts` → `app.config.ts` → `tailwind.config.*` → `assets/css/*` → `content/index.md`

---

## 标准落地流程

### 第 1 步：建立最小骨架

```plain
docs-site/
├─ package.json
├─ nuxt.config.ts
├─ app.config.ts
├─ tailwind.config.js
├─ assets/css/
│  ├─ tailwind.css
│  └─ main.css
├─ content/
│  └─ index.md
├─ shims/                  ← 按需，仅当 debug 兼容问题出现时
│  └─ debug.ts
├─ components/content/     ← 按需，自定义 MDC 组件
└─ plugins/                ← 按需，注册 workspace 组件库
```

如果是重构已有文档站，先保留现有 `content/` 层级，不要和"底座重建"混在一次改动里。

### 第 2 步：依赖与脚本

详见 [`references/workspace.md` § package.json 基线](references/workspace.md)。

核心要点：

- 依赖：`nuxt`、`shadcn-docs-nuxt`、`vue`、`vue-router`、`tailwindcss`、`tailwindcss-animate`
- 如需消费 workspace 组件库，补 `workspace:*` 依赖
- devDependencies：`@iconify-json/lucide`（Nuxt Icon 必需）
- 脚本必须包含 `predev` / `prebuild` / `postinstall` 三处 `nuxt prepare`

### 第 3 步：Nuxt 配置

详见 [`references/nuxt-config.md`](references/nuxt-config.md)。

先用最小骨架启动，遇到客户端报错再按"按需补丁"策略逐项补兼容。

### 第 4 步：Tailwind + CSS

详见 [`references/tailwind-css.md`](references/tailwind-css.md)。

**硬性检查**：`content` 扫描必须覆盖 `node_modules/shadcn-docs-nuxt`，否则主题类缺失、暗黑样式异常。

### 第 5 步：MDC 内容

详见 [`references/mdc-prettier.md`](references/mdc-prettier.md)。

### 第 6 步：验证

执行后至少提供以下证据：

| 验证项  | 方法                                                     |
| ------- | -------------------------------------------------------- |
| 启动    | `pnpm --filter <pkg> dev` → 首页 HTTP 200                |
| 构建    | `pnpm --filter <pkg> build` → 有 `.output` 产物          |
| 交互    | 暗黑模式切换、侧边栏折叠可用                             |
| 内容    | 抽查至少 1 个 `::demo-playground` 页面，无裸 marker 文本 |
| console | 无阻断 hydration 的 `error`                              |

---

## 常见故障排查顺序

交互失效（暗黑模式切换失败、侧栏按钮无效）时，**严格按此顺序**：

1. **先**看浏览器 console 是否有模块导入错误 → [`references/compat.md`](references/compat.md)
2. **再**修依赖入口兼容（alias / optimizeDeps / dedupe / ssr.noExternal）
3. **最后**再做 Tailwind / 主题样式检查 → [`references/tailwind-css.md`](references/tailwind-css.md)

构建卡住时 → [`references/windows.md`](references/windows.md)

MDC 裸文本 / hydration mismatch → [`references/mdc-prettier.md`](references/mdc-prettier.md)

---

## 禁改项（无明确证据前不动）

1. `extends: ["shadcn-docs-nuxt"]`（它通常不是根因）
2. 内容目录层级（底座改造阶段避免和内容重排耦合）
3. i18n 多语言路线（单语文档站先保持最小配置）
4. icon 体系大改（先沿用模板可用默认方案）
5. `ogImage: { enabled: false }`（直接启用会触发 500）

---

## 反模式清单

1. 先写大量"自定义配置"，最后才验证能否启动。
2. 用样式改动掩盖运行时导入错误。
3. 批量格式化 `content/**/*.md` 后不做页面与 console 回归。
4. 在同一轮同时重排内容架构 + 重构底座，导致回归不可定位。
5. 只报"看起来好了"，不附任何可重复验证证据。
6. 把 `::demo-playground` 写成 `## ::demo-playground`。
7. 在 Windows 下把"日志停住"直接判定为"进程卡死"而不先清理旧进程。

---

## 输出要求

执行本技能时，最终至少给出：

1. 关键改动文件列表（配置、样式、内容）
2. 运行与构建验证结果
3. 若有风险项，给出下一步最小补救建议
