---
name: init-pure-admin-iconify
description: >-
  初始化 vite+vue3 项目的 pure-admin 风格 iconify 图标渲染体系
  （离线 + 在线 + useRenderIcon 统一渲染）。当用户提及"初始化 iconify"
  "pure-admin 图标方案""ReIcon/useRenderIcon""离线图标接入"
  "后台项目图标基础设施"时使用此技能。
user-invocable: true
metadata:
  version: "0.2.0"
---

# 初始化 Pure-Admin Iconify 方案（Vite + Vue3）

本技能用于在任意 `vite + vue3` 项目中，快速初始化一套与 pure-admin 思路一致的 iconify 图标体系，提供：

- `IconifyIconOffline`（离线图标）
- `IconifyIconOnline`（在线图标）
- `useRenderIcon`（统一分流渲染）
- `offlineIcon`（本地离线图标映射与兼容别名）

目标是让业务层只关心“传什么图标”，不关心底层是离线、在线还是组件对象。

## 适用场景

- 新项目首次接入 iconify 图标体系
- 老项目希望统一图标渲染入口，减少各处重复封装
- 需要兼容旧 `IconXxx` 命名，同时支持新式 `collection/name`、`collection:name`
- 菜单、路由、配置驱动场景需要返回 `Component` 类型图标

## 核心原则 [CRITICAL]

1. 统一出口：业务代码优先通过 `ReIcon` 导出使用，不要各处二次封装 `@iconify/vue`
2. 离线优先：高频图标优先离线映射，长尾图标再走在线
3. 配置驱动优先用 `useRenderIcon`：菜单、路由、表格配置统一返回组件
4. 保留兼容层：旧 `IconXxx` 仅做兼容，不作为新代码首选

## 1. 照抄策略（先定模式） [CRITICAL]

优先使用“照抄 + 最小改造”策略，不要凭记忆重写。

### 1.1 首选来源

1. pure-admin 原方案（架构参考）
2. 你项目里已经落地过的 ReIcon 实码（实施参考）

如果已有可运行的 `src/components/ReIcon`，优先完整复制后做最小改动。

### 1.2 文件映射（必须按表执行）

将来源项目 `src/components/ReIcon` 映射到目标项目同路径：

```plain
来源文件                                  -> 目标文件
src/components/ReIcon/index.ts            -> src/components/ReIcon/index.ts
src/components/ReIcon/type.ts             -> src/components/ReIcon/type.ts
src/components/ReIcon/src/hooks.ts        -> src/components/ReIcon/src/hooks.ts
src/components/ReIcon/src/iconifyIconOffline.ts -> src/components/ReIcon/src/iconifyIconOffline.ts
src/components/ReIcon/src/iconifyIconOnline.ts  -> src/components/ReIcon/src/iconifyIconOnline.ts
src/components/ReIcon/src/offlineIcon.ts  -> src/components/ReIcon/src/offlineIcon.ts
```

只复制这 6 个文件即可完成核心能力。

### 1.3 只允许改这 4 类内容

1. 路径别名：`@/` 是否存在
2. 入口注册位置：`main.ts` 或 `src/plugins/icon.ts`
3. 离线图标清单：`offlineIcon.ts` 里导入和映射项
4. 历史兼容别名：`IconXxx` 是否需要保留

除上述改动外，不要主动改 API、类型和导出结构。

## 2. 安装依赖

在目标项目安装：

```bash
pnpm add -D @iconify/json @iconify/vue unplugin-icons vite-svg-loader
```

可选工具：

```bash
pnpm add @pureadmin/utils
```

> 如果你采用 `~icons/...` 组件导入方式，`unplugin-icons` 是必需项。

## 3. 配置 Vite 插件

在 `vite.config.ts`（或插件聚合文件）添加 `unplugin-icons`：

```ts
import Icons from "unplugin-icons/vite";

export default defineConfig({
	plugins: [
		vue(),
		Icons({
			compiler: "vue3",
			scale: 1,
		}),
	],
});
```

## 4. 创建 ReIcon 目录结构

建议结构：

```plain
src/components/ReIcon/
├── index.ts
├── type.ts
└── src/
    ├── iconifyIconOffline.ts
    ├── iconifyIconOnline.ts
    ├── hooks.ts
    └── offlineIcon.ts
```

## 5. 一揽子现成代码（可直接照抄）

模板代码已拆分到 `templates/` 目录，直接按路径复制，不需要手动从文档里摘代码。

```plain
templates/ReIcon/index.ts
templates/ReIcon/type.ts
templates/ReIcon/src/iconifyIconOffline.ts
templates/ReIcon/src/iconifyIconOnline.ts
templates/ReIcon/src/hooks.ts
templates/ReIcon/src/offlineIcon.ts
templates/setup-icon.ts
```

复制规则：

1. `templates/ReIcon/**` -> `src/components/ReIcon/**`
2. `templates/setup-icon.ts` -> `src/plugins/icon.ts`（或合并到你的入口注册文件）
3. 复制后只改“必改项检查”列出的内容

> 如果你希望“一字不动照抄”旧项目，请把旧项目 `offlineIcon.ts` 全量复制过来，再对照模板补齐缺失导出。

## 6. 入口注册（可选但推荐）

在 `src/plugins/icon.ts`（或等价入口）注册：

```ts
import type { App } from "vue";
import { IconifyIconOffline, IconifyIconOnline, registerOfflineIcons } from "@/components/ReIcon";

export function setupIcon(app: App) {
	registerOfflineIcons(app);
	app.component("IconifyIconOffline", IconifyIconOffline);
	app.component("IconifyIconOnline", IconifyIconOnline);
}
```

如果旧项目已大量使用 Element Plus 全局图标别名，不要删除原注册，只新增 iconify 能力。

## 7. 业务使用规范

### 7.1 模板直出（离线）

```vue
<IconifyIconOffline icon="ep/menu" width="18" height="18" />
```

### 7.2 模板直出（在线）

```vue
<IconifyIconOnline icon="ri:home-4-line" width="18" height="18" />
```

### 7.3 配置驱动（菜单/路由/表格）

```ts
import { useRenderIcon } from "@/components/ReIcon";

const iconComp = useRenderIcon("ep/setting", { width: "18px", height: "18px" });
```

### 7.4 菜单配置约定

菜单项 `icon` 可直接写：

- 旧别名：`IconUser`
- 离线字符串：`ep/setting`
- 在线字符串：`ri:shield-user-line`

渲染层统一走 `useRenderIcon`，不要在菜单组件内部再写一套 icon 分流逻辑。

## 8. 必改项检查（照抄后立刻检查） [CRITICAL]

1. `~icons/...` 导入是否生效（未生效通常是漏配 `unplugin-icons`）
2. 路径别名 `@/components/ReIcon` 是否可解析
3. `registerOfflineIcons(app)` 是否在应用启动阶段执行
4. 旧页面如果用 `IconXxx`，对应 alias 是否存在

## 9. 离线图标扩充策略

仅在以下情况扩充 `offlineIcon.ts`：

- 同一在线图标在后台高频复用
- 对网络依赖敏感（内网或弱网）
- 希望字符串在 `useRenderIcon` 中稳定命中离线路径

扩充步骤：

1. 导入图标：`import EpXxx from "~icons/ep/xxx"`
2. 新增映射：`offlineIcons["ep/xxx"] = markRaw(EpXxx)`
3. 必要时补兼容别名：`aliasIcons.IconXxx = offlineIcons["ep/xxx"]`

## 10. 验证清单

- [ ] `vite.config.ts` 已启用 `unplugin-icons`
- [ ] `ReIcon` 目录和导出结构完整
- [ ] `useRenderIcon` 可同时处理组件、离线字符串、在线字符串
- [ ] 旧 `IconXxx` 页面未被破坏
- [ ] 菜单/路由等配置驱动场景可正常渲染图标
- [ ] 至少有一个示例页覆盖四种用法（旧别名、离线、在线、hook）

## 11. 常见坑位 [CRITICAL]

1. 误删原有注释和说明：集成改造要用最小补丁，不要整文件覆盖导致信息丢失
2. 样式类名过宽：示例页避免 `.icon-title` 这类容易冲突的命名，使用更局部语义类名
3. 误把兼容层当规范：`IconXxx` 只保兼容，新代码优先 `ep/menu`、`ri:...`、`useRenderIcon`
4. 在业务层重复封装：不要绕开 `ReIcon` 再造一套 `renderIcon`

## 12. 推荐落地顺序（10 分钟）

1. 依赖安装 + Vite 插件
2. 按映射表复制 6 个 `ReIcon` 文件
3. 入口注册（保留旧别名）
4. 选一个菜单或示例页接入 `useRenderIcon`
5. 完成验证清单后，再批量迁移业务页面

## 13. 参考来源

- Pure-Admin Icon 方案调研报告： https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-11-14-pure-admin-icon-solution-research.md
- Iconify 图标检索： https://icon-sets.iconify.design/
- Iconify 官方文档： https://iconify.design/

## 14. 图标动效与渐变（useIconEffect）

### 14.1 适用场景

- 大屏/Dashboard 项目的 KPI 卡片图标渐变色注入
- 图标呼吸动画（发光 + 缩放 + 透明度循环）
- 需要统一管理 Iconify SVG 视觉效果的项目
- Vite + Vue3 项目优先，也支持 uniapp 等轻量场景

### 14.2 依赖安装

根据动画策略选择：

| 策略 | 依赖                             | 安装命令        |
| ---- | -------------------------------- | --------------- |
| GSAP | `gsap`                           | `pnpm add gsap` |
| CSS  | 无                               | —               |
| Auto | 无（自动检测 gsap 可用性并降级） | —               |

### 14.3 核心能力

#### 渐变填充

向 Iconify `mode="svg"` 渲染的 SVG 内部注入 `<linearGradient>`，实现多色渐变填充。

**关键约束（禁止违反）**：

1. **排除法判别**：只跳过 `fill="none"`（outline 图标空心区）和已有 `url(#...)`，其余全部覆盖。**禁止白名单匹配**（如 `if (!fill || fill === "currentColor")`）。原因：Iconify 渲染后的 fill 值不确定（可能为 `#000`、`#333` 等内部默认值），白名单模式无法覆盖所有情况。
2. **定时重试链**：默认 `[0, 80, 200, 500, 1000]` ms 共 5 次重试，覆盖 Iconify 异步加载窗口。不可省略——`onMounted` + `@on-load` 不足以保证 100% 命中。
3. **CSS + JS 双层方案**：CSS 提供 fallback 颜色和 drop-shadow 发光；JS 提供渐变填充。outline 图标（`fill="none"`）依赖 CSS `currentColor` 上色，不受 JS 渐变影响——不要强行注入 stroke 渐变。

#### 呼吸动画

GSAP timeline（yoyo 循环）或纯 CSS @keyframes，驱动图标发光、缩放、透明度动画。

**三层动画策略**：

| 策略   | 触发条件                  | 动画能力                                                        |
| ------ | ------------------------- | --------------------------------------------------------------- |
| `gsap` | `strategy="gsap"`         | GSAP timeline: yoyo, stagger 0.45s 错峰， 双重发光 CSS 变量驱动 |
| `css`  | `strategy="css"`          | 纯 CSS @keyframes: scale + opacity 基础呼吸                     |
| `auto` | `strategy="auto"`（默认） | 运行时检测 `globalThis.gsap`，有则 GSAP，无则降级 CSS           |

### 14.4 使用示例

#### 基础渐变

```vue
<template>
	<div ref="iconRef" class="kpi-icon">
		<IconifyIcon class="iconify" icon="mdi:progress-clock" :width="44" :height="44" mode="svg" />
	</div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useIconEffect } from "@/components/ReIcon";

const iconRef = ref<HTMLElement | null>(null);
useIconEffect({
	target: iconRef,
	gradient: {
		stops: [
			{ offset: "0%", color: "#3cd8ff" },
			{ offset: "100%", color: "#2f73ff" },
		],
	},
});
</script>

<style scoped>
.kpi-icon {
	color: #3cd8ff;
}
.kpi-icon .iconify {
	filter: drop-shadow(0 0 6px rgba(60, 216, 255, 0.62)) drop-shadow(0 0 12px rgba(47, 115, 255, 0.32));
	transform-origin: center center;
}
</style>
```

#### 完整方案 — 渐变 + GSAP 呼吸

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useIconEffect } from "@/components/ReIcon";

const iconRef = ref<HTMLElement | null>(null);
const { startBreath } = useIconEffect({
	target: iconRef,
	gradient: {
		stops: [
			{ offset: "0%", color: "#3cd8ff" },
			{ offset: "100%", color: "#2f73ff" },
		],
	},
	breath: {
		strategy: "gsap",
		gsap: { scale: [1, 1.12], duration: 2.2, ease: "sine.inOut" },
	},
});

onMounted(() => startBreath());
</script>
```

#### 纯 CSS 方案 — uniapp 等无 GSAP 场景

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useIconEffect } from "@/components/ReIcon";

const { startBreath } = useIconEffect({
	target: ".kpi-icon",
	breath: {
		strategy: "css",
		css: { scale: [1, 1.08], duration: 2 },
	},
});

onMounted(() => startBreath());
</script>
```

#### 多卡片场景 — 使用 CSS 选择器

```vue
<script setup lang="ts">
import { onMounted } from "vue";
import { useIconEffect } from "@/components/ReIcon";

// 选中页面上所有 .count-card .kpi-icon 容器
const { startBreath } = useIconEffect({
	target: ".count-card .kpi-icon",
	gradient: {
		stops: [
			{ offset: "0%", color: "#3cd8ff" },
			{ offset: "100%", color: "#2f73ff" },
		],
		direction: "tl-br",
	},
	breath: {
		strategy: "gsap",
		gsap: { scale: [1, 1.12], duration: 2.2 },
	},
});

onMounted(() => startBreath());
</script>
```

### 14.5 API 参考

| 参数       | 类型                                 | 说明                          |
| ---------- | ------------------------------------ | ----------------------------- |
| `target`   | `Ref<HTMLElement \| null> \| string` | 图标容器元素或 CSS 选择器     |
| `gradient` | `IconGradientConfig \| false`        | 渐变配置，传 `false` 禁用     |
| `breath`   | `IconBreathConfig \| false`          | 呼吸动画配置，传 `false` 禁用 |

| 返回值            | 类型                  | 说明                                             |
| ----------------- | --------------------- | ------------------------------------------------ |
| `applyGradient()` | `() => void`          | 手动触发渐变注入（已在创建时自动启动定时重试链） |
| `startBreath()`   | `() => Promise<void>` | 启动呼吸动画（幂等）                             |
| `stopBreath()`    | `() => void`          | 停止呼吸动画                                     |
| `destroy()`       | `() => void`          | 销毁所有效果 + 清理定时器（组件卸载时自动调用）  |

### 14.6 策略选择指南

| 用户场景                       | 推荐 strategy | 说明                                           |
| ------------------------------ | ------------- | ---------------------------------------------- |
| Vite + Vue3 大屏 / Dashboard   | `"gsap"`      | 充分利用 GSAP stagger 错峰 + 双重发光 CSS 变量 |
| uniapp / 小程序 / 对包体积敏感 | `"css"`       | 零外部依赖，纯 CSS `@keyframes` 呼吸           |
| 不确定项目类型                 | `"auto"`      | 运行时自动检测 `globalThis.gsap`，无感降级     |

### 14.7 已知约束与坑位

- **排除法判别**：永远不要用白名单匹配 fill 值来注入渐变。Iconify 渲染后的 SVG fill 属性值是不确定的（取决于 Iconify 内部实现），白名单会遗漏大量 case
- **定时重试链不可省略**：`onMounted` + Iconify `@on-load` 回调不足以保证渐变 100% 注入，必须配合 `setTimeout(fn, [0,80,200,500,1000])` 重试链
- **GSAP 使用动态 import**：模板用 `await import("gsap")` 而非顶层 `import gsap from "gsap"`，确保未安装时不阻塞打包
- **CSS 层不要删除**：JS 渐变注入失败时，CSS `color` + `drop-shadow` 仍能提供 fallback 视觉效果
- **outline 图标不受 JS 渐变影响**：`fill="none"` 自动跳过，仅依赖 CSS `color` 通过 `currentColor` 提供 stroke 颜色
- **`target` 支持两种方式**：`ref<HTMLElement | null>`（单个元素）或 `string`（CSS 选择器，查询全部匹配元素中的第一个）
