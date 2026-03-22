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

当文档站位于 pnpm workspace 的 `packages/` 子目录中，且需要消费同 workspace 内的组件库源码时，本文件提供完整的配置模式。

---

## package.json 说明

详见 [`templates/package.json`](../templates/package.json)，模板注释解释了每个脚本的作用。

### 脚本说明

| 脚本                           | 作用                               | 为什么必须                                            |
| ------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| `predev` → `nuxt prepare`      | 在 `dev` 前自动生成 `.nuxt` 目录   | 没有 `.nuxt` 目录时 `nuxt dev` 会报类型错误或启动失败 |
| `prebuild` → `nuxt prepare`    | 在 `build` 前自动生成 `.nuxt` 目录 | CI 环境可能没有预先运行 dev                           |
| `postinstall` → `nuxt prepare` | `pnpm install` 后自动准备          | 克隆仓库后直接 `pnpm install` 即可开发                |

### 消费 workspace 组件库时追加

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

## workspace 组件库别名

详见 [`templates/workspace-aliases.ts`](../templates/workspace-aliases.ts)，模板注释解释了前缀匹配陷阱。

### 关键注意点

1. **styles 别名必须在主入口别名之前声明** — Nuxt/Vite alias 匹配是前缀匹配，`@scope/lib/styles` 必须先于 `@scope/lib`
2. **使用 `resolve(__dirname, ...)` 而非相对字符串** — 确保在任何 cwd 下都能正确解析
3. **指向源码入口（`.ts` / `.scss`）而非构建产物** — 这样文档站不依赖组件库先构建

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

## OG Image 模块处理

规则：不要启用。详见 [`templates/nuxt.config.full.ts`](../templates/nuxt.config.full.ts) 中 ogImage 段的注释。

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
