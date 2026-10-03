import { homedir } from "node:os";
import path from "node:path";

export interface McpPlatform {
	/** 平台名称 */
	name: string;
	/** 候选配置文件路径列表（按优先级排序） */
	configFiles: string[];
	/** 配置文件格式 */
	format: "json" | "toml";
	/**
	 * MCP server 定义的键路径。
	 *
	 * - JSON 平台：顶层键路径。多数平台是 `["mcpServers"]`；
	 *   ZCode 用 `["mcp", "servers"]`（注意是嵌套的 `mcp.servers`，不是 `mcpServers`）。
	 * - TOML 平台：表名。Codex 用 `["mcp_servers"]`（**下划线**，不是 `mcpServers`）。
	 *
	 * 省略时默认 `["mcpServers"]`。写错这里会让脚本找不到已有 entry，
	 * 转而在配置文件里新增一个目标程序根本不识别的键。
	 */
	serverPath?: string[];
}

/** 未显式声明 `serverPath` 时的默认值。 */
export const DEFAULT_SERVER_PATH = ["mcpServers"] as const;

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
		serverPath: ["mcp_servers"],
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
		serverPath: ["mcp", "servers"],
	},
	{
		name: "qoder",
		configFiles: [path.join(homedir(), ".qoder", "mcp.json")],
		format: "json",
	},
	{
		name: "kiro",
		configFiles: [path.join(homedir(), ".kiro", "settings", "mcp.json")],
		format: "json",
	},
];
