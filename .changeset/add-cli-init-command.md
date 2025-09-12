---
"@ruan-cat/commitlint-config": minor
---

feat: 新增 CLI 初始化命令，支持 Commander.js 完整命令行体验

## 🚀 核心功能

- **一键初始化**：添加 `init` 命令，支持快速初始化 commitlint 配置文件
- **零安装使用**：支持通过 `pnpm dlx @ruan-cat/commitlint-config init` 或 `npx @ruan-cat/commitlint-config init` 直接使用
- **智能文件管理**：自动复制 `.czrc` 和 `commitlint.config.cjs` 模板文件到当前目录
- **中英双语支持**：提供友好的双语控制台输出和操作提示

## ⚙️ 命令行选项

- **`-f, --force`**：强制覆盖已存在的文件，跳过覆盖警告提示
- **`--help`**：显示完整的帮助信息和使用示例
- **`--version`**：显示当前版本号（动态读取 package.json）

## 🎯 交互式体验

- **专业帮助系统**：集成 Commander.js 提供结构化的帮助信息
- **智能警告机制**：检测文件冲突并提供覆盖警告，支持 `--force` 跳过
- **美观输出界面**：使用 consola.box 显示初始化结果和后续操作指南
- **完整错误处理**：友好的错误提示和异常处理机制

## 🛠️ 技术实现

- **Commander.js 集成**：替代原始参数解析，提供专业的 CLI 框架
- **动态版本管理**：自动从 package.json 读取版本号
- **模板系统**：基于 templates 目录的文件复制机制
- **完整的中文注释**：所有代码包含详细的中文说明和文档
