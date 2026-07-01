import type { Component } from "vue";

export interface ReIconProps {
	icon: string | Component;
}

export interface ReIconOption {
	label: string;
	icon: string | Component;
	description?: string;
}

// ========== useIconEffect 效果类型 ==========

/** 渐变方向预设 */
export type GradientPresetDirection = "tl-br" | "l-r" | "t-b";

/** 渐变色标 */
export interface GradientStop {
	offset: string;
	color: string;
}

/** 渐变配置 */
export interface IconGradientConfig {
	/** gradient ID，多实例必须唯一，默认 "iconGrad" */
	id?: string;
	/** 渐变方向：预设或自定义坐标，默认 tl-br */
	direction?: GradientPresetDirection | { x1: string; y1: string; x2: string; y2: string };
	/** 渐变色标数组 */
	stops: GradientStop[];
	/** 定时重试链 (ms)，默认 [0, 80, 200, 500, 1000] */
	retryDelays?: number[];
}

/** GSAP 呼吸动画参数 */
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

/** CSS 呼吸动画参数 */
export interface BreathCssParams {
	scale?: [number, number];
	opacity?: [number, number];
	duration?: number;
}

/** 呼吸动画配置 */
export interface IconBreathConfig {
	/** 动画策略 */
	strategy: "gsap" | "css" | "auto";
	gsap?: BreathGsapParams;
	css?: BreathCssParams;
	/** CSS 自定义属性名映射，避免与项目变量冲突 */
	cssVarNames?: {
		glowR?: string;
		glowA?: string;
		glowR2?: string;
		glowA2?: string;
		haloS?: string;
		haloO?: string;
	};
}

/** useIconEffect 完整选项 */
export interface UseIconEffectOptions {
	/** 图标容器 ref 或 CSS 选择器 */
	target: import("vue").Ref<HTMLElement | null> | string;
	gradient?: IconGradientConfig | false;
	breath?: IconBreathConfig | false;
}

/** useIconEffect 返回值 */
export interface UseIconEffectReturn {
	applyGradient: () => void;
	startBreath: () => void;
	stopBreath: () => void;
	destroy: () => void;
}
