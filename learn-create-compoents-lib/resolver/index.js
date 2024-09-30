// index.js — 解析插件的入口文件

/**
 * 上面的代码大概意思是，解析到一个组件以“Gie”开头时，
 * 返回组件名称、组件位置、组件样式位置给unplugin-vue-components
 * 和 unplugin-auto-import 自动导入。
 */

function GieResolver() {
	return {
		type: "component",
		resolve: (name) => {
			if (name.startsWith("Gie")) {
				const partialName = name.slice(3);
				return {
					name: "Gie" + partialName,
					from: `@giegie/components`,
					sideEffects: `@giegie/components/es/${partialName}/style/index.css`,
				};
			}
		},
	};
}

module.exports = {
	GieResolver,
};
