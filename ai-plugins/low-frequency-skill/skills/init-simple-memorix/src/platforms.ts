import { homedir } from "node:os";
import path from "node:path";

export interface McpPlatform {
	/** 平台名称 */
	name: string;
	/** 候选配置文件路径列表（按优先级排序） */
	configFiles: string[];
	/** 配置文件格式 */
	format: "json" | "toml";
}

/**
 * 默认 MCP 平台注册表。
 * 以用户主目录为基准动态生成路径，不做硬编码用户名。
 * 未来新增平台时，只需在此数组中追加条目即可。
 */
export const DEFAULT_MCP_PLATFORMS: McpPlatform[] = [
	{
		name: "codex",
		configFiles: [
			path.join(homedir(), ".codex", "config.toml"),
			path.join(homedir(), ".codex", "config-2026-6-13-bg.toml"),
		],
		format: "toml",
	},
	{
		name: "claude-code",
		configFiles: [path.join(homedir(), ".claude.json")],
		format: "json",
	},
	{
		name: "cursor",
		configFiles: [path.join(homedir(), ".cursor", "mcp.json")],
		format: "json",
	},
	{
		name: "workbuddy",
		configFiles: [path.join(homedir(), ".workbuddy", "mcp.json"), path.join(homedir(), ".workbuddy", ".mcp.json")],
		format: "json",
	},
	{
		name: "zcode",
		configFiles: [path.join(homedir(), ".zcode", "cli", "config.json")],
		format: "json",
	},
	{
		name: "qoder",
		configFiles: [path.join(homedir(), "AppData", "Roaming", "Qoder", "SharedClientCache", "mcp.json")],
		format: "json",
	},
	{
		name: "kiro",
		configFiles: [path.join(homedir(), ".kiro", "settings", "mcp.json")],
		format: "json",
	},
];
