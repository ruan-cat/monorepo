/**
 * index.ts — 定义Input组件的入口文件
 *
 * 在入口文件中，使用withInstall封装了一下导入的Input组件，并默认导出。
 *
 * 且在下面导出了所有类型文件。
 *
 * 这个withInstall函数的作用就是把组件封装成了一个可被安装，带install方法的vue插件，
 * 这个函数我是直接从element-plus项目复制的😂。
 *
 * typescript 代码解读复制代码
 */

import { withInstall } from "../utils/install";

import Input from "./Input.vue";

export const GieInput = withInstall(Input);
export default GieInput;

export * from "./Input.vue";
export * from "./Input";
