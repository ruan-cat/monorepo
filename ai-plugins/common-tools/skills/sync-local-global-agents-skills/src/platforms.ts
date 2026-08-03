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
	{
		name: "WorkBuddy",
		skillsDir: path.join(homedir(), ".workbuddy", "skills"),
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
];
