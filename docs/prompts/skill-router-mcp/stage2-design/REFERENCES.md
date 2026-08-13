# External References

本设计参考以下上游规范和产品行为。

## Agent Skills

- Agent Skills Specification  
  https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx

关键点：

- Skill 是目录；
- `SKILL.md` 必需；
- `scripts/`、`references/`、`assets/` 可选；
- 推荐 progressive disclosure；
- 附属资源按需加载。

## Skills over MCP

- Experimental Skills Extension draft  
  https://github.com/modelcontextprotocol/experimental-ext-skills/blob/main/docs/sep-draft-skills-extension.md

关键点：

- Skill 内每个文件可映射为 MCP Resource；
- 推荐 `skill://` URI；
- 可通过 `resources/read` 获取；
- 该项目仍属于 experimental / incubation，不应当被当作已稳定标准。

## MCP Resources

- MCP TypeScript SDK — Resources  
  https://github.com/modelcontextprotocol/typescript-sdk/blob/main/docs/servers/resources.md

关键点：

- Resource 支持 text / blob；
- 支持 ResourceTemplate；
- file-backed resource 必须做真实路径根目录隔离；
- size / mimeType 可供 Host 做上下文决策。

## ChatGPT MCP Apps

- Developer mode and MCP apps in ChatGPT  
  https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta

关键点：

- ChatGPT 创建自定义 MCP App 时会扫描 tools/actions；
- MCP App tool/action 变更不会自动进入已批准 snapshot，需要 Refresh / 更新；
- 因此二期新增 Tool 后必须把 ChatGPT tool refresh 作为部署步骤。
