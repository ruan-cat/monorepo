# 长任务执行进度

## 当前状态

- Change：`make-skill-router-mcp-for-chatgpt-web`
- Checkpoint：CP-00 工件与实施基线审核
- 当前 task：CP-00（0.1–0.6）已完成；下一 task 为 CP-01/1.1 最小 MCP Runtime package
- 唯一任务源：`tasks.md`

## 本轮已完成的工件工作

- 创建并阅读本 change 的 `proposal.md`、`design.md`、`specs/remote-skill-router-mcp/spec.md`、`tasks.md`。
- 创建前已扫描工作区的 `agent-progress.md` / `agent-findings.md`；仅发现既有独立 change 的规范位置文件，没有错位文件需要迁移。
- 已把长任务恢复纪律、试点批次、外部证据门和动态补全规则写入 `tasks.md`。
- 已记录匿名只读访问、Cloudflare Git Integration 单一生产部署 authority、仓库根目录 Worker root directory、Build Watch Paths 以及 SDK transport/session 与自定义 snapshot session 的边界。
- 已完成 0.1 官方兼容性审计并写入 `evidence/2026-08-13-cp00-compatibility-profile-audit.md`；仅标记 0.1 完成，未开始 runtime 实现。
- 已完成 0.2 registry 前置契约审计；generator `-Check` 通过，未修改 release-side 文件。
- 已完成 0.3 package/workspace/CI 落点审计；package 尚不存在，root Vitest 保持 3.x，未发现 Cloudflare Worker workflow。
- 已创建 CP-00 综合证据文件，完成 strict validation、diff check 与证据目录 secret 扫描；CP-00 全部任务已具备可复读证据，尚未创建 runtime 源码。
- 针对用户提出的“恢复时可能找不到原始 prompt 约束”风险，已创建完整 source-context index，并把每次恢复的强制读取顺序、来源层级、冲突处理和 task 映射写入 `tasks.md`。

## 验证摘要

- OpenSpec CLI 已确认 change root 和 spec-driven 工件依赖链。
- 尚未运行 package、SDK、Cloudflare、ChatGPT 或生产部署验证；不得将任何 `tasks.md` task 标记完成。

## 下一步

下一恢复点从 CP-01/1.1 开始。每次恢复前除本文件、`agent-findings.md`、proposal、design、spec 与 tasks 外，还必须读取 `evidence/2026-08-13-source-context-index.md` 及当前 task 映射的原始 prompt 文件；不要把 OpenSpec spec 当成原始约束的完整副本，也不要把 CP-00 的审计通过误报为 runtime、Cloudflare 或 ChatGPT 已完成。
