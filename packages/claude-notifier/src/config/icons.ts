import path from "node:path";
import { fileURLToPath } from "node:url";
import { IconPreset } from "../types/index.ts";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 图标文件目录
 */
export const ICONS_DIR = path.join(__dirname, "..", "assets", "icons");

/**
 * 图标预设映射表
 * 将预设名称映射到实际的图标文件路径
 */
export const ICON_PRESET_MAP: Record<IconPreset, string> = {
	[IconPreset.SUCCESS]: path.join(ICONS_DIR, "success.png"),
	[IconPreset.WARNING]: path.join(ICONS_DIR, "warning.png"),
	[IconPreset.ERROR]: path.join(ICONS_DIR, "error.png"),
	[IconPreset.INFO]: path.join(ICONS_DIR, "info.png"),
	[IconPreset.CLOCK]: path.join(ICONS_DIR, "clock.png"),
};

/**
 * 解析图标配置
 * @param icon - 图标预设或自定义路径
 * @returns 图标文件路径
 */
export function resolveIconConfig(icon?: IconPreset | string): string | undefined {
	if (!icon) {
		return undefined;
	}

	// 检查是否是预设值
	if (Object.values(IconPreset).includes(icon as IconPreset)) {
		return ICON_PRESET_MAP[icon as IconPreset];
	}

	// 返回自定义路径
	return icon;
}
