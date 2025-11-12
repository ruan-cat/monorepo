---
"@ruan-cat/commitlint-config": minor
---

**重构 root 范围识别机制，避免滥用**

**破坏性变更：**

- root 范围不再作为默认兜底范围，仅当文件匹配特定 glob 模式时才被识别为 root 范围
- 不匹配任何范围的文件将返回 `undefined`，需要用户手动选择提交范围

**主要更改：**

- 为 root 范围添加明确的 glob 匹配规则（根目录配置文件、文档、脚本等）
- 移除 `getPackagePathToScopeMapping` 和 `getDefaultScope` 中的默认 root 映射
- `.XXX/` 文件夹下的文件不会被识别为 root 范围（如 `.vscode/`, `.github/` 等）
- 子包中的配置文件（如 `packages/utils/.gitignore`）不会被识别为 root 范围
