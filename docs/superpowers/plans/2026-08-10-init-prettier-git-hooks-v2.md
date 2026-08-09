# 2026-08-10 init-prettier-git-hooks v2 实施计划

本计划以“skill 内 AI 操作流程 + 五份纯配置模板”替代上一版脚本产品设计。计划不添加完成状态标记。

## 任务 1：清退错误架构

- 删除技能内运行时代码目录。
- 删除依赖旧运行时架构的测试和夹具。
- 保留一个静态技能行为测试。
- 验证：测试在旧实现上 RED。

## 任务 2：重写技能与校正模板

- 将 `SKILL.md` 收缩为根定位、现状检查、模板复制/定点合并、安全静态迁移、人工分流和定点验证流程。
- 保留五份模板与事故说明注释，继续使用 `lint-staged.config.mjs`。
- 验证：对象插件、精确版本、LF 三层与 `--no-parallel` 静态契约通过。

## 任务 3：同步维护文档

- 更新设计文档，声明新方向替代旧脚本设计。
- 更新 common-tools README 与 CHANGELOG，说明 v2.0.0 的破坏性收缩边界。
- 验证：文档不宣传独立迁移程序或自动副作用。

## 任务 4：定点验收

- 运行 `pnpm exec vitest run tests/init-prettier-git-hooks/skill-behavior.test.ts`。
- 对本次写集运行 Prettier 检查、`git diff --check`、敏感路径扫描与状态复核。
- 确认暂存区仍为空，外部脏文件未被修改。
