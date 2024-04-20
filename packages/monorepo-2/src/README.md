# 你好

这是正在开发维护的项目。

## 1

触发项目提交。

## 2

尝试先触发一次成功的 vercel 部署。

```json
{
  "buildCommand": "vuepress build docs",
  "installCommand": "pnpm install",
  "outputDirectory": "docs/.vuepress/dist",
  "devCommand": "vuepress dev docs --clean-cache",
  "rewrites": [
    {
      "source": "/",
      "destination": "https://small-alice-web.ruan-cat.com/"
    },
    {
      "source": "/qq-group/",
      "destination": "https://drill-qq-group-rules.ruan-cat.com/"
    }
  ]
}
```
