/// <reference types="vite/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";
	const component: DefineComponent<{}, {}, any>;
	export default component;
}

/**
 * @see https://github.com/unplugin/unplugin-vue-markdown#typescript-shim
 */
declare module "*.md" {
	import type { ComponentOptions } from "vue";
	const Component: ComponentOptions;
	export default Component;
}
