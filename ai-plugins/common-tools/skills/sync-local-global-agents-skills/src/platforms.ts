import { homedir } from "node:os";
import path from "node:path";

/** 本地 agent 平台定义 */
export interface AgentPlatform {
	/** 平台显示名称 */
	name: string;
	/** 该平台 skills 目录的绝对路径 */
	skillsDir: string;
}

/** 默认同步的本地 agent 平台列表（硬编码） */
export const DEFAULT_PLATFORMS: AgentPlatform[] = [
	// WorkBuddy 分国内版与国际版：两者用户级配置目录相互独立，可同时存在于同一台机器，需分别登记
	{
		name: "WorkBuddy",
		skillsDir: path.join(homedir(), ".workbuddy", "skills"),
	},
	{
		name: "WorkBuddy 国际版",
		skillsDir: path.join(homedir(), ".workbuddy-ai", "skills"),
	},
	{
		name: "QoderWork",
		skillsDir: path.join(homedir(), ".qoderworkcn", "skills"),
	},
	{
		name: "Kimi Work",
		skillsDir: path.join(homedir(), "AppData", "Roaming", "kimi-desktop", "daimon-share", "daimon", "skills"),
	},
	{
		name: "CodeBuddy",
		skillsDir: path.join(homedir(), ".codebuddy", "skills"),
	},
	{
		name: "Qoder",
		skillsDir: path.join(homedir(), ".qoder", "skills"),
	},
	{
		name: "TRAE Work CN",
		skillsDir: path.join(homedir(), ".trae-cn", "skills"),
	},
];
