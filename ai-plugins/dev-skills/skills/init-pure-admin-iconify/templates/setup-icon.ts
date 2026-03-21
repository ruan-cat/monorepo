import type { App } from "vue";
// @ts-ignore 忽略类型错误。 在具体覆盖到目标仓库时，请删除掉这条注释。本注释仅仅是为了避免本仓库出现类型报错。
import { IconifyIconOffline, IconifyIconOnline, registerOfflineIcons } from "@/components/ReIcon";

export function setupIcon(app: App) {
	registerOfflineIcons(app);
	app.component("IconifyIconOffline", IconifyIconOffline);
	app.component("IconifyIconOnline", IconifyIconOnline);
}
