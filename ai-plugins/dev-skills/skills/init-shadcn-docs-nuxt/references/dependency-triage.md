# 依赖排查深度手册（提升层 · 预构建 · fork 治理）

> 本手册是 2026-09-05 ai-vue-doc 四层故障的完整依赖排查方法论沉淀。适用信号：`sendError` 导出缺失、`ERR_INVALID_URL`、`Failed to resolve dependency`、整站不水合但 console 干净、`sharp binaries cannot be found` 警告、fork 包升级后的批量 WARN。
>
> 与其他参考的分工：[`incident-repair.md`](incident-repair.md) 负责 Content/H3 **世代漂移**的版本组合审查；本手册负责**同版本组合下**依赖被 pnpm 解析错位的排查（提升层、未声明依赖、预构建盲区、fork 残留）。

---

## 1. 核心心智模型：三层解析链

一个 `import "h3"` 从代码到运行，要经过三层解析。**任何一层的版本都与预期不同，错误就在那一层发生**：

```plain
代码 import "x"
  ↓ 第一层：包自身的 package.json 是否声明了 x？
  ↓   声明了 → 解析到自己依赖子树（可控）
  ↓   未声明 → "裸导入"，落进第二层
  ↓ 第二层：pnpm 提升层 .pnpm/node_modules/x（hoisted）
  ↓   提升层只有一份 x → 裸导入全部命中它（彩票）
  ↓   多份时 → 按 pnpm 链接规则挑一份（更不可控）
  ↓ 第三层：vite/nitro 构建层（optimizeDeps 预构建 / externalize / trace）
  ↓   不在扫描入口 → 原始产物直出，CJS 无 interop
  ↓   externalize → Node ESM 去解析，产物不兼容直接崩
```

**为什么"以前能跑"不能作为安全证据**：ai-vue-doc 案例中，`ai-rag-api` 引入 `nitro@3.0-beta` 之前，提升层 h3 恰好是 v1，四个包的裸导入"意外一致"；beta 引入后提升层翻转为 v2，四个包同时爆炸。隐性依赖运气，翻车只差一个传递依赖。

---

## 2. 提升层排查：`pnpm why` 的三个盲区

### 2.1 盲区一：`pnpm why` 显示"只有一个版本" ≠ 运行时单实例

pnpm 的 peer hash 变体会产生多份物理拷贝（如 `nuxt@3.21.2_peer-hash-A` 与 `nuxt@3.21.2_peer-hash-B`），`pnpm why` 可能只显示版本号而不可见 hash 分裂。

正确检查动作（按序执行，缺一不可）：

```bash
# 1. 提升层实际是什么（裸导入的真实解析目标）
ls node_modules/.pnpm/node_modules/ | grep -i "^h3"
cat node_modules/.pnpm/node_modules/h3/package.json | grep '"version"'

# 2. 物理实例有几个（peer hash 分裂检测）
ls -d node_modules/.pnpm/h3@* node_modules/.pnpm/nuxt@* 2>/dev/null

# 3. 文档包实际链接到哪一份
ls -la packages/<docs>/node_modules/ | grep -E "h3|nuxt"
```

### 2.2 盲区二：声明范围正确 ≠ 运行时代码正确

包可能声明了 `h3: "^1.x"` 却在代码里 `import { sendError } from "h3"` 解析到别处——声明只约束自己的子树，约束不了裸导入的其他包。检查动作：

```bash
# 找出某作用域下「未声明 h3 但代码裸导入 h3」的包（排雷脚本核心逻辑）
for p in node_modules/.pnpm/@nuxt+* node_modules/.pnpm/@nuxtjs+*; do
  pkg="$p/node_modules/$(basename ${p//@/+} 2>/dev/null)"
  # 更可靠的写法：直接检查每个 .pnpm 目录内包的 package.json 与 dist
done
# 或一次性：
grep -rl 'from "h3"' node_modules/.pnpm/@nuxt+*/node_modules/@nuxt/*/dist \
  node_modules/.pnpm/@nuxtjs+*/node_modules/@nuxtjs/*/dist 2>/dev/null
# 对每个命中包，核对其 package.json dependencies 是否声明 h3
```

2026-09-05 实证命中四个包：`@nuxt/icon@1.15.0`、`@nuxtjs/mdc@0.18.4/0.20.2`、`@ztl-uwu/nuxt-content@2.13.9`、`nuxt-og-image@5.1.9`。

### 2.3 盲区三：lockfile 不可见

部分仓库将 `pnpm-lock.yaml` 加入 `.gitignore`（SmallAliceWeb 即如此），`git status` **永远不会显示它**。据"lockfile 无变更"推断依赖状态是错误方法；必须直接读文件内容或重跑 install 验证。

---

## 3. 修复手段决策表：packageExtensions vs overrides vs patch

| 手段                     | 作用                                 | 适用场景                                                      | 禁忌                                                                                        |
| ------------------------ | ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `pnpm.packageExtensions` | 给第三方包**注入它漏写的声明**       | 包未声明某依赖但代码在用（如裸导入 h3）                       | 不能改代码逻辑；版本要写给该包期望的（v1 世代包注入 v1）                                    |
| `pnpm.overrides`         | **全局强制**某包版本                 | 上游声明范围过宽跨世代（如 `nuxt-og-image: 5.1.9` 固定）      | 会波及全仓库所有使用者——**h3 v1/v2 共存时禁用**（会破坏真正需要 v2 的包，如 nitro v3 beta） |
| `pnpm patch`             | **改第三方包的产物代码**             | 包改了名但 dist 内硬编码旧自引用（fork 残留）、需最小逻辑修正 | patch 绑定精确版本，升级需重做；只做最小 diff                                               |
| 文档包直接声明依赖       | 给文档站自己的 deps 加 `h3: 1.15.11` | 只影响文档包自身子树的解析兜底                                | 管不到其他包的裸导入，通常与 packageExtensions 配合                                         |

**h3 案例的最终组合**（已验证）：`packageExtensions` 四包注入 `h3@1.15.11` + `overrides` 仅固定 `nuxt-og-image: 5.1.9`（它是世代越界源，需强制）+ 文档包声明 `h3` 兜底。

### 注入后必须复核

```bash
pnpm install   # packageExtensions 生效需要重算
ls node_modules/.pnpm/node_modules/h3  # 确认提升层
pnpm why h3   # 确认各消费者解析
```

---

## 4. optimizeDeps 预构建盲区

### 4.1 扫描入口的边界

Vite 的 optimizeDeps 扫描只覆盖**常规入口**（页面、组件、非 `.client` 插件等）。以下导入**不在扫描范围**，整棵依赖树以原始产物直出：

| 盲区来源                    | 实证案例                                                 | 后果                                                                                                                    |
| --------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `.client.ts` 插件的顶层导入 | `plugins/ai-vue.client.ts` 导入 element-plus             | dayjs、@braintree/sanitize-url 等 CJS 传递依赖无 ESM interop → entry 执行 SyntaxError → **整站不水合且 console 常无错** |
| 插件内**动态导入**的包      | shadcn-docs-nuxt 的 `mermaid.client.ts` 动态导入 mermaid | 其 chunk 裸导入 dayjs，同样无 interop                                                                                   |

### 4.2 修复：显式 include + 嵌套 `>` 语法

```ts
// nuxt.config.ts
optimizeDeps: {
  include: [
    "element-plus",              // .client 插件导入的整包
    "shadcn-docs-nuxt > mermaid" // 嵌套语法：非直接依赖也能纳入预构建
  ],
},
```

- include 后 esbuild 预构建会**递归打包全部传递依赖**并提供 CJS→ESM interop，因此整包 include 优于逐个补 CJS 传递依赖（`element-plus > dayjs` 只修 dayjs，下一个崩 `@braintree/sanitize-url`——逐错打地鼠的实证）。
- 修改 include 后需重启 dev（预构建缓存重算）。

### 4.3 反模式：逐错打地鼠

同型错误（`does not provide an export named`）连续出现 ≥2 次时，停止逐个修，回到 §1 的三层解析链找**共同机制**：要么是裸导入未声明（→ §3），要么是预构建盲区（→ §4.2）。

---

## 5. fork 包治理

### 5.1 改名残留：fork 的头号隐患

fork 包改名后，dist 内硬编码的**自引用字符串**不会自动更新。实证：`@ztl-uwu/nuxt-content`（fork 自 `@nuxt/content`）的 `dist/module.mjs` 硬编码：

```js
include.push("@nuxt/content > slugify"); // 旧包名前缀
// replace 到 "@nuxt/content > @nuxtjs/mdc > "     // 同样是旧前缀
```

自身包名已改为 `@ztl-uwu/nuxt-content`，vite 解析不到物理不存在的 `@nuxt/content` → **必然失败**，dev 刷 7 条 `Failed to resolve dependency` WARN。

### 5.2 修复流程（pnpm patch）

```bash
# 1. 创建 patch 编辑目录
pnpm patch @ztl-uwu/nuxt-content@2.13.9

# 2. 编辑输出的 .pnpm_patches/.../dist/module.mjs
#    将 "@nuxt/content > slugify" 等前缀改为 fork 自身包名

# 3. 提交前先确认依赖链物理完整（改出的嵌套路径必须可解析）
grep -A20 '"dependencies"' <fork>/package.json   # fork 必须声明 slugify 与 @nuxtjs/mdc

# 4. 提交
pnpm patch-commit "D:/.../.pnpm_patches/@ztl-uwu/nuxt-content@2.13.9"
# 产物：patches/@ztl-uwu__nuxt-content@2.13.9.patch + 根 package.json patchedDependencies
```

**验证口径**：dev 警告归零 + 多页面 200 + 生产构建 EXIT=0（patch-commit 重组过依赖树，必须做构建回归）。

### 5.3 引入 fork 包的入场检查

```bash
# 引入任何 fork 包后立即执行：grep dist 内的自引用字符串
grep -rn '"@nuxt/content' node_modules/.pnpm/@ztl-uwu+nuxt-content@*/node_modules/@ztl-uwu/nuxt-content/dist/
```

---

## 6. 构建期平台二进制追踪（sharp 案例）

### 6.1 警告的两种性质

`sharp binaries for win32-x64 cannot be found`（来自 `@nuxt/image` 在 nitro `compiled` 钩子后检查 `.output/server/node_modules/@img/`）**不一定是缺依赖**。先验证：

```bash
node -e "const s=require('sharp'); console.log(s.versions.sharp)"  # 能加载 = 不是缺依赖
```

### 6.2 真根因：trace 关闭使追踪目录必然为空

若项目 win32 上设置了 `nitro.externals.trace: false`（OOM 修复的有意决策），则 `buildEnd` 直接跳过追踪，`.output/server/node_modules/@img/` 必然为空 → 警告必然出现，**在不回退 OOM 修复的前提下无法消除**。此时：

- 本地 preview 不受影响（Node 从工作区 node_modules 解析到 sharp）。
- 处置：win32 保留决策并在 nuxt.config.ts **注释文档化**该警告为已知良性副作用。
- 非 win32（CI/Vercel 部署构建）分支补 `externals.traceInclude: ["sharp"]`——IPX 对 sharp 的 require 是变量拼接动态路径，NFT 静态分析可能漏追平台二进制。

### 6.3 铁律

**勿把此警告当缺依赖反复安装 sharp。** 先区分"本地构建警告"（可能良性）与"部署产物真缺"（需要 traceInclude），判据是 `.output/server/node_modules` 的实际内容与目标运行环境。

---

## 7. 排查决策树（速查）

```plain
依赖类报错进来
├─ sendError 缺失 / ERR_INVALID_URL / Content API 500
│   → incident-repair.md 事故 A（世代漂移）→ 本手册 §2/§3（提升层 + packageExtensions）
├─ "does not provide an export named 'X'"
│   ├─ 浏览器端 + hydration 打断 → compat.md（alias/dedupe 速查表）
│   └─ entry 级 SyntaxError + 整站不水合 → 本手册 §4（optimizeDeps 盲区）
├─ Failed to resolve dependency: "A > B"
│   → 本手册 §5（fork 自引用残留，pnpm patch）
├─ sharp/NFT 警告
│   → 本手册 §6（先验证可加载性，再查 trace 配置）
└─ 同型错误 ≥2 次
    → 停止逐错修复，回 §1 三层解析链找共同机制
```

## 8. 验证清单（依赖类修复的完成门）

- [ ] 提升层 `.pnpm/node_modules/<pkg>` 版本与预期一致
- [ ] 物理实例数量已知（peer hash 分裂已排查）
- [ ] 作用域扫描无残留的「未声明 + 裸导入」组合
- [ ] dev 多页面 200 且 `<title>`/内容断言通过（防 catch-all 200 假象）
- [ ] optimizeDeps 警告归零（`Failed to resolve dependency` 计数 = 0）
- [ ] 生产构建 EXIT=0（依赖重算 / patch 后必做构建回归）
- [ ] 非 win32 部署链路的 traceInclude / manifest 已按 §6.2 处理
