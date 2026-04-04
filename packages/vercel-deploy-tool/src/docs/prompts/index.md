---
order: 8000
---

# 提示词文件

## 01 <!-- TODO: 正在执行中 --> 让部署行为改成，基于实际构建而触发部署的部署行为

请你阅读这些配置文件：

- vercel-deploy-tool.config.ts
- turbo.json
- package.json
- .github\workflows\ci.yaml

切换到主分支 main 后，会开始部署。但是现在是基于 static 静态资源部署，可是很多情况下。对应的子包根本就没有出现任何有意义的更改，也在 github workflow build 并且开始部署了。

我允许 github workflow 对全部的子包做 build，做文档的 build，这是全面校验的规范。但是文档构建后，还是被部署了。这造成了 vercel 部署额度的极大浪费。

我需要你设计一个合适的方案，去精确设计，识别那些文档需要被部署，那些则不需要。希望根据 git 修改内容和范围，来实现看情况部署。
