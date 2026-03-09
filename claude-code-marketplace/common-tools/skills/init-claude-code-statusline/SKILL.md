---
name: init-claude-code-statusline
description: 初始化、更新或覆盖 Claude Code 状态栏配置文件（.claude/settings.json 和 .claude/statusline.sh）。用于在任何项目中快速搭建 Claude Code 状态栏显示功能，展示目录、Git 分支、模型、版本和上下文窗口使用情况。
user-invocable: true
metadata:
  version: "0.15.0"
---

# 初始化 Claude Code 状态栏配置

本技能用于在任何项目中初始化、更新或全量覆盖 Claude Code 的状态栏配置。通过预设的模板文件，帮助用户快速搭建功能丰富的状态栏显示。

## 状态栏功能说明

配置完成后，Claude Code 状态栏将显示以下信息：

|  显示项目  | 图标 |                 说明                 |
| :--------: | :--: | :----------------------------------: |
|  当前目录  |  无  | 显示工作目录路径（~替换用户主目录）  |
|  Git 分支  |  🌿  |        显示当前 Git 分支名称         |
|  模型名称  |  🤖  |      显示当前使用的 Claude 模型      |
|   版本号   |  v   |        显示 Claude Code 版本         |
| 上下文窗口 |  🧠  | 显示剩余上下文窗口百分比（颜色编码） |

### 上下文窗口颜色说明

- **绿色**：剩余 > 40%，上下文充足
- **黄色**：剩余 20% - 40%，上下文中等
- **红色**：剩余 < 20%，上下文不足

---

## 技能目录结构

```plain
init-claude-code-statusline/
├── SKILL.md                      # 技能说明文件
└── templates/                     # 模板文件目录
    ├── settings.json             # Claude Code 设置文件模板
    └── statusline.sh             # 状态栏脚本模板
```

---

## 1. 必须创建/修改的配置文件

### 1.1. 创建 `.claude/settings.json`

从模板复制：参见 [templates/settings.json](./templates/settings.json)

**模板内容：**

```json
{
	"statusLine": {
		"type": "command",
		"command": "bash .claude/statusline.sh",
		"padding": 0
	}
}
```

### 1.2. 创建 `.claude/statusline.sh`

从模板复制：参见 [templates/statusline.sh](./templates/statusline.sh)

**模板功能说明：**

1. **颜色支持**：使用 ANSI 颜色代码美化输出
2. **jq 兼容**：自动检测 jq 可用性，优雅降级
3. **Git 集成**：显示当前分支或 commit hash
4. **上下文计算**：计算并显示剩余上下文窗口百分比
5. **颜色编码**：根据上下文剩余量动态调整颜色

---

## 2. 执行流程

### 步骤 1：检查目标目录

1. 检查项目根目录是否存在 `.claude/` 目录
2. 如果不存在，创建 `.claude/` 目录

### 步骤 2：处理 settings.json

1. 检查是否存在 `.claude/settings.json` 文件
2. 如果存在：
   - 使用 `AskUserQuestion` 工具询问用户选择操作方式：
     - **合并配置**：保留现有配置，仅添加/更新 `statusLine` 配置项
     - **全量覆盖**：用模板完全替换现有文件
     - **跳过**：不修改此文件
3. 如果不存在：
   - 直接使用模板创建文件

### 步骤 3：处理 statusline.sh

1. 检查是否存在 `.claude/statusline.sh` 文件
2. 如果存在：
   - 使用 `AskUserQuestion` 工具询问用户是否覆盖
3. 如果不存在：
   - 直接使用模板创建文件

### 步骤 4：验证配置

1. 确认 `.claude/settings.json` 文件格式正确（有效的 JSON）
2. 确认 `.claude/statusline.sh` 文件存在且具有正确的 shebang

---

## 3. 自检清单

完成初始化后，请逐项检查以下内容：

- [ ] 1. **目录存在**：`.claude/` 目录已创建
- [ ] 2. **配置文件存在**：
  - [ ] `.claude/settings.json` 存在
  - [ ] `.claude/statusline.sh` 存在
- [ ] 3. **JSON 格式正确**：`settings.json` 可被正确解析
- [ ] 4. **脚本可执行**：`statusline.sh` 包含正确的 shebang（`#!/bin/bash`）
- [ ] 5. **功能验证**：重启 Claude Code 后状态栏正常显示

---

## 4. 注意事项

### 执行要求

1. **目录创建**：如果 `.claude/` 目录不存在，必须先创建
2. **询问确认**：覆盖现有文件前必须询问用户
3. **JSON 格式**：确保 `settings.json` 是有效的 JSON 格式
4. **脚本格式**：确保 `statusline.sh` 保留正确的 shebang（`#!/bin/bash`）

### 依赖说明

状态栏脚本对以下工具有可选依赖：

| 工具 | 必需 |               说明               |
| :--: | :--: | :------------------------------: |
| bash |  是  |           脚本运行环境           |
| git  |  否  |      用于显示 Git 分支信息       |
|  jq  |  否  | 用于解析 JSON 输入，无则优雅降级 |

### 兼容性说明

1. **Windows 用户**：需要确保系统中安装了 bash（Git Bash、WSL 或其他）
2. **颜色支持**：如果终端不支持颜色，可设置 `NO_COLOR` 环境变量禁用颜色
3. **jq 缺失**：脚本会自动检测 jq 可用性，缺失时使用默认值

---

## 5. 触发场景

本技能应在以下场景**主动调用**：

### 明确触发

1. 用户提及 "init-claude-code-statusline"
2. 用户提及 "初始化状态栏"
3. 用户提及 "配置 Claude Code 状态栏"
4. 用户提及 "更新状态栏配置"

### 上下文触发

5. 用户询问如何自定义 Claude Code 状态栏
6. 用户抱怨状态栏显示不正常
7. 用户想要在新项目中使用自定义状态栏

---

## 参考资源

- **Claude Code 文档**: https://code.claude.com/docs/zh-CN/skills
- **技能最佳实践**: https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
