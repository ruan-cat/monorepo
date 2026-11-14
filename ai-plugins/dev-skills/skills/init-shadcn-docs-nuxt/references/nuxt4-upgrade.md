# Nuxt 4 世代升级与部署通道裁决

> 适用信号：Nuxt 3 → 4 世代升级；升级后云端构建或产物运行时逐包 `ERR_MODULE_NOT_FOUND`（ufo / hookable / @popperjs/core / entities / devalue）；
> `UNLOADABLE_DEPENDENCY` / `stream did not contain valid UTF-8` 且 dev hydration 卡死；`/_ipx/_/logo*.svg` 404；
> 正打算为构建 500 新增 prebuilt CI workflow、断开 Git 或更换部署通道。
>
> 与其他参考的分工：[`incident-repair.md`](incident-repair.md) 负责 Nuxt 3 保守基线与 Content/H3 世代漂移历史（事故 C/D 机理不在此重复展开）；
> [`production-graph-and-runtime-closure.md`](production-graph-and-runtime-closure.md) 负责通用的首个失败门与 inline/noExternal 准入纪律；本文件负责 Nuxt 4 世代的已验证矩阵、配置配方与部署通道裁决。
>
> 证据基线：eams-component-lib Nuxt 4 依赖升级（2026-11-11，文档站 `packages/vue-element-cui-nuxt`，生产域名 vec.ruan-cat.com，升级报告 §0.5、§13–§18）与 repro 实验仓 R46/R52/R53。
> 下文标注「实证」的条目均有三环境真实浏览器或产物级证据；被对照实验作废的历史中间结论显式标注作废，不得再引用。

## 1. 已验证 Nuxt 4 版本矩阵（2026-11-11 生产实证）

| 包                      | 声明范围                | 实际解析 | 说明                                                                      |
| ----------------------- | ----------------------- | -------- | ------------------------------------------------------------------------- |
| `nuxt`                  | `^4.6.4`                | 4.6.4    | 目标世代                                                                  |
| `shadcn-docs-nuxt`      | `^1.2.2`                | 1.2.2    | 层自身声明 nuxt `^4.4.5`、content `^2.14.1`、nuxt-og-image `^6.5.0`       |
| `@ztl-uwu/nuxt-content` | `^2.14.1`               | 2.14.1   | 仍为 content v2 世代 fork                                                 |
| `nitropack`             | Nuxt 内置               | 2.13.6   | Nuxt 4 官方运行时，**不是 nitro v3，不可替换**                            |
| `h3`                    | `^1.15.11`              | 1.15.11  | Nuxt 4 服务端仍 h3 v1                                                     |
| `vue`                   | `^3.5.44`               | 3.5.45   | —                                                                         |
| `vue-router`            | `^5.4.0`                | 5.4.0    | Nuxt 4 自带要求                                                           |
| `element-plus`          | `^2.14.8`               | 单版本   | 与组件库范围统一后 dedupe                                                 |
| `vite`                  | 随 `@nuxt/vite-builder` | 8.3.7    | rolldown 依赖优化器；8.3.7 实测 / 8.3.8 最新，oxide exclude 删除条件见 §3 |

**nitropack 版本边界（实测，非推断）**：

- `2.13.4` 是 repro Nuxt 3 绿版本，但**与 Nuxt 4 不兼容**：钉到 Nuxt 4.6.4 时 `@nuxt/nitro-server` API 失配，本地运行时 500。
- `2.13.5` 引入 unstorage 1.17.6 key 校验回归（repro R46，机理见 [`incident-repair.md`](incident-repair.md) 事故 C）。
- ⇒ **Nuxt 4 用 2.13.6**；不要把 Nuxt 3 世代的钉版经验平移到 Nuxt 4。

fresh install 后复核实际解析树（矩阵核对项与 Nuxt 3 不同）：

```powershell
pnpm --filter <docs-package> list nuxt shadcn-docs-nuxt @ztl-uwu/nuxt-content h3 nitropack --depth 4
pnpm --filter <docs-package> why h3 nitropack
```

世代门禁差异：Nuxt 4 **不需要** `nuxt-og-image: 5.1.9` 钉版（那是 Nuxt 3 世代门禁，见 [`workspace.md`](workspace.md)）；Nuxt 4 路径保持 `ogImage: { enabled: false }`（§7）。

## 2. F50 用户侧规避：`buildDir: ".nuxt"`（实证）

Nuxt 4.6 起，**生产构建**在未显式设置 buildDir 时把它迁到 `node_modules/.cache/nuxt/.nuxt`（`@nuxt/kit` dist/index.mjs:985，条件：非 dev 且未设置 buildDir）。该迁移造成两个独立故障：

1. **F50 内容库为空**：content devStorage 基址与快照读取目录错位（机理见 [`incident-repair.md`](incident-repair.md) 事故 D，不在此重复）。
2. **Windows SSR 外部化路径算错**：nitro externals 以 buildDir 为基准做相对化，迁移后产出畸形绝对路径（丢失 `node_modules/.pnpm` 前缀），运行态全 500 `ERR_MODULE_NOT_FOUND`。

**修复（一行）**：`nuxt.config.ts` 显式 `buildDir: ".nuxt"`。

**探针（构建后一条命令，无需启动服务）**：

```bash
grep -ac "nitro:bundled:cache:content" .output/server/chunks/_/nitro.mjs
# 0 = F50 中招；非零 = 内容库真实 bundled（eams 实测 39；repro Nuxt 3 基线 5）
```

这是 F50 的**首个已验证用户侧规避**（repro R52 当时判定「无用户侧规避、等上游 nuxt/nuxt#36792」；eams 2026-11-11 验证修复，修复后 Content cache API 返回 471KB 真实内容、search documentCount 82）。升级后验收仍必须做 Content **响应体内容断言**，HTTP 200 不足为证。

## 3. Vite 8 rolldown 原生 .node 优化崩溃（oxide，实证）

**信号**（dev 首启）：

```log
ERROR [unhandledRejection] Error during dependency optimization:
[UNLOADABLE_DEPENDENCY] Could not load …/@tailwindcss/oxide-win32-x64-msvc/tailwindcss-oxide.win32-x64-msvc.node
  ╰─ stream did not contain valid UTF-8
```

**机理**：Vite 8 的 rolldown 依赖优化器把原生 `.node` 当 UTF-8 JS 解析而崩溃，留下**半写的 deps 缓存**：浏览器网络面板可见 `…/.cache/vite/client/deps/*.js [pending]` 永不完成 → 客户端模块图停滞 → SSR HTML 在但 hydration 失效（表格 0 行、按钮无响应），且 **console 常无报错**，极易误判为正常。

**修复**：客户端与 SSR 双侧排除，并清掉半写缓存：

```ts
vite: {
  optimizeDeps: {
    exclude: ["@tailwindcss/oxide", "@tailwindcss/oxide-win32-x64-msvc"],
  },
  ssr: {
    optimizeDeps: {
      exclude: ["@tailwindcss/oxide", "@tailwindcss/oxide-win32-x64-msvc"],
    },
  },
},
```

- 平台包名按实际平台替换（`oxide-win32-x64-msvc` 为 Windows x64 实测值）。
- 修复后清 `node_modules/.cache/vite` 再重启 dev；验收 = oxide 报错计数 0 + 真实浏览器交互全绿。
- 排查纪律：dev「页面能打开」≠「可用」；用网络面板找 `[pending]` 的优化依赖请求，console 干净 ≠ 模块图健康（另见 [`ssr-hydration.md`](ssr-hydration.md)）。
- **2026-11-14 冷缓存 A/B 复测**：移除 exclude → vite 8.3.7 / rolldown 1.2.18 `UNLOADABLE_DEPENDENCY`、dev 503；保留 exclude → oxide 报错 0 + 真实 Chrome 全绿。exclude 是当前必需项，不是可顺手删除的历史包袱。
- **删除条件**：vite 8.3.8+ 上游修复后，冷缓存（清 `node_modules/.cache/vite`）复测通过才可移除双排除；未命中前保留。dev-only 配置（如 oxide exclude）以 dev 冷缓存复测为准，不适用 §9 产物级回归证据的广谱措辞。
- **作用域**：dev 直跑 `nuxt dev`，不经 turbo；`optimizeDeps` 仅作用 dev 依赖预构建，不影响云端构建——云端构建故障不要归因到这段配置。

## 4. popper ESM alias（Nuxt 4 实证值）

真实 `@popperjs/core` 为 CJS，nitro 外部化时报 named export `placements` 错误。修法是**部署文档包 manifest** 声明 npm alias：

```json
{
	"dependencies": {
		"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.8"
	}
}
```

- [`production-graph-and-runtime-closure.md`](production-graph-and-runtime-closure.md) 中的 `^2.11.7` 是 Nuxt 3 世代实证值与四前提准入；`^2.11.8` 是 Nuxt 4 世代 eams 生产实证值。**准入纪律跨世代不变**：exact error + manifest 直接声明 + fresh 解析图 + 产物 HTTP smoke，缺一不可。
- **alias 不是孤立修复**：npm alias 有追踪漏包历史，必须与 §6 的 UI 链 inline 配套（列表同时含 `@popperjs/core` 与 `@sxzz/popperjs-es`），否则云端闭包仍缺包。

## 5. overrides dedupe（pnpm 12，写在 pnpm-workspace.yaml）

多版本包会被 nitro `linkPackage` 成 Windows 绝对 symlink（R53/F41，见 [`windows.md`](windows.md)），上传 Linux 后失效。dedupe 从源头消除多版本：

```yaml
# pnpm-workspace.yaml（pnpm 12：设置键只认 camelCase）
overrides:
  entities: ^7.0.1
  source-map-js: ^1.2.1
```

- pnpm 12 布局：overrides 写在 `pnpm-workspace.yaml`；构建权限用 `allowBuilds`（`onlyBuiltDependencies` 不再授予权限）。
- **禁 `node-linker: hoisted` / `shamefully-hoist`**：nuxt#13644 实证破坏 NFT 追踪；eams 实测 hoisted 仍缺 ufo——hoist 是反模式，不是闭包修复。
- dedupe 后用 `pnpm why` 确认单版本，再删对应旧 override；死依赖（如 tsdown）连同其专属 override 一起删。每项删除都要有产物级回归证据（§9 纪律）。

## 6. 条件准入：element-plus UI 链 `externals.inline` 配方（实证）

**准入条件（全部满足才可用；默认模板保持最小，禁广谱 inline）**：

1. 文档站**实际消费 element-plus**（部署文档包 manifest 声明并运行时导入）；
2. 云端或产物运行时逐包报 `ERR_MODULE_NOT_FOUND`（ufo / hookable / @popperjs/core 等），首个失败门定位在 Nitro 闭包缺包；
3. 不是 Vite SSR transform 阶段错误（那走 `noExternal` 准入，见 production-graph 参考）。

**根因链**：element-plus 外部化 + popper alias → 运行时 import 闭包缺包 → `ERR_MODULE_NOT_FOUND ufo/hookable/@popperjs/core`。全链 inline 后依赖在构建期解析，闭包缺包消失（eams `6d99df1` 修复，生产与 B 对照实验双重验证）。

已验证的完整 nitro 块（eams 生产配置，注释即文档）：

```ts
nitro: {
  vercel: {
    functions: { runtime: "nodejs22.x" },
  },
  // Vercel 上 ipx 无法优化 SVG 致 /_ipx/_/logo*.svg 404；重定向到静态原图（见 §7）
  routeRules: {
    "/_ipx/_/logo.svg": { redirect: "/logo.svg" },
    "/_ipx/_/logo-dark.svg": { redirect: "/logo-dark.svg" },
  },
  externals: {
    // 多版本包会被 nitro linkPackage 成 Windows 绝对 symlink，上传 Linux Vercel 后失效；
    // 目标性 inline 消除 symlink，使 .func 闭包自包含
    inline: [
      "ufo",
      "devalue",
      "entities",
      "hookable",
      "unhead",
      "parse5",
      "source-map-js",
      "vue-bundle-renderer",
      "h3",
      // element-plus 若外部化会运行时 import @popperjs/core(alias) 而闭包缺包；
      // 整条 UI 链 inline，使其依赖在构建期解析
      "element-plus",
      "@element-plus/icons-vue",
      "@popperjs/core",
      "@sxzz/popperjs-es",
      "@vueuse/core",
      "@vueuse/shared",
      "reka-ui",
      "defu",
      "debug",
      "lodash-es",
      "lodash-unified",
      "async-validator",
      "memoize-one",
      "normalize-wheel-es",
      "@ctrl/tinycolor",
      "dayjs",
    ],
    traceOptions: { exportsOnly: false },
  },
  prerender: {
    // document-driven 模式必须预渲染，否则运行时 content 数据库为空
    crawlLinks: true,
  },
},
```

**边界与删除条件**：

- 这是「文档站消费 element-plus」的**条件配方**，不是模板默认；`inline: [/.*/]`、`inline: [/node_modules/]` 是明禁的广谱通用解（eams `ab71b76` 广谱 inline 后被收窄，见 §9 返工案例）。
- 逐项删除条件遵循 [`production-graph-and-runtime-closure.md`](production-graph-and-runtime-closure.md) 的 inline 准入表；整表删除必须有产物级回归证据。
- 产物验收：`.func/node_modules` 绝对 symlink 计数 = 0、闭包自包含（ufo/devalue/entities/hookable/element-plus 全在）、`.output` 启动 + HTTP 内容断言。

## 7. 其他 Nuxt 4 路径配置点

| 配置项                          | Nuxt 4 路径值               | 作用域与证据                                                              |
| ------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| `ogImage`                       | `{ enabled: false }`        | 保持禁用；1.2.2 层声明 nuxt-og-image `^6.5.0`，Nuxt 3 的 5.1.9 钉版不适用 |
| `icon.serverBundle.collections` | `["lucide"]`                | 与 Nuxt 3 相同，不限制集合会 Nitro OOM                                    |
| `compatibilityDate`             | `"2025-05-13"`（字符串）    | eams docs 站实测值，**仅适用 Nuxt 4 文档站**，见下方作用域声明            |
| ipx SVG logo                    | `nitro.routeRules` redirect | 通道依赖，见下方                                                          |

**compatibilityDate 作用域声明**：`"2025-05-13"` 是 Nuxt 4 文档站（Nuxt 内置 nitropack 2）的实测值；它**不覆盖** `nitro-api-development` 技能对独立 Nitro API 的 `2024-09-19` 契约——两者是不同对象。Nuxt 3 文档站基线仍用 [`incident-repair.md`](incident-repair.md) 的双平台对象契约；不要跨世代、跨对象盲抄日期。

**ipx SVG logo 404（通道依赖）**：

- Vercel node-server / CI-prebuilt 产物下 `/_ipx/_/logo.svg`、`/_ipx/_/logo-dark.svg` 404（ipx 在 Vercel 对 SVG 优化失败）。修复 = §6 块中的 `routeRules` redirect 到静态原图（eams `63b37e8`，生产实测 307 → `/logo.svg` 200）。
- **Git-integration 下 @nuxt/image 自动走 `/_vercel/image` provider，ipx 404 不复存在**（B 实验实测 `naturalWidth > 0`）。routeRules 为 Git-integration 与本地的可选回退，不是 Git-integration 通道的必需项。
- logo 资源纪律不变：必须指向 `public/` 下真实资源，不要置空 logo（见 [`nuxt-config.md`](nuxt-config.md)）。

## 8. nitro v3 / h3 v2：双应用架构，不是文档站运行时（实测裁决）

- npm 元数据（2026-11-11）：`nuxt@4.6.4` → `@nuxt/nitro-server@4.6.4` → `nitropack ^2.13.6` + `h3 ^1.15.11`；**没有任何已发布 Nuxt 版本以 nitro v3 为运行时**。
- 受控实验：override `nitropack → npm:nitro@3.0.261103-rc` 或单独 `h3: ^2.0.8` → install/build 均 exit 1，`Loading @nuxt/nitro-server server builder failed`——`@nuxt/nitro-server` 在**模块加载期**即调用 h3 v1 / nitropack API，v2/v3 在加载期就崩，连 prerender 都到不了。
- **结论**：文档站运行时必然 nitropack 2 / h3 v1（Nuxt 内置，不可替换）；项目级 nitro v3 / h3 v2 需求用**独立 API 应用**（双应用架构）：`packages/api` 配 `nitro ^3.0.261103-rc` + `h3 ^2.0.8`，`serverDir: "server"`，路由用 `defineHandler`，`/health` 返回 `{"ok":true,"nitro":3,"h3":2}` 实证。API 的 compatibilityDate 遵循 `nitro-api-development` 契约。
- **不要用 override 强塞**——那会把可部署站点变成不可构建。

### 子包共存隔离纪律（pnpm isolated）

双应用落地后，docs（nitropack 2 / h3 v1）与 api（nitro 3 / h3 v2）在同一 pnpm workspace 共存，必须过以下隔离门（机制层见 [`dependency-triage.md`](dependency-triage.md) §1/§2）：

1. **显式声明**：docs 包 `dependencies` 显式写 `h3: 1.15.11`（repro `apps/docs` 与 eams 均如此），把自身子树钉在 v1；api 包的 h3 v2 由 nitro v3 自带，**不向 docs 泄露**。
2. **禁裸导入**：未声明 h3 却 `import "h3"` 的包会命中 `.pnpm/node_modules` 隐藏提升层「彩票」；任一 sibling 引入 h3 v2 即翻转提升层、所有裸导入包集体爆炸（ai-vue-doc 2026-09-05 实证：`ai-rag-api` 引入 `nitro@3.0-beta` 后四包同时中招）。排查用 [`dependency-triage.md`](dependency-triage.md) §2.2 排雷脚本。
3. **fresh install 后双树复核**：

   ```bash
   pnpm --filter <docs> why h3 nitropack   # 期望 h3 1.x / nitropack 2.x 单版本
   pnpm --filter <api> why h3 nitro        # 期望 h3 2.x 仅经 nitro 3 引入
   ```

   2026-11-14 实测：docs `h3@1.15.11` + `nitropack@2.13.4`；api `h3@2.0.1-rc.22` + `nitro@3.0.260610-beta`。

4. **跨应用隔离门（G10）**：按 repro `docs/task-artifacts/acceptance-gates.md` G10 做 docs-only / api-only / 双应用 / 不同构建顺序四组对照；加入 sibling 后 docs 解析若变化，必须保存 dependency resolution 证据。云侧实证：repro R34 + `evidence/2026-09-30-vercel-deploy-e2e.md`（api `/v1/runtime` 返回 `"generation":"nitro3-h3v2"`）。
5. **第三方包漏声明**：用 `packageExtensions` 逐包注入（v1 世代包注 v1），**禁全局 override**——h3 v1/v2 共存时 override 会破坏真正需要 v2 的 api 子树（决策表见 [`dependency-triage.md`](dependency-triage.md) §3）。

## 9. 部署通道裁决与绕远路误区（本轮最重要新增）

### 默认通道：Git-integration 云端自建（实证）

**闭包配置修复（§6）后，Vercel Git-integration 云端 Linux 自建 = 默认且最简通道**（push 即部署）。B 单变量对照实验：重连 Git、inline 修复保持不变、空提交 `1dfccdd` 触发云端自建 → `3yogcoepp` 绿（Duration 2m = 真实云构建），生产 200 + 真实 Chrome 交互全活 + console 零 error。

### CI prebuilt workflow = scoped fallback，不是默认

仅适用「**本地 Windows 产物直接上传**」场景：

- R53/F41：Windows 产物 symlink 为构建机绝对路径，换机即断；Linux 同位相对 symlink 可移植（见 [`windows.md`](windows.md)）。
- eams 运行时实锤（报告 §13.5）：symlink = 0 的自包含产物经 `vercel deploy --prebuilt` 上传后**仍 500**——Windows 产物内含不可移植的构建机绝对路径，**不止 symlink**。Windows 本地产物仅用于 dev/preview 验收。
- **R53 适用面不得泛化到云端自建**：云端 Linux 自建不经 Windows 产物，「Windows 产物不可移植」与「云端构建闭包缺包」是两个故障面。

### 误区案例：过度设计部署通道（eams 2026-11-11，作废结论存档）

| 阶段 | 动作/结论                                                                             | commit                     | 问题                                                                 |
| ---- | ------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| 1    | 云端构建 500：ERR_MODULE_NOT_FOUND ufo → hookable → @popperjs/core                    | —                          | 症状是闭包缺包，指向**配置**，不指向通道                             |
| 2    | 过早归因「上游阻塞」                                                                  | `1de7835`                  | 未穷尽单变量实验                                                     |
| 3    | 把 R53「Windows 产物不可移植」当云端 500 唯一根因                                     | `cbff648`                  | 适用面混淆（见上）                                                   |
| 4    | 过度设计：dispatch-only prebuilt workflow + git disconnect + 3 secrets + symlink 校验 | `e8eead0`                  | 用整套平行部署基础设施绕一个配置问题；push 即部署退化为手动 dispatch |
| 5    | 真修复仅一项精确配置：element-plus 全 UI 链 inline                                    | `6d99df1`                  | 闭包缺包消失                                                         |
| 6    | 把 CI prebuilt 绿归因于「通道可靠」                                                   | 报告 §14（**已作废**）     | **混淆变量**：修复与通道同时落地，绿不能归因于通道                   |
| 7    | B 单变量对照：重连 Git、inline 不变、空提交触发云端自建                               | `1dfccdd` → `3yogcoepp` 绿 | 通道变量被隔离 ⇒ 云端自建同样可靠                                    |
| 8    | 删 workflow、恢复 Git 自动部署                                                        | `eb1c5f5`                  | 过度设计清除，回归最简                                               |

**最隐蔽的一步 = 混淆变量**：CI prebuilt 绿其实是 inline 修复的功劳，但因为它发生在**新通道**上，就被误归因于通道——等于「同时吃两种药把病治好，却归功于第二种」。修复与基础设施同时落地时，成功归因无效；必须补单变量对照，再决定基础设施去留。

### 可复用纪律五条

1. **配置优先、通道最后**：构建/运行时 500 先穷尽配置级单变量实验（externals/inline/alias/overrides）；基础设施（CI workflow、换通道、换平台）是最后手段，不是第一手段。
2. **修复与基础设施同时落地 ⇒ 归因无效**：必须补「撤掉基础设施」或「撤掉修复」的单变量对照，再决定去留。
3. **「云端/平台/上游不可靠」结论须对照实验支撑**：单次失败观测不够；平台性事实限定故障面（R53 不泛化到云端自建）。
4. **每加一层写明可删除条件**：本例 workflow 的可删除条件 =「含 inline 修复的云端自建绿」，B 实验命中即删。
5. **动手前先交叉核对技能与历史台账**：inline 精确准入、禁广谱 workaround、R53 适用面在技能与台账中早有明文——先读可避免大部分绕路。

### 配置层返工配套案例（commit 对质）

与通道绕远路同根：过早结论 + 跳过单变量纪律。eams 配置层「激进删除 → 被迫补回」对质表（报告 §16）：

| 激进删除                                                   | 被迫补回                                               | 违反的纪律                                 |
| ---------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------ |
| `58355f4` 清空 overrides + 移除 shamefully-hoist           | `b321e31` 恢复 entities override、`b5ba248` 恢复 hoist | 每项都应有可删除条件；删除须产物级回归证据 |
| `409a957`/`42b0041` 删 noExternal/alias/shim、popper alias | `99b4ab0` 恢复 popper alias、`6d99df1` 补 UI 链 inline | 精确准入；popper alias 为历史实证修法      |
| `ab71b76` `inline: [/node_modules/]` 广谱内联              | 后续收窄为精确列表                                     | 明禁广谱通用解                             |
| `5664e8c` node-linker=hoisted                              | `99b4ab0` 回退                                         | hoist 反模式                               |

固化纪律：**删除任何运行时补丁前必须有产物级回归证据**（产物启动 + HTTP 内容断言 + 闭包复核），否则保留；返工后用 commit 对质做 grill-me 式复盘，逐条对照技能条款。通用准入与删除条件见 [`production-graph-and-runtime-closure.md`](production-graph-and-runtime-closure.md)。

### 部署链缓存门（eams 实测）

turbo 远程缓存曾以 20s「构建」还原最早一次坏产物（真实 Nuxt 构建约 2min），使后续修复全部不生效。部署任务（`build:vercel` 等）应 `cache: false`，本地验收同样冷缓存——cache 命中只说明任务键相同，不说明 runtime closure 可信（通用纪律见 production-graph 参考）。

## 10. Nuxt 4 布局迁移与遗留信号

**布局迁移（升级必做）**：Nuxt 4 将 srcDir 切到 `app/`。`pages/ composables/ plugins/ assets/ app.config.ts components/` 全量 `git mv` 进 `app/`（保留历史）；仅靠显式 import 消费的 demo 壳组件移出 `app/components/` 自动扫描目录（如 `app/demos/`），消除与嵌套实现的自动注册重名（Nuxt 对相邻重复段去重，会让壳组件的自动导入名消失）；`~/app/components/**` 引用、tailwind `@config/@source`、content globs 与测试导入路径同步修正。

**遗留信号（cosmetic，勿当故障治）**：

- `NUXT_B7002`：`@nuxtjs/mdc` 经 content 注入的 10 条悬空 `vite.optimizeDeps.include` 声明——上游系统性脱节，**不要用「加依赖」治**（报告 §10 结论）。
- dev 入口脚本 URL 含 Windows 构建机绝对路径：Nuxt 4.6 dev 态表现，可正常解析，不影响生产产物。
