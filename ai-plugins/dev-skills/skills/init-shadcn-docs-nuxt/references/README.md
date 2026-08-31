# 现行参考导航与迁移台账

本目录的九份文件共同构成现行参考。导航不依赖项目级 archive，也不依赖外部报告；每次排查都从命中的信号进入对应文件，再取得该文件声明的验证证据。

| 适用信号                                                | 入口文件                                                                             | 验证状态                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| ESM/CJS 导入、hydration 被模块错误打断                  | [`compat.md`](compat.md)                                                             | 需以首个导入错误和浏览器 console 复现            |
| 最小 Nuxt 配置、按需兼容补丁、模块禁改项                | [`nuxt-config.md`](nuxt-config.md)                                                   | 需以最小启动和构建验证                           |
| 主题类缺失、暗黑模式或 CSS 变量异常                     | [`tailwind-css.md`](tailwind-css.md)                                                 | 需以扫描路径和页面样式验证                       |
| MDC 裸文本、容器语法或 Prettier 改写                    | [`mdc-prettier.md`](mdc-prettier.md)                                                 | 需以内容页和 hydration 验证                      |
| Windows 构建长尾、残留进程、EPERM                       | [`windows.md`](windows.md)                                                           | 需以进程、资源、日志和退出码验证                 |
| workspace 源码消费、别名、插件与 Content 目录           | [`workspace.md`](workspace.md)                                                       | 需以 fresh 解析树和启动验证                      |
| Content/H3 版本漂移、prerender 与分层检修               | [`incident-repair.md`](incident-repair.md)                                           | 需以 Content API、版本树和构建分层验证           |
| alias、externalization、artifact、Turbo cache、部署闭包 | [`production-graph-and-runtime-closure.md`](production-graph-and-runtime-closure.md) | 需以首个失败门、`.output`、HTTP smoke 与部署验证 |
| 选择当前参考与追溯规则迁移                              | [`README.md`](README.md)                                                             | 需以入口完整性和分发边界检查验证                 |

## 本轮迁移台账

| 规则来源                                         | 目标                                                  | 原因                                                                                         | 验证方式                                                    |
| ------------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `SKILL.md` 的历史事故约束、检修入口与第 6 步验证 | `production-graph-and-runtime-closure.md`             | 让生产构建图与 runtime closure 成为单一现行入口，主技能只负责路由                            | 分发边界测试、文件导航和首个失败门检查                      |
| `incident-repair.md` 的生产故障分层              | `production-graph-and-runtime-closure.md`             | 将宽 `noExternal` 从历史误区中剥离，明确 Vite、Nitro、trace 与 manifest 的独立职责           | 精确错误准入、fresh install、artifact startup 与 HTTP smoke |
| 既有 Content/H3、MDC、Windows、workspace 参考    | 原入口文件保留不迁移                                  | 这些是独立故障域，不能被生产闭包规则覆盖                                                     | 按各入口的专门验证执行                                      |
| 2026-09-01 Vercel runtime closure 事故复盘       | `production-graph-and-runtime-closure.md`、`SKILL.md` | 增加 READY/runtime 分离、dirty-tree、override 范围与浏览器证据硬门，避免再次把流程绿灯当结果 | RED/GREEN 压力场景、manifest/artifact/HTTP/浏览器证据复核   |
| `nitro-api-development` compatibilityDate 契约   | `SKILL.md`、`incident-repair.md`、templates           | 统一 Cloudflare/Vercel 双平台对象与 `2024-09-19`，避免字符串/日期漂移被误认为 runtime 修复   | 模板静态断言、Prettier、Nuxt prepare/build 复核             |
