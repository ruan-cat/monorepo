import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { IconPreset } from "../types/index.ts";
import { findResourceDir } from "./utils.ts";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 图标文件目录
 */
export const ICONS_DIR = findResourceDir(__dirname, "icons");

/**
 * 默认图标文件名（在文件夹预设中使用）
 */
const DEFAULT_ICON_FILES = ["icon.png", "index.png", "default.png", "main.png"];

/**
 * 图标预设映射表
 * 将预设名称映射到实际的图标文件夹路径
 */
export const ICON_PRESET_MAP: Record<IconPreset, string> = {
	[IconPreset.SUCCESS]: path.join(ICONS_DIR, "success"),
	[IconPreset.WARNING]: path.join(ICONS_DIR, "warning"),
	[IconPreset.ERROR]: path.join(ICONS_DIR, "error"),
	[IconPreset.INFO]: path.join(ICONS_DIR, "info"),
	[IconPreset.CLOCK]: path.join(ICONS_DIR, "clock"),
};

/**
 * 解析文件夹预设，找到默认图标文件
 * @param folderPath - 文件夹路径
 * @returns 图标文件路径或 undefined
 */
function resolveDefaultIconInFolder(folderPath: string): string | undefined {
	if (!existsSync(folderPath)) {
		return undefined;
	}

	// 尝试查找默认图标文件
	for (const filename of DEFAULT_ICON_FILES) {
		const filePath = path.join(folderPath, filename);
		if (existsSync(filePath)) {
			return filePath;
		}
	}

	return undefined;
}

/**
 * 解析图标配置
 * @param icon - 图标预设或自定义路径
 * @returns 图标文件路径
 *
 * @example
 * // 使用预设（读取文件夹内的默认文件）
 * resolveIconConfig("success") // -> icons/success/icon.png
 *
 * // 指定具体文件
 * resolveIconConfig("success/custom.png") // -> icons/success/custom.png
 *
 * // 使用绝对路径
 * resolveIconConfig("C:/icons/custom.png") // -> C:/icons/custom.png
 */
export function resolveIconConfig(icon?: IconPreset | string): string | undefined {
	if (!icon) {
		return undefined;
	}

	// 检查是否是预设值（枚举值）
	if (Object.values(IconPreset).includes(icon as IconPreset)) {
		const presetPath = ICON_PRESET_MAP[icon as IconPreset];

		// 尝试找到默认图标文件
		const defaultFile = resolveDefaultIconInFolder(presetPath);
		if (defaultFile) {
			return defaultFile;
		}

		// 如果找不到默认文件，返回文件夹路径（让上层处理）
		return presetPath;
	}

	// 处理带路径分隔符的预设（如 "success/custom.png"）
	if (icon.includes("/") || icon.includes("\\")) {
		// 检查是否以预设名开头
		for (const [presetKey, presetPath] of Object.entries(ICON_PRESET_MAP)) {
			if (icon.startsWith(presetKey)) {
				// 构建完整路径
				const relativePath = icon.substring(presetKey.length).replace(/^[/\\]/, "");
				const fullPath = path.join(presetPath, relativePath);

				if (existsSync(fullPath)) {
					return fullPath;
				}
			}
		}

		// 如果不是预设路径，尝试相对于 ICONS_DIR 解析
		const relativeToIconsDir = path.join(ICONS_DIR, icon);
		if (existsSync(relativeToIconsDir)) {
			return relativeToIconsDir;
		}
	}

	// 返回自定义路径（可能是绝对路径）
	return icon;
}
