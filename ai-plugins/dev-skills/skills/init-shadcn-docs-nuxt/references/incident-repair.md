# Nuxt Content / Nitro / H3 故障检修补充

## 版本漂移

已验证的 Nuxt 3 保守基线为：

```json
{
	"shadcn-docs-nuxt": "1.1.9",
	"@ztl-uwu/nuxt-content": "2.13.9",
	"nuxt": "3.21.2",
	"h3": "1.15.11"
}
```

它不是生态中唯一正确的组合，但必须作为一组审查。fresh install 后运行：

```powershell
pnpm --filter <docs-package> list nuxt shadcn-docs-nuxt @ztl-uwu/nuxt-content h3 nitropack --depth 4
pnpm --filter <docs-package> why h3
```

`ERR_INVALID_URL`、H3 v2 不提供 `sendError`、Content cache/search API 500，优先指向 Content/H3/Nuxt 实际解析失配；不要先改 Markdown 或 CSS。

## `prerender:routes` 的历史边界

旧配置曾使用：

```ts
prerender: {
  crawlLinks: false,
},
hooks: {
  "prerender:routes"(routes: Set<string>) {
    routes.clear();
  },
},
```

它的原始动机是绕过 Windows + pnpm workspace 的 Nitro/NFT 构建长尾和内存压力；因此这段知识不能删除。

但在 document-driven Nuxt Content 中，Content 需要在 prerender 阶段把 Markdown 解析为结构化对象并写入缓存。清空路由会让运行时 Content 数据库为空，并可能触发 `page._id` 相关错误。因此：

- 作为**历史排错线索**保留。
- 作为 `shadcn-docs-nuxt` 默认配置删除。
- 只有确认项目不使用 document-driven Content，且完成等价功能验证后，才可讨论重新启用。

## Windows 构建分层

1. 先清理残留 `pnpm -> cmd -> node -> nuxi` 进程。
2. 单进程、串行构建，临时使用 `NODE_OPTIONS=--max-old-space-size=8192`。
3. 观察 `.nuxt/dist/server/server.mjs`、`.output/server/index.mjs`、CPU、工作集、日志更新时间和最终退出码。
4. 只有证据确认 NFT trace 是 Windows 本地瓶颈时，才使用 `SHADCN_DOCS_SKIP_NFT_TRACE=1` 这类条件化 workaround。
5. Linux/Vercel 必须重新验证依赖追踪、workspace SSR 和 Content prerender。

## 其他高价值信号

| 信号                                        | 第一检查点                                  |
| ------------------------------------------- | ------------------------------------------- |
| `entities/decode` 缺失                      | `entities` 多版本与 trace 产物              |
| `@vueuse/core` 缺失                         | workspace 包是否被 Vite SSR externalize     |
| `registerMessageResolver is not a function` | `@intlify/*` 多版本与 workspace overrides   |
| `.nuxt` 缺失或 `#app-manifest` 异常         | `predev`/`prebuild` 是否执行 `nuxt prepare` |
| MDC marker 裸文本                           | MDC 语法与 Prettier 是否改写了 content      |

## 事故 A：Nuxt 3 / H3 v1 的版本失配链

### 上游 manifest 没有表达完整兼容边界

已核对到的 manifest 关系是：

| 包                             | Content 关系                     | 开发时 Nuxt | H3 声明 |
| ------------------------------ | -------------------------------- | ----------- | ------- |
| `shadcn-docs-nuxt@1.1.9`       | `@ztl-uwu/nuxt-content: ^2.13.9` | `^3.21.0`   | 未声明  |
| `shadcn-docs-nuxt@1.2.2`       | `@ztl-uwu/nuxt-content: ^2.14.1` | `^4.4.5`    | 未声明  |
| `@ztl-uwu/nuxt-content@2.13.9` | 不适用                           | `3.16.2`    | 未声明  |
| `@ztl-uwu/nuxt-content@2.14.1` | 不适用                           | `^4.4.5`    | 未声明  |

真正的问题不是“pnpm 随机坏了”，而是两个契约缺口叠加：

1. `^2.13.9` 允许安装 `2.14.1`，但上游 minor 更新已经跨过 Nuxt 3/Nuxt 4 运行时世代。
2. Content 运行时代码直接 `import { getQuery, getCookie } from "h3"`，却没有声明 H3 dependency 或 peer dependency。

因此不能只读 `package.json` 的版本范围，必须检查 fresh install 后的实际解析树。

### 已验证的坏组合

```text
shadcn-docs-nuxt 1.1.9
  -> 允许 @ztl-uwu/nuxt-content ^2.13.9
  -> 实际解析到 @ztl-uwu/nuxt-content 2.14.1
  -> Content 未声明 h3，但运行时直接 import h3
  -> pnpm monorepo 解析到 h3 2.0.1-rc.22
  -> Nuxt 3.21.2 / Nitro 2.13.3 的 H3 v1 事件和导出契约被破坏
  -> Content cache/search API 500
  -> Nitro prerender 失败
```

两个错误信号要区分：

- `ERR_INVALID_URL`：H3 v2 的 `getQuery` 尝试对 Nitro 传入的相对 URL 执行 `new URL()`，没有 base URL。
- `sendError` 导出缺失：H3 v1/v2 的入口导出契约不同，属于更直接的 API 代际不兼容。

这两类错误都优先检查 Content/Nuxt/H3 实际解析，不要先改 Markdown、Tailwind 或页面组件。

### 已验证的好基线与未验证候选线

当前已通过 fresh API、单包构建和串行全量构建验证的保守基线是：

```json
{
	"shadcn-docs-nuxt": "1.1.9",
	"@ztl-uwu/nuxt-content": "2.13.9",
	"nuxt": "3.21.2",
	"h3": "1.15.11"
}
```

`shadcn-docs-nuxt@1.2.2 + Content@2.14.1 + Nuxt 4.4.x` 只能作为 manifest 看起来同代的候选迁移线。本仓库没有对它执行迁移、构建或部署验证，不能写成“已经可用”。

不要把结论扩大成“任何 minor 漂移都会失败”。当前证据只能证明一个已复现坏组合和一个已完整验证的固定基线。

## 事故 A 的运行时错误与资源错误是两条线

Content API 的 H3 失配和 Windows 构建 OOM 不是同一个问题：

- 默认约 `4,144 MiB` V8 堆时，Nitro prerender 阶段可能真实 OOM，退出码为 `134`。
- 提高到 `8 GiB` 后，进程峰值工作集约 `7 GiB`，高 CPU 和较长无完成行仍可能是正常构建长尾。
- fresh 日志中的单包构建和两次串行全量构建可以成功完成，证明“日志停住”不等于永久死锁。

因此：

- 只提高堆不能修复 H3 失配，Content API 仍会 500。
- 只固定 H3/Content 不能保证构建资源足够，仍需要 Windows 资源门禁。
- 看到高 CPU 就杀进程，会把正常长尾误判为故障，并可能留下残留子进程。

## 事故 B：workspace 文档站的独立生产事故链

不要把这条 workspace 生产事故简单写成版本失配事故的复现。eams 已确认的是 Windows workaround 泄漏到 Vercel 后形成的三层生产故障：

| 层级   | 现象                                                                 | 根因                                                                                          |
| ------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 第一层 | `FUNCTION_INVOCATION_FAILED`、`Cannot find module 'entities/decode'` | 无条件 `trace:false` 让云函数缺少外部依赖；`entities` 多版本又造成追踪歧义                    |
| 第二层 | `ERR_MODULE_NOT_FOUND: Cannot find package '@vueuse/core'`           | workspace 包和 `element-plus` 被 Vite SSR externalize，pnpm 符号链接导致 NFT 没追踪到正确依赖 |
| 第三层 | `Cannot read properties of null (reading '_id')`                     | `prerender:routes` 清空路由，document-driven Content 没有生成结构化内容缓存                   |

### 事故 B 中几个配置的阶段边界

- `vite.ssr.noExternal`：Vite SSR 阶段；优先处理 workspace 包及其运行时依赖被外部化的问题。
- `nitro.externals.inline`：Nitro Rollup 阶段；不能替代已经发生的 Vite SSR externalization。
- `nitro.externals.trace`：NFT 外部依赖追踪；Windows 本地可以条件化 workaround，但不能无条件关闭后复用到 Vercel。
- `prerender:routes`：会影响 Content document-driven 数据生成；清空路由不能作为默认构建优化。

### 事故 B 的最终修复组合

1. workspace 包和 `element-plus` 完整运行时依赖树加入 `vite.ssr.noExternal`。
2. Nitro 只保留精准的 inline 列表，不使用 `inline: [/.*/]` 作为通用解。
3. Windows trace workaround 平台条件化，Linux/Vercel 保留正常 trace。
4. 恢复 `prerender: { crawlLinks: true }`，删除活动的 `prerender:routes` 清空钩子。
5. 用 workspace overrides 统一确实需要统一的多版本依赖；该事故中验证过的示例是 `entities: "^7.0.1"`，但新项目仍必须先检查实际依赖树，不能盲目照搬。
6. `entities`、`std-env` 等代码实际 import 的包，在当前文档包显式声明。

## 推荐的故障排查顺序

### 1. 先创建 fresh 进程和 fresh 证据

- 停止当前文档包残留的 `pnpm -> cmd -> node -> nuxi` 进程。
- 不复用历史 dev server、历史日志或旧 API 响应。
- 清理 `.nuxt`、`.output` 后再单进程复现。

### 2. 先看实际依赖树

```powershell
pnpm --filter <docs-package> list nuxt shadcn-docs-nuxt @ztl-uwu/nuxt-content h3 nitropack --depth 4
pnpm --filter <docs-package> why h3
pnpm --filter <docs-package> why @ztl-uwu/nuxt-content
```

回答四个问题：主题使用哪个 Nuxt 世代、Content 使用哪个 Nuxt 世代、H3 由谁声明、运行时最终加载哪个 H3 实例。

### 3. 再做 Content 功能探针

```powershell
curl.exe -sS -i --max-time 10 http://127.0.0.1:<port>/api/_content/cache.json
curl.exe -sS -i --max-time 10 http://127.0.0.1:<port>/api/_content/search
```

两个接口都必须是 HTTP `200`，并且返回非空索引。首页 200 不能替代 Content API 200。

### 4. 再看浏览器 console 和 SSR 阶段

- 暗黑模式或侧栏失效：先查 ESM/CJS 导入错误和 hydration，不要先改 CSS。
- `@vueuse/core` 缺失：先查 `vite.ssr.noExternal`，不要只改 Nitro inline。
- `entities/decode` 缺失：先查 `entities` 多版本和 trace 产物，不要只删除 `trace:false`。
- `registerMessageResolver is not a function`：先用 `pnpm why` 查 `@intlify/*` 多版本，不要先堆 alias。
- MDC marker 裸文本：先查 MDC 语法和 Prettier 是否改写了 `content/**/*.md`。

### 5. 最后判断构建资源和平台 workaround

```powershell
$env:NODE_OPTIONS = "--max-old-space-size=8192"
pnpm exec nuxi build --logLevel=verbose
```

只有同时观察 PID、CPU、工作集、日志更新时间、阶段性产物和退出码后，才能判断是否真的卡死。Windows workaround 必须条件化，并在 Linux/Vercel 重新验证。

### 6. 最后做部署验证

本地构建成功只能证明本地链路。生产验收还要验证：

- Linux/Vercel 构建成功。
- 部署 URL 返回 200。
- Content API 和站内搜索正常。
- workspace 依赖没有 `FUNCTION_INVOCATION_FAILED` 或 `ERR_MODULE_NOT_FOUND`。
- Content prerender 没有被清空，页面数据不是空对象。

## 永远不要把这些结论混为一谈

- “Content/H3 版本失配”与“Windows NFT/OOM 长尾”是两个故障域。
- “workspace 生产环境缺包事故”与“Nuxt Content/H3 版本失配事故”是两条不同根因链。
- “当前固定基线已验证”不等于“Nuxt 4 候选线已验证”。
- “本地 Windows 构建成功”不等于“Linux/Vercel 生产成功”。
- “`prerender:routes` 历史 workaround 存在”不等于“它适合 document-driven Content 默认使用”。
