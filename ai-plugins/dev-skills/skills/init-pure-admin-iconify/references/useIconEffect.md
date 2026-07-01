# useIconEffect 完整使用文档

为 Iconify SVG 图标注入多色渐变填充和呼吸动画（发光 + 缩放）。

## 适用场景

- 大屏/Dashboard 项目的 KPI 卡片图标渐变色注入
- 图标呼吸动画（发光 + 缩放 + 透明度循环）
- 需要统一管理 Iconify SVG 视觉效果的项目
- Vite + Vue3 项目优先，也支持 uniapp 等轻量场景

## 依赖安装

根据动画策略选择：

| 策略 | 依赖                             | 安装命令        |
| ---- | -------------------------------- | --------------- |
| GSAP | `gsap`                           | `pnpm add gsap` |
| CSS  | 无                               | —               |
| Auto | 无（自动检测 gsap 可用性并降级） | —               |

## 核心能力

### 渐变填充

向 Iconify `mode="svg"` 渲染的 SVG 内部注入 `<linearGradient>`，实现多色渐变填充。

**关键约束（禁止违反）**：

1. **排除法判别**：只跳过 `fill="none"`（outline 图标空心区）和已有 `url(#...)`，其余全部覆盖。**禁止白名单匹配**（如 `if (!fill || fill === "currentColor")`）。原因：Iconify 渲染后的 fill 值不确定（可能为 `#000`、`#333` 等内部默认值），白名单模式无法覆盖所有情况。
2. **定时重试链**：默认 `[0, 80, 200, 500, 1000]` ms 共 5 次重试，覆盖 Iconify 异步加载窗口。不可省略——`onMounted` + `@on-load` 不足以保证 100% 命中。
3. **CSS + JS 双层方案**：CSS 提供 fallback 颜色和 drop-shadow 发光；JS 提供渐变填充。outline 图标（`fill="none"`）依赖 CSS `currentColor` 上色，不受 JS 渐变影响——不要强行注入 stroke 渐变。

### 呼吸动画

GSAP timeline（yoyo 循环）或纯 CSS @keyframes，驱动图标发光、缩放、透明度动画。

**三层动画策略**：

| 策略   | 触发条件                  | 动画能力                                                        |
| ------ | ------------------------- | --------------------------------------------------------------- |
| `gsap` | `strategy="gsap"`         | GSAP timeline: yoyo, stagger 0.45s 错峰， 双重发光 CSS 变量驱动 |
| `css`  | `strategy="css"`          | 纯 CSS @keyframes: scale + opacity 基础呼吸                     |
| `auto` | `strategy="auto"`（默认） | 运行时检测 `globalThis.gsap`，有则 GSAP，无则降级 CSS           |

## 使用示例

### 基础渐变

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

### 完整方案 — 渐变 + GSAP 呼吸

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

### 纯 CSS 方案 — uniapp 等无 GSAP 场景

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

### 多卡片场景 — 每个卡片独立调用

`useIconEffect` 的 `target` 为 CSS 选择器时仅匹配**首个**元素（`document.querySelector`）。多卡片场景应在每个卡片组件内独立调用：

```vue
<!-- mCountCard.vue -->
<script setup lang="ts">
import { ref } from "vue";
import { useIconEffect } from "@/components/ReIcon";

const props = defineProps<{ iconName: string }>();
const iconRef = ref<HTMLElement | null>(null);

useIconEffect({
	target: iconRef,
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
</script>
```

## API 参考

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

## 策略选择指南

| 用户场景                       | 推荐 strategy | 说明                                           |
| ------------------------------ | ------------- | ---------------------------------------------- |
| Vite + Vue3 大屏 / Dashboard   | `"gsap"`      | 充分利用 GSAP stagger 错峰 + 双重发光 CSS 变量 |
| uniapp / 小程序 / 对包体积敏感 | `"css"`       | 零外部依赖，纯 CSS `@keyframes` 呼吸           |
| 不确定项目类型                 | `"auto"`      | 运行时自动检测 `globalThis.gsap`，无感降级     |

## 已知约束与坑位

- **排除法判别**：永远不要用白名单匹配 fill 值来注入渐变。Iconify 渲染后的 SVG fill 属性值是不确定的（取决于 Iconify 内部实现），白名单会遗漏大量 case
- **定时重试链不可省略**：`onMounted` + Iconify `@on-load` 回调不足以保证渐变 100% 注入，必须配合 `setTimeout(fn, [0,80,200,500,1000])` 重试链
- **GSAP 使用动态 import**：模板用 `await import("gsap")` 而非顶层 `import gsap from "gsap"`，确保未安装时不阻塞打包
- **CSS 层不要删除**：JS 渐变注入失败时，CSS `color` + `drop-shadow` 仍能提供 fallback 视觉效果
- **outline 图标不受 JS 渐变影响**：`fill="none"` 自动跳过，仅依赖 CSS `color` 通过 `currentColor` 提供 stroke 颜色
- **`target` 支持两种方式**：`ref<HTMLElement | null>`（单个元素）或 `string`（CSS 选择器，仅查询第一个匹配元素，使用 `document.querySelector`）
- **按实例独立使用会丢失全局控制**：每个 `useIconEffect` 调用创建独立的 GSAP timeline。≥4 实例推荐使用全局协调器（见 `breath-coordinator.md`）恢复全局暂停/恢复能力
