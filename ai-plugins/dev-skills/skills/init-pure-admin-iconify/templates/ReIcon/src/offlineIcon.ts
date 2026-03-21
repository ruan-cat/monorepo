import type { App, Component } from "vue";
import { markRaw } from "vue";
import EpMenu from "~icons/ep/menu";
import EpSearch from "~icons/ep/search";
import EpSetting from "~icons/ep/setting";
import EpUser from "~icons/ep/user";

const offlineIcons = {
	"ep/menu": markRaw(EpMenu),
	"ep/search": markRaw(EpSearch),
	"ep/setting": markRaw(EpSetting),
	"ep/user": markRaw(EpUser),
} satisfies Record<string, Component>;

const aliasIcons = {
	IconMenu: offlineIcons["ep/menu"],
	IconSearch: offlineIcons["ep/search"],
	IconSetting: offlineIcons["ep/setting"],
	IconUser: offlineIcons["ep/user"],
} satisfies Record<string, Component>;

function normalizeOfflineIconName(icon: string): string {
	return icon.replace(/:/g, "/").trim();
}

export function resolveOfflineIcon(icon: string): Component | undefined {
	if (icon in aliasIcons) {
		return aliasIcons[icon as keyof typeof aliasIcons];
	}

	return offlineIcons[normalizeOfflineIconName(icon) as keyof typeof offlineIcons];
}

export function registerOfflineIcons(app: App) {
	for (const [name, component] of Object.entries(aliasIcons)) {
		app.component(name, component);
	}
}
