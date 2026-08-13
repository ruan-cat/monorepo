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


## GitHub REST — Git Trees / Contents

- Git Trees API  
  https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28

关键点：

- recursive tree response 可能 `truncated=true`；
- recursive 模式有 100,000 entries / 7 MB 上限；
- truncated 时应改为 non-recursive subtree traversal；
- fine-grained token 只需要 Contents read。

- Repository Contents API  
  https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28

关键点：

- 单 directory listing 有 1,000 entries 上限；
- file <=1 MB 时完整支持 contents response；
- symlink 可能被透明解析，因此二期 resource 安全判断优先使用 Git tree mode/type。

## OpenAI ChatGPT MCP App Refresh

- Developer mode and MCP apps in ChatGPT  
  https://help.openai.com/en/articles/12584461-developer-mode-and-full-mcp-connectors-in-chatgpt-beta

关键点：

- Create / test 时需要 Scan Tools；
- MCP server 后续 action/tool 更新不会自动启用；
- 需要 Refresh 获取新增 action 或定义更新；
- approved app 使用 frozen tool/input snapshot。
