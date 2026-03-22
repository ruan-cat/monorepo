# Dev Skills - Claude Code Plugin

阮喵喵开发时使用的工程化开发技能集合，聚焦于特定技术栈的项目初始化、架构搭建与规范驱动开发。

## 版本

**当前版本**: `2.15.1`

⚠️ **v2.15.1 版本同步**:

- 版本号与 marketplace 主版本同步至 2.15.1（本次无 `dev-skills` 技能内容变更）

⚠️ **v2.15.0 版本同步**:

- 版本号与 marketplace 主版本同步至 2.15.0（本次无 `dev-skills` 技能内容变更）

⚠️ **v2.14.0 新增技能**:

- `init-shadcn-docs-nuxt`：初始化或重构基于 `shadcn-docs-nuxt` 的组件库文档站，内含 Nuxt 配置、Tailwind、MDC、Windows 构建排错与完整模板

⚠️ **v2.13.0 新增技能**:

- `init-pure-admin-iconify`：补充「照抄 pure-admin」策略、文件映射表与 `templates/` 目录，将 `ReIcon` 相关源码从文档拆分为独立可复制的模板文件

查看完整的更新历史，请参阅 [CHANGELOG.md](./CHANGELOG.md)

## 功能特性

### Skills (技能)

面向特定技术栈与工程场景的专项开发技能：

- **init-pure-admin-iconify**: 在任意 `vite + vue3` 项目中快速初始化 pure-admin 风格的 iconify 图标体系，提供离线图标、在线图标与 `useRenderIcon` 统一渲染出口
- **init-shadcn-docs-nuxt**: 以「最小可用 + 快速稳定」为目标，为任意项目建立可长期维护的 `shadcn-docs-nuxt` 文档站；内含 Nuxt 配置模板、Tailwind 主题、MDC 语法说明与 Windows 构建假卡死排错手册
- **nitro-api-development**: 使用 Nitro v3 框架和 H3 编写服务端 API，适用于纯后端 Nitro 项目初始化、Vite 项目全栈化、Drizzle ORM 数据库交互与多平台部署
- **openspec**: OpenSpec 规范驱动开发助手，基于 OPSX 工作流在编写代码前与 AI 就需求达成一致，使用 Schema 驱动的工件依赖系统管理变更

## 安装

### 通过插件市场安装

1. 添加插件市场（如果尚未添加）：

   ```bash
   /plugin marketplace add ruan-cat/monorepo
   ```

2. 安装插件：

   ```bash
   /plugin install dev-skills@ruan-cat-tools
   ```

### 更新插件

```bash
# 更新插件市场
/plugin marketplace update ruan-cat/monorepo

# 或重新安装插件
/plugin uninstall dev-skills
/plugin install dev-skills@ruan-cat-tools
```

## 使用方法

### 使用技能

技能会在满足触发条件时自动激活，也可以在对话中主动描述需求来触发：

| 技能                      | 触发关键词示例                                     |
| :------------------------ | :------------------------------------------------- |
| `init-pure-admin-iconify` | 初始化 iconify、pure-admin 图标方案、ReIcon        |
| `init-shadcn-docs-nuxt`   | 搭建组件库文档、接入 shadcn-docs-nuxt、Nuxt 文档站 |
| `nitro-api-development`   | 开发 Nitro 接口、全栈化 Vite、Drizzle ORM          |
| `openspec`                | openspec、规范驱动开发、/opsx:new                  |

## 技能详情

### init-pure-admin-iconify

**版本**: `0.2.0` | **可主动调用**: 是

初始化一套与 pure-admin 思路一致的 iconify 图标体系，让业务层只关心"传什么图标"，不关心底层渲染实现。

核心产物：

- `IconifyIconOffline` — 离线图标渲染组件
- `IconifyIconOnline` — 在线图标渲染组件
- `useRenderIcon` — 统一分流渲染 hook
- `offlineIcon` — 本地离线图标映射与兼容别名

`templates/` 目录包含所有可直接复制的 `ReIcon` 源码文件，无需手动编写。

### init-shadcn-docs-nuxt

**版本**: `1.0.0` | **可主动调用**: 是

以三层结构组织知识：

- **SKILL.md** — 导航与流程
- **references/** — 排错手册与配置说明（compat、MDC Prettier、Nuxt config、Tailwind CSS、Windows、workspace）
- **templates/** — 可直接复制的代码模板（注释即文档，记录每个配置项的根因与历史事故）

重点解决场景：Windows 构建假卡死、MDC 语法错误、Tailwind 主题集成、模块兼容问题。

### nitro-api-development

**版本**: `0.13.4`

核心规范：

1. 框架：Nitro v3 + H3 `defineHandler`
2. 数据库：Drizzle ORM（不推荐 Mock JSON）
3. 响应格式：`{ success, code, message, data }` 标准结构
4. 错误处理：所有 handler 必须使用 `try-catch`
5. 无状态原则：所有持久化通过数据库

`references/` 目录含 API 参考、Cloudflare 环境变量、Mock 迁移指南、请求参数处理与 Vitest 测试规范。

### openspec

**版本**: `1.2.0`

规范驱动开发四原则：**流动而非僵化、迭代而非瀑布、简单而非复杂、棕地优先**。

斜杠命令入口：`/opsx:new`、`/opsx:ff`、`/opsx:apply`、`/opsx:continue`、`/opsx:explore` 等。

推荐场景：改进现有项目（棕地开发）、需要高质量实现的关键功能、团队协作开发。

## 开发

### 目录结构

```plain
dev-skills/
├── .claude-plugin/
│   └── plugin.json                          # 插件配置清单（Claude）
├── .cursor-plugin/
│   └── plugin.json                          # 插件配置清单（Cursor）
├── skills/                                  # 技能定义
│   ├── init-pure-admin-iconify/             # pure-admin iconify 图标体系
│   │   ├── SKILL.md
│   │   └── templates/                       # ReIcon 源码模板
│   │       ├── setup-icon.ts
│   │       └── ReIcon/                      # 完整 ReIcon 组件目录
│   ├── init-shadcn-docs-nuxt/               # shadcn-docs-nuxt 文档站初始化
│   │   ├── SKILL.md
│   │   ├── references/                      # 排错手册与配置说明
│   │   └── templates/                       # 可直接复制的配置模板
│   ├── nitro-api-development/               # Nitro v3 接口开发
│   │   ├── SKILL.md
│   │   ├── references/                      # API 参考与迁移指南
│   │   └── templates/                       # 类型定义与工具函数模板
│   └── openspec/                            # 规范驱动开发助手
│       ├── SKILL.md
│       └── references/                      # 配置说明与任务编写指南
├── CHANGELOG.md                             # 版本更新日志
└── README.md                                # 本文件
```

### 参考资源

- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code)
- [插件开发指南](https://docs.claude.com/en/docs/claude-code/plugins)
- [技能编写规范](https://code.claude.com/docs/zh-CN/skills)

## 许可证

MIT License

## 作者

**ruan-cat** (阮喵喵)

- Email: 1219043956@qq.com
- GitHub: [@ruan-cat](https://github.com/ruan-cat)

## 仓库

[https://github.com/ruan-cat/monorepo](https://github.com/ruan-cat/monorepo)
