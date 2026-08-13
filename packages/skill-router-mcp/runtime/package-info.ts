import packageJson from "../package.json" with { type: "json" };

export const MCP_PACKAGE_NAME = packageJson.name;
export const MCP_PACKAGE_VERSION = packageJson.version;
