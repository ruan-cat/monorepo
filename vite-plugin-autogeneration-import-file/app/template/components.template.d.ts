/* eslint-disable */
// @ts-nocheck

/**
 * 这是特定模板
 *
 * 让 vite-plugin-autogeneration-import-file 生成 GlobalComponents。
 *
 * 但是有特别的文件命名规则
 *
 * @author f1-阮喵喵
 */

// TODO: 尝试使用新的方式实现组件类型生成
/* prettier-ignore */
declare module "vue" {
	export interface GlobalComponents {
		//code
	}
}

// 有疑惑 疑似无效
// import '@vue/runtime-core'
// export {};
// declare module "@vue/runtime-core" {
// 	export interface GlobalComponents {
// 		//notuse-now-code-notuse-now
// 	}
// }

/* prettier-ignore */
declare global {
	//typeCode
}

/* prettier-ignore */
export {};
