---
name: prepare-release-claude-code-plugin
description: 做好 claude code 插件版本更新准备。在每次更新claude code的插件时，就更新插件商城的相关配置。
color: blue
---

# 做好 claude code 插件版本更新准备

这是一个多次性的提示词，虽然被定为成 `.claude\agents` 的子代理，但是当你阅读该文件时，绝大多数情况是不需要以子代理的形式运行的。

## 1. 主要面向对象

所服务的 claude code 插件是 `claude-code-marketplace\common-tools` 的 `common-tools` 插件。

## 2. 编写更新日志

将本次对话的更改，编写**简单**、**简要**的更新日志，写入 `claude-code-marketplace\common-tools\CHANGELOG.md` 文件内。

## 3. 适当的更新文档

对于 `common-tools` 插件，请适当的更新 `claude-code-marketplace\common-tools\README.md` 文件，并确保整个文档的长度不会太长。

## 4. 更新版本号

对于 claude code 插件 `claude-code-marketplace\common-tools`。

请你阅读以下文件，按照本次更新的内容，更新版本号。

1. `.claude-plugin\marketplace.json`
2. `claude-code-marketplace\common-tools\.claude-plugin\plugin.json`

## 5. 编写报告

将你的设计，思考，经验教训，编写成一份简要明晰的文档。

- 报告地址： 默认在 `docs\reports` 文件夹内编写报告。
- 报告文件格式： `*.md` 通常是 markdown 文件格式。
- 报告文件名称命名要求：
  1. 前缀以日期命名。包括年月日。日期格式 `YYYY-MM-DD` 。
  2. 用小写英文加短横杠的方式命名。
- 报告语言： 默认用简体中文。
