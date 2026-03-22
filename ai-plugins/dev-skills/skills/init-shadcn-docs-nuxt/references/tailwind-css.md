# Tailwind CSS 完整参考

## 模板文件

| 模板                                                                        | 说明                                                             |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`templates/tailwind.config.js`](../templates/tailwind.config.js)           | 完整 Tailwind 配置，含 content 扫描路径、shadcn-vue 主题色、动画 |
| [`templates/assets/css/tailwind.css`](../templates/assets/css/tailwind.css) | CSS 入口 + CSS 变量（亮色/暗色）+ `@source` 扫描声明             |
| [`templates/assets/css/main.css`](../templates/assets/css/main.css)         | 自定义样式示例（组件演示容器、API 表格）                         |

> **使用时请直接阅读模板文件中的注释**，注释包含了路径计算规则和常见错误说明。

---

## 核心要求

Tailwind 配置在 `shadcn-docs-nuxt` 文档站中有一个**硬性要求**：

> **`content` 扫描必须覆盖 `node_modules/shadcn-docs-nuxt`**，否则模板内部使用的 Tailwind 类会被 tree-shake 掉，导致主题类缺失、暗黑样式异常、布局细节错乱。

---

## content 路径说明

| 路径                                                       | 作用                                         |
| ---------------------------------------------------------- | -------------------------------------------- |
| `./content/**/*`                                           | 扫描 MDC markdown 中的 Tailwind 类           |
| `./app/**/*.vue`                                           | 扫描 app 目录下的 Vue 组件                   |
| `./components/**/*.vue`                                    | 扫描自定义内容组件                           |
| `../../node_modules/shadcn-docs-nuxt/**/*.{vue,js,ts,mjs}` | **关键**：扫描模板内部组件使用的 Tailwind 类 |

**路径前缀 `../../` 的说明**：

- 在 pnpm workspace 中，文档站包通常位于 `packages/xxx/`，而 `node_modules` 在 monorepo 根目录
- 因此相对路径是 `../../node_modules/...`
- 如果你的文档站在根目录，应改为 `./node_modules/...`
- **检查方法**：从文档站 `tailwind.config.js` 所在目录，手动 `ls` 看能否找到 `shadcn-docs-nuxt`

---

## Tailwind v4 `@source` 指令

在 Tailwind v4 中（`@import "tailwindcss"` 语法），CSS 入口文件使用 `@source` 声明额外扫描目录。详见 [`templates/assets/css/tailwind.css`](../templates/assets/css/tailwind.css)。

关键行：

```css
@source "../../node_modules/shadcn-docs-nuxt";
```

这与 `tailwind.config.js` 中的 `content` 配置互补，确保 Tailwind v4 也能扫描到模板内部的类。

---

## CSS 变量格式

所有 CSS 变量使用 HSL 纯数值格式。完整变量定义见 [`templates/assets/css/tailwind.css`](../templates/assets/css/tailwind.css)。

- **正确格式**：`--primary: 221.2 83.2% 53.3%;`
- **错误格式**：`--primary: hsl(221.2, 83.2%, 53.3%);`

在 Tailwind 中通过 `hsl(var(--primary))` 组合使用。如果变量值本身包含 `hsl()` 函数，颜色会失效。

---

## 常见样式问题排查

### "布局变窄"问题

**现象**：宽屏下文档内容区域异常窄，不像参考站点那样展开。

**排查顺序**：

1. 检查 `tailwind content` 是否覆盖了 `shadcn-docs-nuxt`（最常见原因）
2. 检查是否有自定义 `container` 规则覆盖了模板默认宽度
3. 检查是否在 `main.css` 中添加了限制宽度的全局规则
4. 检查 `app.config.ts` 中的 `aside` / `toc` 配置是否挤压了内容区域

### 暗黑模式不切换

**排查顺序**：

1. 先查 console 是否有模块导入错误（见 [`compat.md`](compat.md)）
2. 检查 `tailwind.config.js` 中 `darkMode: "class"` 是否存在
3. 检查 CSS 变量中 `.dark` 选择器是否完整
4. 检查 `shadcn-docs-nuxt` 是否被 content 扫描覆盖

### 主题色不生效

**原因**：CSS 变量值格式错误（见上方"CSS 变量格式"）。
