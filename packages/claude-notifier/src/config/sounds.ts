import path from "node:path";
import { fileURLToPath } from "node:url";
import { SoundPreset } from "../types/index.ts";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 音频文件目录
 */
export const SOUNDS_DIR = path.join(__dirname, "..", "assets", "sounds");

/**
 * 音频预设映射表
 * 将预设名称映射到实际的音频文件路径
 */
export const SOUND_PRESET_MAP: Record<SoundPreset, string | boolean> = {
	[SoundPreset.DEFAULT]: true, // true 表示使用系统默认音
	[SoundPreset.SUCCESS]: path.join(SOUNDS_DIR, "success.wav"),
	[SoundPreset.WARNING]: path.join(SOUNDS_DIR, "warning.wav"),
	[SoundPreset.ERROR]: path.join(SOUNDS_DIR, "error.wav"),
	[SoundPreset.MANBO]: path.join(SOUNDS_DIR, "manbo.wav"),
	[SoundPreset.NONE]: false, // false 表示静音
};

/**
 * 解析音频配置
 * @param sound - 音频预设或自定义路径
 * @returns 音频文件路径、true（系统默认）、false（静音）
 */
export function resolveSoundConfig(sound?: SoundPreset | string): string | boolean {
	if (!sound) {
		return SOUND_PRESET_MAP[SoundPreset.DEFAULT];
	}

	// 检查是否是预设值
	if (Object.values(SoundPreset).includes(sound as SoundPreset)) {
		return SOUND_PRESET_MAP[sound as SoundPreset];
	}

	// 返回自定义路径
	return sound;
}
