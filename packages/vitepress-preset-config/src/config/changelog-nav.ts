// 为变更日志写入vitepress侧边栏排序yaml信息 并在导航栏内增加顶部入口便于快速阅读

import { type UserConfig, type DefaultTheme } from "vitepress";
import consola from "consola";
import { isUndefined } from "lodash-es";
import { hasChangelogMd } from "../utils/copy-changelog";

/**
 * 设置导航栏的变更日志
 * @description
 * 在导航栏内添加一行 变更日志 的入口
 *
 * 直接修改外部传递进来的配置对象即可
 * @private 内部使用即可
 */
export function handleChangeLog(userConfig: UserConfig<DefaultTheme.Config>) {
	if (!hasChangelogMd()) {
		consola.warn(` 未找到变更日志文件，不添加变更日志导航栏。 `);
		return;
	}

	const nav = userConfig?.themeConfig?.nav;

	if (isUndefined(nav)) {
		consola.error(` 当前的用户配置为： `, userConfig);
		throw new Error(` nav 默认提供的导航栏配置为空。不符合默认配置，请检查。 `);
	}

	nav.push({ text: "更新日志", link: "/CHANGELOG.md" });
}
