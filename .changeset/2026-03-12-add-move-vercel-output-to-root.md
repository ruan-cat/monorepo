---
"@ruan-cat/utils": minor
---

1. 新增 `findMonorepoRoot()` 公共函数，并通过 `@ruan-cat/utils/monorepo` 对外提供统一的 monorepo 根目录定位入口。该函数会从当前工作目录开始向上查找 `pnpm-workspace.yaml`，适用于脚本在 monorepo 子包内执行时的根目录寻址场景。
2. 新增 `move-vercel-output-to-root` TypeScript 脚本，用于解决 Vercel 在 pnpm workspace monorepo 中部署子包时，构建产物生成在子包内、而平台要求从根目录读取 `.vercel/output` 的路径冲突问题。脚本默认会将当前子包的 `.vercel/output` 复制到 monorepo 根目录下的 `.vercel/output`。
3. 新脚本补充了完整的路径解析与命令行参数能力，支持 `--root-dir`、`--source-dir`、`--target-dir`、`--skip-clean`、`--dry-run` 等参数，用于适配不同深度的子包目录、显式指定源/目标目录，以及在 CI 中做非破坏性的路径预检。
4. 在 `package.json` 中新增 `move-vercel-output-to-root` 快捷脚本，并新增 `./move-vercel-output-to-root` 与 `./monorepo` 导出入口，便于子包直接使用 `tsx @ruan-cat/utils/move-vercel-output-to-root` 运行脚本，或单独复用 monorepo 根目录检测能力。
5. 为该脚本补充了使用说明文档与 Vitest 测试，覆盖自动定位 monorepo 根目录、默认搬运行为、`dry-run`、自定义源/目标目录、命令行参数解析等关键路径，降低后续接入 Vercel 部署脚本时的回归风险。
