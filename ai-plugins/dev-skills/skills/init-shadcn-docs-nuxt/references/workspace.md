# Workspace / Monorepo 完整参考

## 模板文件

| 模板                                                                  | 说明                                         |
| --------------------------------------------------------------------- | -------------------------------------------- |
| [`templates/package.json`](../templates/package.json)                 | 依赖与脚本基线，含三处 `nuxt prepare` 保险   |
| [`templates/workspace-aliases.ts`](../templates/workspace-aliases.ts) | workspace 组件库别名函数，含前缀匹配注意事项 |
| [`templates/plugins/ui-lib.ts`](../templates/plugins/ui-lib.ts)       | Nuxt Plugin 注册模式，含样式导入顺序说明     |
| [`templates/app.config.ts`](../templates/app.config.ts)               | 站点元信息与 UI 配置骨架                     |

> **使用时请直接阅读模板文件中的注释**，注释包含了关键的顺序和路径规则。

---

## 适用场景

当文档站位于 pnpm workspace 的 `packages/` 子目录中，且需要在本地开发时联调同 workspace 内的组件库源码时，本文件提供完整的配置模式。

## production package boundary

生产构建先看真正部署的文档包 `package.json`、锁文件和最终 artifact。运行时直接消费的组件库必须由该文档包 manifest 显式声明，并通过其正常包入口解析；根目录提升、其他 workspace 包的传递依赖和开发期 source alias 都不是 production 闭包证据。

`templates/workspace-aliases.ts` 仅用于 development 的显式 opt-in。`templates/nuxt.config.full.ts` 在 `NODE_ENV === "development"` 且 `SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1"` 时才启用它；production 返回空 alias。确认 runtime closure 时，使用 fresh install 构建、启动 `.output` 并执行 HTTP smoke，而不是扩大 alias 或 externalization 清单。

---

## package.json 说明

详见 [`templates/package.json`](../templates/package.json)，模板注释解释了每个脚本的作用。

### 脚本说明

| 脚本                           | 作用                               | 为什么必须                                            |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| `predev` → `nuxt prepare`      | 在 `dev` 前自动生成 `.nuxt` 目录   | 没有 `.nuxt` 目录时 `nuxt dev` 会报类型错误或启动失败 |
| `prebuild` → `nuxt prepare`    | 在 `build` 前自动生成 `.nuxt` 目录 | CI 环境可能没有预先运行 dev                           |
| `postinstall` → `nuxt prepare` | `pnpm install` 后自动准备          | 克隆仓库后直接 `pnpm install` 即可开发                |

### 部署文档包直接消费 workspace 组件库时追加

```json
{
	"dependencies": {
		"@your-scope/ui-lib": "workspace:*",
		"element-plus": "^2.13.5"
	}
}
```

### 常见遗漏

> **不要预设"依赖包一定先构建完"或".nuxt 一定已存在"。** 三处 `nuxt prepare` 是保险措施，确保在任何起点都能启动。

---

## development-only workspace 组件库别名

详见 [`templates/workspace-aliases.ts`](../templates/workspace-aliases.ts)，模板注释解释了前缀匹配陷阱。

### 关键注意点

1. **只在 development 显式 opt-in** — 必须同时满足 `NODE_ENV === "development"` 与 `SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1"`；production 不使用 source alias
2. **styles 别名必须在主入口别名之前声明** — Nuxt/Vite alias 匹配是前缀匹配，`@scope/lib/styles` 必须先于 `@scope/lib`
3. **使用 `resolve(__dirname, ...)` 而非相对字符串** — 确保在任何 cwd 下都能正确解析
4. **指向源码入口（`.ts` / `.scss`）仅供联调** — production 使用 manifest 声明的包入口与构建产物

---

## Nuxt Plugin 注册

详见 [`templates/plugins/ui-lib.ts`](../templates/plugins/ui-lib.ts)。

关键规则：

- Nuxt 会自动扫描 `plugins/` 目录，不需要在 `nuxt.config.ts` 中手动注册
- 样式导入顺序：先导入底层库样式（如 Element Plus CSS），再导入上层库样式
- 如果组件库依赖 Element Plus，两者都需要在 plugin 中注册

---

## i18n 单语最小配置

`shadcn-docs-nuxt` 继承层的 i18n 策略要求 `defaultLocale`。不配置会产生 warning。

详见 [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) 中 i18n 段的注释。

注意：

- **不要做多语言改造** — 单语文档站先保持最小配置，i18n 多语言路线复杂度很高
- **不要删除 i18n 配置** — 删除后会产生 warning，因为继承层期望有该配置
- i18n 与 SSR 的交互可能导致 `registerMessageResolver` 报错（intlify 多版本冲突），此时应检查 pnpm 是否 hoist 了多份 `@intlify/*`

---

## Nuxt Icon 配置

必须安装本地集合：

```bash
pnpm add -D @iconify-json/lucide
```

配置详见 [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) 中 icon 段的注释。

核心规则：限制 `serverBundle.collections` 只打包 `lucide`，不限制会扫描全部已安装集合导致 Nitro OOM。

---

## OG Image 模块处理与 Nuxt 世代边界

`nuxt-og-image` 是 `shadcn-docs-nuxt@1.1.9` 的传递依赖，不能只审查四个核心包。Nuxt 3 保守基线固定为 `nuxt-og-image@5.1.9`；`5.1.10+` 的 `@nuxt/kit` 依赖线面向 Nuxt 4，可能把 H3 v2 裸 import 带入 Nuxt 3/Nitro 2.13 构建。

在根 `package.json` 增加以下覆盖，避免主题的宽 semver 范围重新解析到 Nuxt 4 世代：

```json
{
	"pnpm": {
		"overrides": {
			"nuxt-og-image": "5.1.9"
		}
	}
}
```

规则：先固定并验证版本，再决定是否启用；不能用关闭模块或清空 prerender 代替依赖修复。详见 [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) 中 ogImage 段的注释。

如果页面层有 `defineOgImageComponent()` 调用，通过创建 `pages/[...slug].vue` 覆盖默认页面来移除该调用。

---

## Sass 迁移注意

如果 workspace 组件库使用 Sass，且样式文件中有全局 `mix()` 函数调用，需要迁移到模块化 API：

```scss
// ❌ 旧写法 - 会产生 Sass API deprecation warning
$color: mix($primary, white, 20%);

// ✅ 新写法 - 使用模块化 API
@use "sass:color";
$color: color.mix($primary, white, 20%);
```

---

## 目录结构总览

一个完整的 workspace 内文档站目录结构：

```plain
monorepo/
├─ packages/
│  ├─ ui-lib/                    ← workspace 组件库
│  │  └─ src/
│  │     ├─ index.ts
│  │     └─ styles/
│  │        └─ index.scss
│  └─ ui-lib-docs/               ← 文档站
│     ├─ package.json            ← templates/package.json
│     ├─ nuxt.config.ts          ← templates/nuxt.config.full.ts
│     ├─ app.config.ts           ← templates/app.config.ts
│     ├─ tailwind.config.js      ← templates/tailwind.config.js
│     ├─ workspace-aliases.ts    ← templates/workspace-aliases.ts
│     ├─ assets/
│     │  └─ css/
│     │     ├─ tailwind.css      ← templates/assets/css/tailwind.css
│     │     └─ main.css          ← templates/assets/css/main.css
│     ├─ content/
│     │  ├─ index.md
│     │  └─ 2.components/
│     │     └─ 1.xxx/
│     │        └─ 1.yyy.md
│     ├─ components/
│     │  └─ content/             ← 自定义 MDC 组件
│     ├─ plugins/
│     │  └─ ui-lib.ts            ← templates/plugins/ui-lib.ts
│     ├─ shims/
│     │  └─ debug.ts             ← templates/shims/debug.ts
│     ├─ pages/                  ← 可选：覆盖默认页面
│     │  └─ [...slug].vue
│     └─ public/
│        ├─ logo.svg
│        └─ logo-dark.svg
├─ node_modules/
│  └─ shadcn-docs-nuxt/
├─ pnpm-workspace.yaml
└─ package.json
```

### Nuxt Content 目录编号约定

`content/` 下的文件和目录使用数字前缀控制排序，数字前缀只影响排序，不出现在 URL 路径中。

---

## Nuxt Content 兼容矩阵门禁

`shadcn-docs-nuxt` 的主题传递依赖不能单独决定 Content 版本。Nuxt 3 文档站至少要同时检查：

```json
{
	"shadcn-docs-nuxt": "1.1.9",
	"@ztl-uwu/nuxt-content": "2.13.9",
	"nuxt": "3.21.2",
	"h3": "1.15.11",
	"nuxt-og-image": "5.1.9"
}
```

这是一条已验证的保守基线，不是生态中唯一正确的组合。fresh install 后必须运行：

```powershell
pnpm --filter <docs-package> list nuxt shadcn-docs-nuxt @ztl-uwu/nuxt-content h3 nitropack --depth 4
pnpm --filter <docs-package> why h3
pnpm --filter <docs-package> why nuxt-og-image @nuxt/kit h3
```

Content 运行时可能直接 import `h3` 却没有在上游 manifest 中声明，因此文档包必须显式声明 H3，不能依赖 hoist 或根 workspace 间接安装。

### SSR 与 prerender 的边界

- `vite.ssr.noExternal` 处理 Vite SSR 阶段的 workspace 包外部化。
- `nitro.externals.inline` 处理 Nitro Rollup 阶段，不能替代 `vite.ssr.noExternal`。
- `nitro.externals.trace` 是 NFT 依赖追踪；Windows workaround 必须条件化，不能无条件泄漏到 Vercel。
- document-driven Content 依赖 prerender 生成结构化内容；不要把 `prerender:routes` 的 `routes.clear()` 当成默认优化。
