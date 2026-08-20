# 2026-08-13 CP-00 兼容基线与前置契约审计

## 审计结论

- CP-00/0.1 官方兼容性审计详见同目录 `2026-08-13-cp00-compatibility-profile-audit.md`。
- CP-00/0.2 registry 前置契约通过；未修改 release-side generator 或 `ai-plugins/skill-registry.json`。
- CP-00/0.3 package/workspace/CI 落点已确认；尚未创建 runtime package、未运行 Cloudflare/ChatGPT/生产部署验证。

## Registry 前置检查

执行命令：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.ps1 -Check
```

结果摘要：

```log
[INFO]  common-tools skills: 19
[INFO]  dev-skills skills: 7
[INFO]  total skills: 26
[OK]    skill-registry.json is current
```

只读 JSON 抽查：`schemaVersion=1`；roots 为 `ai-plugins/common-tools/skills` 与 `ai-plugins/dev-skills/skills`；共 26 个 skill entry；每个 entry 以 `SKILL.md` 结尾且对应 `Test-Path` 通过。

## Package、workspace 与现有 CI

- `packages/skill-router-mcp` 当前不存在；新包落在 `packages/*` workspace 下符合仓库边界。
- `pnpm-workspace.yaml` 包含 `packages/*`；root `package.json` 的 `packageManager` 为 `pnpm@10.33.0`，root Vitest 为 `^3.2.4`。
- `.github/workflows/ai-plugins-skill-registry-check.yml` 只监听并校验 `ai-plugins` registry source；`.github/workflows/ci.yaml` 是现有 dev 分支全仓 CI；其他现有 deploy workflow 属于 Vercel 路径。
- 当前未发现 Cloudflare Worker workflow。MCP 的 production deploy/promotion 后续固定由 Cloudflare Workers Builds Git Integration 负责；GitHub Actions 如新增只能承担无部署权限的静态检查。

## 外部权限状态

本审计没有 Cloudflare account、Workers Builds Git Integration、GitHub secret、公开 HTTPS 域名、ChatGPT Developer Mode 或 Workspace review 的真实账号证据。它们保留为后续 CP-04/CP-05 外部门禁，不能由本地文件或静态构建代替。

## 官方链接

- <https://developers.openai.com/plugins/build/mcp-server>
- <https://developers.openai.com/plugins/deploy/connect-chatgpt>
- <https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/>
- <https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/>
