/**
 * useIconEffect 全局协调器 — Pinia Store 版本
 *
 * 用于管理多个 useIconEffect 实例，提供全局暂停/恢复/销毁能力。
 * 适用场景：≥4 个 KPI 卡片 / 跨路由页面共享动画 / 需要统一暂停恢复。
 *
 * @module breathCoordinator
 * @requires pinia
 */

import { defineStore } from "pinia";
import { ref, computed, readonly } from "vue";
import type { UseIconEffectReturn } from "@/components/ReIcon/type";

export const useBreathCoordinatorStore = defineStore("breathCoordinator", () => {
	// ===== State =====

	/** 全局暂停标志，所有注册实例应监听此值 */
	const isPaused = ref(false);

	/** 当前激活的页面路由名 */
	const activePage = ref<string>("");

	/** 注册实例映射表（Map 保证 O(1) 注销） */
	const instanceMap = ref<Map<string, UseIconEffectReturn>>(new Map());

	let nextId = 0;

	// ===== Getters =====

	const instanceCount = computed(() => instanceMap.value.size);

	const pausedInstances = computed(() => (isPaused.value ? instanceCount.value : 0));

	// ===== Actions =====

	/**
	 * 注册一个 useIconEffect API 到协调器。
	 * 如果全局已暂停，注册时会立即同步暂停状态。
	 * @returns 注册 ID，用于后续 unregister
	 */
	function register(api: UseIconEffectReturn): string {
		const id = `kpi-${nextId++}`;
		instanceMap.value = new Map(instanceMap.value).set(id, api);

		if (isPaused.value) {
			api.stopBreath();
		}

		return id;
	}

	/**
	 * 注销并销毁指定实例。
	 * 通常在组件的 onUnmounted 中调用。
	 */
	function unregister(id: string) {
		const api = instanceMap.value.get(id);
		if (api) {
			api.destroy();
			const next = new Map(instanceMap.value);
			next.delete(id);
			instanceMap.value = next;
		}
	}

	/** 暂停所有注册实例的呼吸动画 */
	function pauseAll() {
		isPaused.value = true;
		instanceMap.value.forEach((api) => api.stopBreath());
	}

	/** 恢复所有注册实例的呼吸动画 */
	function resumeAll() {
		isPaused.value = false;
		instanceMap.value.forEach((api) => api.startBreath());
	}

	/** 销毁所有注册实例（通常在页面 onUnmounted 或应用销毁时调用） */
	function destroyAll() {
		instanceMap.value.forEach((api) => api.destroy());
		instanceMap.value = new Map();
	}

	/** 设置当前激活页面 */
	function setActivePage(page: string) {
		activePage.value = page;
	}

	return {
		// 只读状态
		isPaused: readonly(isPaused),
		activePage: readonly(activePage),
		instanceCount,
		pausedInstances,

		// 操作方法
		register,
		unregister,
		pauseAll,
		resumeAll,
		destroyAll,
		setActivePage,
	};
});
