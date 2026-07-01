// useIconEffect.ts — Iconify SVG 渐变色注入 + 呼吸动画
// 基于 gzpc-big-screen mCountCard 组件实战验证方案
// 约束: §7.3 排除法判别 / §7.4 定时重试链 / §4.3 CSS+JS双层

import { onUnmounted, type Ref } from "vue";

// ============ 类型定义（本地副本，运行时不依赖 type.ts） ============

export interface GradientStop {
	offset: string;
	color: string;
}

export interface IconGradientConfig {
	id?: string;
	direction?: "tl-br" | "l-r" | "t-b" | { x1: string; y1: string; x2: string; y2: string };
	stops: GradientStop[];
	retryDelays?: number[];
}

export interface BreathGsapParams {
	scale?: [number, number];
	opacity?: [number, number];
	glowRadius?: [string, string];
	glowAlpha?: [number, number];
	haloS?: [number, number];
	haloO?: [number, number];
	duration?: number;
	ease?: string;
}

export interface BreathCssParams {
	scale?: [number, number];
	opacity?: [number, number];
	duration?: number;
}

export interface IconBreathConfig {
	strategy: "gsap" | "css" | "auto";
	gsap?: BreathGsapParams;
	css?: BreathCssParams;
	cssVarNames?: {
		glowR?: string;
		glowA?: string;
		glowR2?: string;
		glowA2?: string;
		haloS?: string;
		haloO?: string;
	};
}

export interface UseIconEffectOptions {
	target: Ref<HTMLElement | null> | string;
	gradient?: IconGradientConfig | false;
	breath?: IconBreathConfig | false;
}

// ============ 预设常量 ============

const DEFAULT_RETRY_DELAYS = [0, 80, 200, 500, 1000];

const DIRECTION_MAP: Record<string, { x1: string; y1: string; x2: string; y2: string }> = {
	"tl-br": { x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
	"l-r": { x1: "0%", y1: "0%", x2: "100%", y2: "0%" },
	"t-b": { x1: "0%", y1: "0%", x2: "0%", y2: "100%" },
};

// ============ 工具函数 ============

function resolveDirection(direction: IconGradientConfig["direction"]): {
	x1: string;
	y1: string;
	x2: string;
	y2: string;
} {
	if (!direction) return DIRECTION_MAP["tl-br"];
	if (typeof direction === "string") return DIRECTION_MAP[direction] ?? DIRECTION_MAP["tl-br"];
	return direction;
}

function resolveTarget(target: UseIconEffectOptions["target"]): HTMLElement | null {
	if (typeof target === "string") return document.querySelector<HTMLElement>(target);
	return target?.value ?? null;
}

// ============ 渐变注入（排除法） ============

function createLinearGradient(svg: SVGSVGElement, config: IconGradientConfig): SVGLinearGradientElement {
	const id = config.id ?? "iconGrad";

	let defs = svg.querySelector("defs");
	if (!defs) {
		defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		svg.insertBefore(defs, svg.firstChild);
	}

	const dir = resolveDirection(config.direction);
	const grad = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
	grad.id = id;
	grad.setAttribute("x1", dir.x1);
	grad.setAttribute("y1", dir.y1);
	grad.setAttribute("x2", dir.x2);
	grad.setAttribute("y2", dir.y2);

	for (const stop of config.stops) {
		const s = document.createElementNS("http://www.w3.org/2000/svg", "stop");
		s.setAttribute("offset", stop.offset);
		s.setAttribute("stop-color", stop.color);
		grad.appendChild(s);
	}

	defs.appendChild(grad);
	return grad;
}

/**
 * 向 Iconify SVG 注入线性渐变（排除法判别）
 *
 * 只跳过两种明确不该碰的：
 * - fill="none"：outline 图标的空心区域（由 CSS color 提供 stroke 色）
 * - url(#...)：已注入渐变
 *
 * ⚠️ 禁止白名单匹配（如 if (!fill || fill === "currentColor")）
 *    详见 gzpc-big-screen bug-fix §7.3
 */
function applyGradientToSvg(svg: SVGSVGElement, config: IconGradientConfig): boolean {
	if (!svg) return false;

	const id = config.id ?? "iconGrad";

	// 幂等：已注入过则跳过
	if (svg.querySelector(`#${id}`)) return true;

	// 创建 gradient
	createLinearGradient(svg, config);

	// 排除法覆盖 fill
	const shapes = svg.querySelectorAll<SVGElement>("path, circle, rect, polygon, polyline, line, ellipse");
	shapes.forEach((el) => {
		const fill = el.getAttribute("fill") ?? "";
		if (fill === "none" || fill.startsWith("url(#")) return;
		el.setAttribute("fill", `url(#${id})`);
	});

	return true;
}

// ============ 定时重试链 ============

function createRetryChain(applyFn: () => void, retryDelays: number[] = DEFAULT_RETRY_DELAYS): () => void {
	const timers: number[] = [];

	applyFn(); // 立即尝试

	retryDelays.forEach((delay) => {
		timers.push(window.setTimeout(applyFn, delay));
	});

	return () => timers.forEach(clearTimeout);
}

// ============ GSAP 呼吸动画 ============

async function setupGsapBreath(target: HTMLElement, config: NonNullable<IconBreathConfig>): Promise<() => void> {
	try {
		const gsapMod = await import("gsap");
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const gsap = (gsapMod as any).gsap ?? gsapMod;

		const iconEls = target.querySelectorAll<HTMLElement>(".iconify");
		if (!iconEls.length) return () => {};

		const cssVars = config.cssVarNames ?? {};
		const glowR = cssVars.glowR ?? "--glow-r";
		const glowA = cssVars.glowA ?? "--glow-a";
		const glowR2 = cssVars.glowR2 ?? "--glow-r2";
		const glowA2 = cssVars.glowA2 ?? "--glow-a2";
		const haloS = cssVars.haloS ?? "--halo-s";
		const haloO = cssVars.haloO ?? "--halo-o";

		const gsapConf = config.gsap ?? {};
		const [scaleMin, scaleMax] = gsapConf.scale ?? [1, 1.12];
		const [opacityMin, opacityMax] = gsapConf.opacity ?? [0.98, 0.86];
		const [glowRMin, glowRMax] = gsapConf.glowRadius ?? ["6px", "24px"];
		const [glowAMin, glowAMax] = gsapConf.glowAlpha ?? [0.62, 1.0];
		const [glowR2Min, glowR2Max] = gsapConf.glowRadius ?? ["12px", "42px"];
		const [glowA2Min, glowA2Max] = gsapConf.glowAlpha ?? [0.32, 0.78];
		const [haloSMin, haloSMax] = gsapConf.haloS ?? [0.82, 1.3];
		const [haloOMin, haloOMax] = gsapConf.haloO ?? [0, 0.58];
		const duration = gsapConf.duration ?? 2.2;
		const ease = gsapConf.ease ?? "sine.inOut";

		// 设置 CSS 自定义属性初始值
		gsap.set(iconEls, {
			[glowR]: glowRMin,
			[glowA]: glowAMin,
			[glowR2]: glowR2Min,
			[glowA2]: glowA2Min,
			scale: scaleMin,
			opacity: opacityMin,
		});

		const timeline = gsap.timeline({
			repeat: -1,
			yoyo: true,
			defaults: { ease, duration },
		});

		timeline.to(
			iconEls,
			{
				[glowR]: glowRMax,
				[glowA]: glowAMax,
				[glowR2]: glowR2Max,
				[glowA2]: glowA2Max,
				scale: scaleMax,
				opacity: opacityMax,
				stagger: { each: 0.45, from: "start" },
			},
			0,
		);

		// Container halo animation
		const wrappers = target.querySelectorAll<HTMLElement>(".icon-effect-container");
		if (wrappers.length) {
			gsap.set(wrappers, { [haloS]: haloSMin, [haloO]: haloOMin });
			timeline.to(
				wrappers,
				{
					[haloS]: haloSMax,
					[haloO]: haloOMax,
					stagger: { each: 0.45, from: "start" },
				},
				0,
			);
		}

		return () => {
			timeline.kill();
		};
	} catch {
		console.warn("[useIconEffect] gsap not available, falling back to CSS animation");
		return () => {};
	}
}

// ============ CSS 呼吸动画 ============

function setupCssBreath(target: HTMLElement, config: NonNullable<IconBreathConfig>, uid: string): () => void {
	const styleId = `icon-breath-style-${uid}`;
	if (document.getElementById(styleId)) return () => {};

	const cssConf = config.css ?? {};
	const [scaleMin, scaleMax] = cssConf.scale ?? [1, 1.12];
	const [opacityMin, opacityMax] = cssConf.opacity ?? [0.98, 0.86];
	const duration = cssConf.duration ?? 2.2;

	const keyframesId = `iconBreath-${uid}`;

	const style = document.createElement("style");
	style.id = styleId;
	style.textContent = `@keyframes ${keyframesId} {
  0%, 100% {
    scale: ${scaleMin};
    opacity: ${opacityMin};
  }
  50% {
    scale: ${scaleMax};
    opacity: ${opacityMax};
  }
}
[data-icon-effect="${uid}"] .iconify {
  animation: ${keyframesId} ${duration}s ease-in-out infinite alternate;
  transform-origin: center center;
}`;

	document.head.appendChild(style);
	target.setAttribute("data-icon-effect", uid);

	return () => {
		style.remove();
		target.removeAttribute("data-icon-effect");
	};
}

// ============ 核心入口 ============

let uidCounter = 0;

/**
 * Iconify 图标视觉效果 composable
 *
 * 提供两类能力：
 * - 渐变填充：排除法向 SVG 注入 <linearGradient>
 * - 呼吸动画：GSAP / CSS / Auto 三策略
 *
 * @param options - 效果配置
 * @returns { applyGradient, startBreath, stopBreath, destroy }
 *
 * @example 基础渐变
 * ```ts
 * const iconRef = ref<HTMLElement | null>(null)
 * const { applyGradient } = useIconEffect({
 *   target: iconRef,
 *   gradient: {
 *     stops: [{ offset: '0%', color: '#3cd8ff' }, { offset: '100%', color: '#2f73ff' }],
 *   },
 * })
 * ```
 *
 * @example 完整方案（渐变 + GSAP 呼吸）
 * ```ts
 * const { startBreath } = useIconEffect({
 *   target: '.kpi-icon',
 *   gradient: {
 *     stops: [{ offset: '0%', color: '#3cd8ff' }, { offset: '100%', color: '#2f73ff' }],
 *   },
 *   breath: { strategy: 'gsap', gsap: { scale: [1, 1.12], duration: 2.2 } },
 * })
 * onMounted(() => startBreath())
 * ```
 */
export function useIconEffect(options: UseIconEffectOptions) {
	const uid = String(++uidCounter);
	let timersCleanup: (() => void) | null = null;
	let breathCleanup: (() => void) | null = null;

	// ---- applyGradient ----
	const applyGradient = () => {
		if (options.gradient === false) return;
		try {
			const el = resolveTarget(options.target);
			if (!el) return;
			const svg = el.querySelector<SVGSVGElement>("svg");
			if (!svg) return;
			applyGradientToSvg(svg, options.gradient ?? { stops: [] });
		} catch {
			// 静默失败，不因 DOM 操作崩溃
		}
	};

	// 启动定时重试链
	const gradientConfig = options.gradient as IconGradientConfig | undefined;
	if (gradientConfig) {
		timersCleanup = createRetryChain(applyGradient, gradientConfig.retryDelays ?? DEFAULT_RETRY_DELAYS);
	}

	// ---- startBreath ----
	const startBreath = async () => {
		if (options.breath === false || !options.breath) return;
		if (breathCleanup) return; // 幂等

		const config = options.breath;
		const strategy = config.strategy ?? "auto";

		const el = resolveTarget(options.target);
		if (!el) return;

		if (strategy === "gsap") {
			breathCleanup = await setupGsapBreath(el, config);
		} else if (strategy === "css") {
			breathCleanup = setupCssBreath(el, config, uid);
		} else {
			// auto: 先尝试 GSAP，失败降级 CSS
			breathCleanup = await setupGsapBreath(el, config);
			// 检查是否成功（GSAP 不可用时返回空函数）
			if (!breathCleanup) {
				breathCleanup = setupCssBreath(el, config, uid);
			}
		}
	};

	// ---- stopBreath ----
	const stopBreath = () => {
		breathCleanup?.();
		breathCleanup = null;
	};

	// ---- destroy ----
	const destroy = () => {
		timersCleanup?.();
		timersCleanup = null;
		stopBreath();
	};

	onUnmounted(destroy);

	return { applyGradient, startBreath, stopBreath, destroy };
}
