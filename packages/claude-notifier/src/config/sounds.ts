import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import consola from "consola";
import { SoundPreset } from "../types/index.ts";
import { findResourceDir } from "./utils.ts";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 音频文件目录
 */
export const SOUNDS_DIR = findResourceDir(__dirname, "sounds");

/**
 * 默认音频文件名（在文件夹预设中使用）
 */
const DEFAULT_AUDIO_FILES = ["main.mp3", "index.mp3", "default.mp3"];

/**
 * 音频预设映射表
 * 将预设名称映射到实际的音频文件夹路径
 */
export const SOUND_PRESET_MAP: Record<SoundPreset, string | boolean> = {
	[SoundPreset.DEFAULT]: true, // true 表示使用系统默认音
	[SoundPreset.SUCCESS]: path.join(SOUNDS_DIR, "success"),
	[SoundPreset.WARNING]: path.join(SOUNDS_DIR, "warning"),
	[SoundPreset.ERROR]: path.join(SOUNDS_DIR, "error"),
	[SoundPreset.MANBO]: path.join(SOUNDS_DIR, "manbo"),
	[SoundPreset.NONE]: false, // false 表示静音
};

/**
 * 解析文件夹预设，找到默认音频文件
 * @param folderPath - 文件夹路径
 * @returns 音频文件路径或 undefined
 */
function resolveDefaultAudioInFolder(folderPath: string): string | undefined {
	if (!existsSync(folderPath)) {
		return undefined;
	}

	// 尝试查找默认音频文件
	for (const filename of DEFAULT_AUDIO_FILES) {
		const filePath = path.join(folderPath, filename);
		if (existsSync(filePath)) {
			return filePath;
		}
	}

	return undefined;
}

/**
 * 解析音频配置
 * @param sound - 音频预设或自定义路径
 * @returns 音频文件路径、true（系统默认）、false（静音）
 *
 * @example
 * // 使用预设（读取文件夹内的默认文件）
 * resolveSoundConfig("manbo") // -> sounds/manbo/main.mp3
 *
 * // 指定具体文件
 * resolveSoundConfig("manbo/01.mp3") // -> sounds/manbo/01.mp3
 *
 * // 使用绝对路径
 * resolveSoundConfig("C:/sounds/custom.mp3") // -> C:/sounds/custom.mp3
 */
export function resolveSoundConfig(sound?: SoundPreset | string): string | boolean {
	if (!sound) {
		return SOUND_PRESET_MAP[SoundPreset.DEFAULT];
	}

	// 检查是否是预设值（枚举值）
	if (Object.values(SoundPreset).includes(sound as SoundPreset)) {
		const presetValue = SOUND_PRESET_MAP[sound as SoundPreset];

		// 如果是 true 或 false，直接返回
		if (typeof presetValue === "boolean") {
			return presetValue;
		}

		// 如果是文件夹路径，尝试找到默认音频文件
		const defaultFile = resolveDefaultAudioInFolder(presetValue);
		if (defaultFile) {
			return defaultFile;
		}

		// 如果找不到默认文件，返回文件夹路径（让上层处理）
		return presetValue;
	}

	// 处理带路径分隔符的预设（如 "manbo/01.mp3"）
	if (sound.includes("/") || sound.includes("\\")) {
		// 检查是否以预设名开头
		for (const [presetKey, presetPath] of Object.entries(SOUND_PRESET_MAP)) {
			if (typeof presetPath === "string" && sound.startsWith(presetKey)) {
				// 构建完整路径
				const relativePath = sound.substring(presetKey.length).replace(/^[/\\]/, "");
				const fullPath = path.join(presetPath, relativePath);

				if (existsSync(fullPath)) {
					return fullPath;
				}
			}
		}

		// 如果不是预设路径，尝试相对于 SOUNDS_DIR 解析
		const relativeToSoundsDir = path.join(SOUNDS_DIR, sound);
		if (existsSync(relativeToSoundsDir)) {
			return relativeToSoundsDir;
		}
	}

	// 返回自定义路径（可能是绝对路径）
	return sound;
}
