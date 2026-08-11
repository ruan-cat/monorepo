# 安全模型

## 原则

Skill Router 默认只读。

## GitHub 权限

禁止：

- 写仓库
- 删除资源
- 修改 secrets

## Skill 安全

加载前：

- 校验来源
- 校验格式
- 记录版本

## Prompt Injection 防护

Skill 内容作为知识输入，不作为系统权限指令。

工具调用必须经过 MCP 权限控制。

## 审计

记录：

- skill 查询
- skill 加载
- 版本信息
- 请求来源。