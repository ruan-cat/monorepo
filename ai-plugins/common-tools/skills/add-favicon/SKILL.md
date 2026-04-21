---
name: add-favicon
description: 为文档站、前端站点或 monorepo 内多个站点补全或重做 favicon.svg。用户提到 favicon、浏览器标签页图标、Iconify、Lucide 风格、VitePress/VuePress 文档站、public/favicon.svg、head link icon、图标太丑/一团浆糊/不要背景块时必须使用；尤其适合批量为多个 VitePress 站点设计本地 SVG favicon，并显式配置 head。
user-invocable: true
metadata:
  version: "1.0.0"
---

# Add Favicon

## 目标

为站点补全清晰、可读、可维护的本地 `favicon.svg`，并把浏览器真正会读取的 `<link rel="icon">` 配好。

这个技能优先服务文档站和 monorepo 批量站点。它把 Iconify 作为设计灵感来源，但最终资产应落成仓库内的独立 SVG 文件，避免运行时依赖、外链失效和浏览器标签页里出现模糊杂乱的图标。

## 默认设计方向

除非用户明确要求相反，按以下方向设计：

- **Iconify-first**：先从 Iconify 图标库寻找语义和构图灵感，优先参考 `lucide:*` 这类简洁线性图标。
- **Lucide 风格**：透明背景、线性描边、圆角端点、圆角连接、少量路径、足够留白。
- **不加背景块**：默认不要黑色圆底、深色方块、渐变底、阴影底、装饰圆盘。用户已经表达过“直接展示 icon 更好看”。
- **最多 2 色**：通常 1 个主色足够；第二色只用于强调，不要做彩虹、渐变或多色插画。
- **小尺寸可读**：以浏览器 16 px favicon 为标准倒推复杂度。看不清的细节应删掉或合并。
- **无文字优先**：避免字母、缩写和长文本。favicon 里文字通常会糊成一团。

## 工作流程

### 1. 发现站点与配置

先确认用户要处理的是单个站点还是批量站点。对 monorepo，优先用仓库结构发现：

```bash
rg --files | rg '(^|/)\.vitepress/config\.(ts|mts|js|mjs)$'
rg --files | rg '(^|/)package\.json$'
```

读取每个站点的：

- VitePress/VuePress 配置文件
- 站点标题、包名、README 或首页
- 现有 `public/favicon.svg`
- 现有 `head` 配置
- 用户指定的站点清单和排除项

如果用户明确给了站点清单，以用户清单为准；如果发现额外站点，先列入候选，不要擅自扩大范围。

### 2. 确认 favicon 放置路径

不要凭经验把文件放到 `.vitepress/public/favicon.svg`。VitePress 默认公共资源目录通常是站点源目录下的 `public`：

```plain
<vitepress-source-root>/public/favicon.svg
```

例如：

```plain
packages/utils/src/public/favicon.svg
packages/claude-notifier/src/docs/public/favicon.svg
packages/vitepress-preset-config/src/docs/public/favicon.svg
```

只有当项目已有配置或文档明确把 public 目录改到 `.vitepress/public` 时，才使用 `.vitepress/public/favicon.svg`。

判断方法：

- 看 VitePress 命令里的 root，例如 `vitepress build src` 表示源目录是 `src`，公共目录通常是 `src/public`。
- 看现有构建产物是否会把 `public/favicon.svg` 复制到 `.vitepress/dist/favicon.svg`。
- 看 config 中是否有自定义 `srcDir`、`outDir` 或 public 相关配置。

### 3. 配置 head

在站点配置里显式加入 favicon：

```ts
head: [["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }]],
```

遵循项目现有 config 写法：

- 如果已有 `head`，只追加缺失的 favicon 条目，避免重复。
- 如果配置通过 `setUserConfig()`、`defineConfig()` 或自定义 wrapper 生成，沿用现有 wrapper，不改架构。
- 如果已有 png/ico favicon，除非用户要求迁移，优先保留并补充 SVG；不要无故删除旧资产。

### 4. 选择图标语义

为每个站点选择不同图标，但保持统一风格。选择逻辑：

| 站点语义           | Iconify/Lucide 灵感                                                  |
| ------------------ | -------------------------------------------------------------------- |
| 工具包、通用工具   | `lucide:wrench`, `lucide:settings`, `lucide:blocks`                  |
| 部署、Vercel、发布 | `lucide:cloud-upload`, `lucide:rocket`, `lucide:upload-cloud`        |
| 通知、提醒         | `lucide:bell`, `lucide:message-circle`                               |
| 域名、网络、站点   | `lucide:globe`, `lucide:network`                                     |
| 配置、预设、模板   | `lucide:sliders-horizontal`, `lucide:badge-check`, `lucide:settings` |
| 测试、实验、样例   | `lucide:flask-conical`, `lucide:test-tube`                           |
| 文档、知识库       | `lucide:book-open`, `lucide:file-text`                               |

同一批站点内避免重复图标，除非两个站点确实语义相同。

### 5. 写 SVG

最终 SVG 应是本地文件，建议结构：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <path
    d="..."
    stroke="#2563eb"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2.6"
  />
</svg>
```

设计约束：

- `viewBox` 用 `0 0 32 32`，便于为 favicon 加粗和留白。
- `stroke-width` 通常在 `2.4` 到 `3` 之间；16 px 下仍要清楚。
- 删除太细、太密、太多交叉的小细节。
- 不使用 `filter`、复杂 mask、渐变、大面积背景、嵌入图片。
- 不使用外链、`<script>`、事件属性或不必要的 metadata。
- 如果从 Iconify/Lucide 借鉴路径，必须按 favicon 尺寸重新简化、加粗、调整留白，而不是原样复制复杂图标。

### 6. 批量实施策略

批量处理时先产出一张映射表，再改文件：

```plain
站点 | public 路径 | config 路径 | 图标语义 | 主色
```

实施顺序：

1. 找全目标站点。
2. 为每个站点定语义图标和颜色。
3. 写入本地 `public/favicon.svg`。
4. 在对应 config 里添加 `head`。
5. 构建或做最小校验。
6. 抽查构建产物和线上路径。

### 7. 验证

至少做这些检查：

```bash
rg -n "favicon.svg|rel: \"icon\"|rel=\"icon\"" <目标配置和构建产物>
```

对 VitePress，优先验证：

- `public/favicon.svg` 存在。
- 构建后 `.vitepress/dist/favicon.svg` 存在。
- 构建后 `index.html` 内包含 `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`。

如果站点已经部署，额外验证：

```bash
curl -I https://example.com/favicon.svg
curl -s https://example.com/ | rg 'favicon|rel="icon"|image/svg\+xml'
```

如果用户要求视觉展示，使用可用的浏览器 MCP 或生成本地预览页展示候选。展示时重点看 16 px、24 px、32 px 三种尺寸，不只看放大图。

## 输出给用户的内容

完成后用简短清单说明：

- 处理了哪些站点。
- 每个站点使用的图标语义。
- favicon 文件路径和 config 路径。
- 跑了哪些验证。
- 如果线上未生效，说明是部署未更新、缓存或域名 alias 问题，不要把“本地已配置”和“线上已生效”混为一谈。

## 常见错误

- 把 `favicon.svg` 放进 `.vitepress/public`，但项目实际源目录是 `src` 或 `docs`，导致构建产物没有 favicon。
- 给每个图标都套黑色圆底或深色方块，浏览器标签页里显得沉重。
- 直接复制复杂 Iconify SVG，16 px 下看起来像一团线。
- 只写 SVG 文件，不配置 `head`，依赖浏览器猜测路径。
- 批量站点使用同一个图标，失去项目语义。
- 部署后不验证 `/favicon.svg`，导致本地正确但线上仍是 404。
