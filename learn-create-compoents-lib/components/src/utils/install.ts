import type { App, Plugin } from "vue";
export type SFCWithInstall<T> = T & Plugin;
export const withInstall = <T, E extends Record<string, any>>(main: T, extra?: E) => {
	(main as SFCWithInstall<T>).install = (app): void => {
		for (const comp of [main, ...Object.values(extra ?? {})]) {
			app.component(comp.name, comp);
		}
	};

	if (extra) {
		for (const [key, comp] of Object.entries(extra)) {
			(main as any)[key] = comp;
		}
	}
	return main as SFCWithInstall<T> & E;
};

/**
 * makeInstaller 实际上也是一个vue插件，他将组件插件循环进行安装，也是从element-plus复制的😂。
 */
export const makeInstaller = (components: Plugin[] = []) => {
	const install = (app: App) => {
		console.log(components);
		components.forEach((c) => app.use(c));
	};
	return {
		install,
	};
};
