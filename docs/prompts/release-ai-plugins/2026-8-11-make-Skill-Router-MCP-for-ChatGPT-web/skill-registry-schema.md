# Skill Registry Schema

## 目标

兼容现有 ai-plugins/dev-skills 技能体系。

## Skill Metadata

```yaml
id: nitro-api-development
name: Nitro API 开发
version: 0.13.5
tags:
  - nitro
  - h3
capabilities:
  - api-design
references:
  - SKILL.md
```

## Registry

建议生成：

```json
{
  "version": "1",
  "skills": []
}
```

## 发布流程

GitHub Actions:

1. 扫描 skills。
2. 校验 metadata。
3. 生成 registry.json。
4. 发布到 Cloudflare KV。

运行时不直接扫描 GitHub。