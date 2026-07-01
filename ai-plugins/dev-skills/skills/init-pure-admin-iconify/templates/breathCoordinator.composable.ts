/**
 * useIconEffect 全局协调器 — 纯 Composable 版本（零依赖）
 *
 * 用于管理多个 useIconEffect 实例，提供全局暂停/恢复/销毁能力。
 * 适用场景：需要全局协调但不希望引入 Pinia 的项目。
 *
 * @module breathCoordinator
 */

import { ref, computed, readonly } from "vue";
import type { UseIconEffectReturn } from "@/components/ReIcon/type";

// 全局单例状态（模块级变量，整个应用共享）
const isPaused = ref(false);
const activePage = ref<string>("");
const instanceMap = ref<Map<string, UseIconEffectReturn>>(new Map());
const instanceCount = computed(() => instanceMap.value.size);
let nextId = 0;

export function useBreathCoordinator() {
	/**
	 * 注册一个 useIconEffect API 到协调器。
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

	/** 暂停所有注册实例 */
	function pauseAll() {
		isPaused.value = true;
		instanceMap.value.forEach((api) => api.stopBreath());
	}

	/** 恢复所有注册实例 */
	function resumeAll() {
		isPaused.value = false;
		instanceMap.value.forEach((api) => api.startBreath());
	}

	/** 销毁所有注册实例 */
	function destroyAll() {
		instanceMap.value.forEach((api) => api.destroy());
		instanceMap.value = new Map();
	}

	function setActivePage(page: string) {
		activePage.value = page;
	}

	return {
		isPaused: readonly(isPaused),
		activePage: readonly(activePage),
		instanceCount,

		register,
		unregister,
		pauseAll,
		resumeAll,
		destroyAll,
		setActivePage,
	};
}
