# 2026-07-02 sync-local-global-agents-skills 设计返工

## 1. 问题现象

实现 `sync-local-global-agents-skills` 技能时，从文件位置、文档措辞到路径示例连续出现多次返工：

- 初始把脚本放在 `scripts/sync-local-global-agents-skills/`，而不是技能目录 `ai-plugins/common-tools/skills/sync-local-global-agents-skills/` 内。
- SKILL.md 中脚本调用示例写成了 monorepo 源码路径 `ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts`。
- SKILL.md「相关文件」列出了 monorepo 内部测试文件 `tests/sync-local-global-agents-skills/sync.test.ts`。
- SKILL.md 开头写了对用户无价值的元信息：「唯一真实来源路径为。..」。
- 实现计划文档与真实落地代码不一致（备份名未含 `randomUUID`、测试 setup 未反映 Windows EPERM fallback 等）。

## 2. 实际根因

把**源码仓库视角**与**已安装技能视角**混为一谈。对外分发的 skill 安装后会被同步到 `~/.agents/skills/<skill-name>/`，用户或 agent 调用时不应依赖 monorepo 源码路径。文档和脚本组织方式必须从「安装后的技能目录」出发，而不是从仓库目录结构出发。

另一个根因是：计划文档被当作一次性草稿，没有随着实现调整及时同步，导致计划与实际代码脱节。

## 3. 关键误导点

- 前期把 skill 的附属脚本当成 monorepo 通用工具脚本，下意识放在 `scripts/` 下。
- 写 SKILL.md 时直接复制了仓库内文件路径，没有意识到安装后的路径完全不同。
- 把开发期测试文件当作 skill 用户会看到的文件，混入了用户文档。
- 误以为计划文档不需要与最终代码完全一致，低估了它作为后续归档/复盘依据的作用。

## 4. 有效修复

- 将脚本全部迁移到 `ai-plugins/common-tools/skills/sync-local-global-agents-skills/` 下，形成标准技能结构：
  - `scripts/sync.ts`
  - `src/sync.ts`
  - `src/platforms.ts`
  - `fallback/sync.ps1`
  - `fallback/sync.sh`
- SKILL.md 与 README.md 中的调用示例改为相对路径 `scripts/sync.ts`、`fallback/sync.ps1` 等，并注明在技能安装目录下运行。
- 从 SKILL.md 中删除 monorepo 测试文件引用与无意义的「唯一真实来源路径」说明。
- 重写实现计划文档，确保所有代码块与真实文件一致。

## 5. 验证方式

- 确认文件最终位于 `ai-plugins/common-tools/skills/sync-local-global-agents-skills/`。
- `pnpm exec prettier --check` 通过。
- `npx tsc --noEmit -p tests/sync-local-global-agents-skills/tsconfig.json` 通过。
- `pnpm vitest run --project sync-local-global-agents-skills` 6 个测试全部通过。
- `tsx ai-plugins/common-tools/skills/sync-local-global-agents-skills/scripts/sync.ts --help` 正常输出。

## 6. 后续约束

1. 创建 `ai-plugins/common-tools/skills` 下的对外分发 skill 时，所有脚本、文档必须放在 `ai-plugins/common-tools/skills/<skill-name>/` 内部，不得以 `scripts/<skill-name>` 等仓库工具路径存放。
2. SKILL.md 中的路径、命令示例必须基于技能安装后的目录结构，禁止使用 `ai-plugins/...` 等仓库源码路径。
3. 不要把 monorepo 内部测试文件、CI 配置、开发期报告写入用户分发的 SKILL.md「相关文件」或说明中。
4. 计划文档一旦进入执行阶段，必须随实现同步更新；禁止计划与实际代码脱节。
5. 开头一句话价值判断：如果一句话只在仓库源码管理层面有意义、对用户理解技能无帮助，就直接删除。
