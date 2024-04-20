# 你好

这是正在开发维护的项目。

## 1

触发项目提交。

## 2

尝试先触发一次成功的 vercel 部署。 packages/monorepo-1

## 3

try-to-active-vercel-monorepo-test-proj.ruancat6312.top

## 4

按照提示 提供根目录的部署文件

## 5

packages/monorepo-1 vercel 的控制台移除给定的目录配置。

## 6

和小爱丽丝官网保持一致，vercel 关闭 deploymentEnabled

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
