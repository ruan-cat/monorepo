import { defineComponent, h } from "vue";
import type { Component } from "vue";
import IconifyIconOffline from "./iconifyIconOffline";
import IconifyIconOnline from "./iconifyIconOnline";
import { resolveOfflineIcon } from "./offlineIcon";

export type ReIconSource = string | Component;
export type ReIconAttrs = Record<string, unknown>;

function isVueComponent(icon: unknown): icon is Component {
	if (!icon || typeof icon !== "object") {
		return typeof icon === "function";
	}

	return "render" in icon || "setup" in icon;
}

export function pickIconRenderer(icon: ReIconSource) {
	if (typeof icon !== "string") {
		return IconifyIconOffline;
	}

	return resolveOfflineIcon(icon) || !icon.includes(":") ? IconifyIconOffline : IconifyIconOnline;
}

export function useRenderIcon(icon: ReIconSource, attrs: ReIconAttrs = {}): Component {
	if (isVueComponent(icon)) {
		return defineComponent({
			name: "RenderedLocalIcon",
			render() {
				return h(icon, attrs);
			},
		});
	}

	const renderer = pickIconRenderer(icon);

	return defineComponent({
		name: "RenderedIcon",
		render() {
			return h(renderer, { icon, ...attrs });
		},
	});
}
