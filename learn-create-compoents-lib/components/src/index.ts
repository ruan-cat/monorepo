/**
 * index.ts — 组件库入口文件，在这个文件里，
 * 我们需要导出components.ts 里代理的vue组件和类型，
 * 并将installs.ts 导出的插件数组交给makeInstaller
 * 处理成一个支持整体导入的插件：
 */

import { makeInstaller } from "./utils/install";
import installs from "./installs";

export * from "./components";

export default makeInstaller([...installs]);
