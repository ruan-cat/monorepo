---
"@ruan-cat/vercel-deploy-tool": minor
---

1. 新增 `watchPaths` 配置字段（`DeployTargetBase`）：每个部署目标可配置 glob 模式数组，用于声明该目标关联的源码路径。
2. 新增 `git-diff-filter` 核心模块：通过 `git diff --name-only` 获取变更文件列表，使用 `picomatch` 匹配 `watchPaths`，将部署目标分为"需要部署"和"跳过"两组。
3. 新增 CLI 参数 `--diff-base <ref>`：指定与 HEAD 对比的 Git 基准 ref，启用精确部署模式，仅部署 `watchPaths` 有匹配变更的目标。
4. 新增 CLI 参数 `--force-all`：强制全量部署所有目标，忽略 `watchPaths` 过滤，优先级高于 `--diff-base`。
5. 精确部署降级保障：当 git 命令不可用、ref 无效或执行失败时，自动降级为全量部署，不中断流程。
6. 部署工作流新增步骤 `0. 检测变更范围`：使用 tasuku `task` 封装 git diff 检测逻辑，与后续步骤风格一致，并通过 `setTitle` 动态展示检测结果。
7. 更新 GitHub Actions 示例：在 `vercel-deploy-tool.yaml` 中按触发事件类型（`push` / `repository_dispatch`）分别传入合适的 `--diff-base` 参数。
8. 新增测试用例（`tests/git-diff-filter.test.ts`）：覆盖 `filterTargetsByDiff` 和 `getChangedFiles` 的全部分支，共 14 个用例。
9. 新增文档页 `selective-deploy.md`：说明 `watchPaths` 配置、CLI 参数用法、降级行为与 CI 集成示例。
