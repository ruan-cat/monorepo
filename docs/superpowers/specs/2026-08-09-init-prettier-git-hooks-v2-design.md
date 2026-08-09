# 2026-08-09 init-prettier-git-hooks v2 设计

## 决策

v2 采用“skill 内 AI 操作流程 + 五份纯配置模板”。此方向替代上一版独立迁移程序设计；技能不提供运行时程序、独立命令行工具、事务、证明文件或运行时验证器。

## 目标

- AI 先定位根 `package.json`，读取目标配置和 Git 状态。
- 文件缺失时复制模板；文件存在时逐文件定点合并，保护用户已有改动。
- lint-md 固定为 `1.0.1`，Prettier 配置使用 default import 与对象插件。
- `.gitattributes`、`.editorconfig`、Prettier 三层统一 LF。
- 所有活动 `--experimental-cli` 命令同行包含一个 `--no-parallel`。
- 依赖安装、Hook 安装、renormalize 等副作用必须先获得用户授权。

## 安全迁移边界

AI 只迁移可唯一定位的 ESM 顶层静态 plugins 数组：加入 `import prettierPluginLintMd from "prettier-plugin-lint-md";`，并把字符串元素替换为 `plugins: [prettierPluginLintMd]` 中的对象引用。CJS、动态值、spread、computed key、多配置或 Hook 管理器冲突必须停止并交由人工处理。

## 分发内容

技能只包含 `SKILL.md` 与 `.editorconfig`、`.gitattributes`、`prettier.config.mjs`、`lint-staged.config.mjs`、`simple-git-hooks.mjs` 五个模板。旧 `.js` lint-staged 模板由 `.mjs` 替代。

## 验收

- 单个 Vitest 静态契约测试证明没有技能运行时代码，且技能正文覆盖 AI 操作、安全迁移和模板契约。
- 对本次文件运行 Prettier 检查、`git diff --check`、路径污染扫描和 Git 状态复核。
- 不执行依赖安装、Hook 安装、renormalize、提交或推送。
