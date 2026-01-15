<script setup lang="ts">
/**
 * 主题切换按钮组件
 * @description
 * 在导航栏显示主题切换按钮，点击后显示下拉菜单供用户选择主题
 * @see Requirements 1.1, 1.3
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import type { ThemeDefinition } from "../../types";

/**
 * 组件属性
 */
interface Props {
	/** 当前主题 ID */
	currentTheme: string;
	/** 可用主题列表 */
	themes: ThemeDefinition[];
	/** 按钮文本，默认 '主题' */
	buttonText?: string;
}

/**
 * 组件事件
 */
interface Emits {
	/** 主题切换事件 */
	(e: "switch", themeId: string): void;
}

const props = withDefaults(defineProps<Props>(), {
	buttonText: "主题",
});

const emit = defineEmits<Emits>();

/** 下拉菜单是否显示 */
const isOpen = ref(false);

/** 按钮元素引用 */
const buttonRef = ref<HTMLButtonElement | null>(null);

/** 下拉菜单位置 */
const dropdownStyle = ref({
	top: "0px",
	left: "0px",
});

/** 当前主题的显示名称 */
const currentThemeName = computed(() => {
	const theme = props.themes.find((t) => t.id === props.currentTheme);
	return theme?.name ?? props.currentTheme;
});

/**
 * 更新下拉菜单位置
 */
function updateDropdownPosition() {
	if (!buttonRef.value) return;

	const rect = buttonRef.value.getBoundingClientRect();
	dropdownStyle.value = {
		top: `${rect.bottom + 8}px`,
		left: `${rect.left}px`,
	};
}

/**
 * 切换下拉菜单显示状态
 */
function toggleDropdown(event: MouseEvent) {
	event.preventDefault();
	event.stopPropagation();

	isOpen.value = !isOpen.value;

	if (isOpen.value) {
		nextTick(() => {
			updateDropdownPosition();
		});
	}
}

/**
 * 关闭下拉菜单
 */
function closeDropdown() {
	isOpen.value = false;
}

/**
 * 选择主题
 * @param themeId - 选中的主题 ID
 */
function selectTheme(themeId: string, event: MouseEvent) {
	event.preventDefault();
	event.stopPropagation();

	if (themeId !== props.currentTheme) {
		emit("switch", themeId);
	}
	closeDropdown();
}

/**
 * 处理点击外部关闭下拉菜单
 */
function handleClickOutside(event: MouseEvent) {
	const target = event.target as HTMLElement;
	if (!target.closest(".theme-switcher") && !target.closest(".theme-dropdown")) {
		closeDropdown();
	}
}

/**
 * 处理滚动时更新位置或关闭
 */
function handleScroll() {
	if (isOpen.value) {
		closeDropdown();
	}
}

onMounted(() => {
	document.addEventListener("click", handleClickOutside);
	window.addEventListener("scroll", handleScroll, true);
	window.addEventListener("resize", handleScroll);
});

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside);
	window.removeEventListener("scroll", handleScroll, true);
	window.removeEventListener("resize", handleScroll);
});
</script>

<template>
	<div class="theme-switcher">
		<button
			ref="buttonRef"
			class="theme-switcher-button"
			:class="{ 'is-open': isOpen }"
			:aria-expanded="isOpen"
			aria-haspopup="listbox"
			@click="toggleDropdown"
		>
			<span class="button-text">{{ buttonText }}</span>
			<span class="current-theme">{{ currentThemeName }}</span>
			<svg
				class="dropdown-icon"
				:class="{ 'is-open': isOpen }"
				xmlns="http://www.w3.org/2000/svg"
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>

		<Teleport to="body">
			<Transition name="dropdown">
				<div v-if="isOpen" class="theme-dropdown" role="listbox" :style="dropdownStyle">
					<button
						v-for="theme in themes"
						:key="theme.id"
						class="theme-option"
						:class="{ 'is-active': theme.id === currentTheme }"
						role="option"
						:aria-selected="theme.id === currentTheme"
						@click="selectTheme(theme.id, $event)"
					>
						<span class="theme-name">{{ theme.name }}</span>
						<span v-if="theme.description" class="theme-description">{{ theme.description }}</span>
						<svg
							v-if="theme.id === currentTheme"
							class="check-icon"
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</button>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<style scoped>
.theme-switcher {
	display: inline-flex;
	align-items: center;
}

.theme-switcher-button {
	display: flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border: 1px solid var(--vp-c-divider, rgba(60, 60, 67, 0.12));
	border-radius: 8px;
	background: var(--vp-c-bg, #fff);
	color: var(--vp-c-text-1, rgba(60, 60, 67, 1));
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.25s ease;
	white-space: nowrap;
}

/* VoidZero 主题暗色模式适配 */
:root.dark .theme-switcher-button {
	background: var(--vp-c-bg, #1a1a1a);
	border-color: var(--vp-c-divider, rgba(255, 255, 255, 0.12));
	color: var(--vp-c-text-1, rgba(255, 255, 255, 0.87));
}

.theme-switcher-button:hover {
	border-color: var(--vp-c-brand-1, #646cff);
	color: var(--vp-c-brand-1, #646cff);
}

.theme-switcher-button.is-open {
	border-color: var(--vp-c-brand-1, #646cff);
}

.button-text {
	color: var(--vp-c-text-2, rgba(60, 60, 67, 0.78));
	font-weight: 400;
}

:root.dark .button-text {
	color: var(--vp-c-text-2, rgba(255, 255, 255, 0.6));
}

.current-theme {
	color: var(--vp-c-text-1, rgba(60, 60, 67, 1));
}

:root.dark .current-theme {
	color: var(--vp-c-text-1, rgba(255, 255, 255, 0.87));
}

.dropdown-icon {
	transition: transform 0.25s ease;
}

.dropdown-icon.is-open {
	transform: rotate(180deg);
}

.theme-dropdown {
	position: fixed;
	min-width: 200px;
	padding: 8px;
	border: 1px solid var(--vp-c-divider, rgba(60, 60, 67, 0.12));
	border-radius: 12px;
	background: var(--vp-c-bg-elv, #fff);
	box-shadow:
		0 12px 32px rgba(0, 0, 0, 0.1),
		0 2px 6px rgba(0, 0, 0, 0.08);
	z-index: 9999;
}

:root.dark .theme-dropdown {
	background: var(--vp-c-bg-elv, #242424);
	border-color: var(--vp-c-divider, rgba(255, 255, 255, 0.12));
	box-shadow:
		0 12px 32px rgba(0, 0, 0, 0.3),
		0 2px 6px rgba(0, 0, 0, 0.2);
}

.theme-option {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	width: 100%;
	padding: 10px 12px;
	border: none;
	border-radius: 8px;
	background: transparent;
	color: var(--vp-c-text-1, rgba(60, 60, 67, 1));
	font-size: 14px;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.2s ease;
	position: relative;
}

:root.dark .theme-option {
	color: var(--vp-c-text-1, rgba(255, 255, 255, 0.87));
}

.theme-option:hover {
	background: var(--vp-c-bg-soft, rgba(142, 150, 170, 0.14));
}

:root.dark .theme-option:hover {
	background: var(--vp-c-bg-soft, rgba(101, 117, 133, 0.16));
}

.theme-option.is-active {
	background: var(--vp-c-brand-soft, rgba(100, 108, 255, 0.14));
	color: var(--vp-c-brand-1, #646cff);
}

.theme-name {
	font-weight: 500;
}

.theme-description {
	font-size: 12px;
	color: var(--vp-c-text-2, rgba(60, 60, 67, 0.78));
	margin-top: 2px;
}

:root.dark .theme-description {
	color: var(--vp-c-text-2, rgba(255, 255, 255, 0.6));
}

.theme-option.is-active .theme-description {
	color: var(--vp-c-brand-2, #747bff);
}

.check-icon {
	position: absolute;
	right: 12px;
	top: 50%;
	transform: translateY(-50%);
	color: var(--vp-c-brand-1, #646cff);
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
	transition: all 0.2s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
	opacity: 0;
	transform: translateY(-8px);
}
</style>
