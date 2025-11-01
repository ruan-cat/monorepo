# 本项目的杂项提示词

## 本项目待办任务

- @ruan-cat/vercel-deploy-tool 运行时增加 dry 模式，干燥运行整个流程，不实际真的部署。模仿【turbo run build:docs --dry-run】的方式。
- 编写掘金文章，说明对 dry 模式的思考与设计。

## 01 统一设置 `themeConfig.editLink.pattern` 的取值

1. 阅读 `packages\vitepress-preset-config\src\docs\.vitepress\config.mts` 文件，以该配置文件的 `themeConfig.editLink.pattern` 为例子，重新设置整个项目全部的 `.vitepress\config.mts` 配置文件。
2. 配置文件的匹配地址为 `https://github.com/ruan-cat/monorepo/blob/dev/packages/vitepress-preset-config/src/docs/:path` ，请你根据被配置的 package 子包文件位置，更替为正确的地址。
3. 根据 glob 匹配 `**/.vitepress/config.mts` ，全面地读取本项目全部的 vitepress 配置文件，设置 `themeConfig.editLink.pattern` 。

## 02 处理打包错误

`@ruan-cat/vitepress-preset-config` 包的 build 命令会出现错误，请帮我修复该错误。

你也可以运行根包的 build 命令来检查错误。

## 03 制作基于 turbo 的 prebuild 命令，统一封装全体子包的 automd 运行命令

请你在 turbo.json 内，为全部的 "prebuild" 命令，制作一个全局的 turbo 任务，预期在运行 turbo 的 build 任务前，先完成 turbo 的 prebuild 任务。

## 04 处理 claude code 钩子错误 `task-complete-notifier.sh` 缺失 CLAUDE_PROJECT_DIR 的报错

```log
  ⎿ Stop says: Plugin hook error:
    C:\Users\pc\.claude\plugins\marketplaces\ruan-cat-tools\claude-code-marketplace\common-tools/scripts/task-complete-notifier.sh: line 72:
    CLAUDE_PROJECT_DIR: unbound variable

  ⎿ Stop says: Plugin hook error:
    C:\Users\pc\.claude\plugins\marketplaces\ruan-cat-tools\claude-code-marketplace\common-tools/scripts/task-complete-notifier.sh: line 72:
    CLAUDE_PROJECT_DIR: unbound variable
```

这些报错是来自于 C 盘的，其本质就是本项目的配置出错了。请你检查本项目的 `scripts/task-complete-notifier.sh` ，修复该故障，并确保 claude code 插件使用本 hooks 时，不会再出现以上的错误。
