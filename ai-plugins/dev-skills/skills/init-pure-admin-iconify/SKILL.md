---
name: init-pure-admin-iconify
description: 初始化 vite+vue3 项目的 pure-admin 风格 iconify 图标渲染体系（离线 + 在线 + useRenderIcon 统一渲染）。当用户提及“初始化 iconify”“pure-admin 图标方案”“ReIcon/useRenderIcon”“离线图标接入”“后台项目图标基础设施”时使用此技能。
user-invocable: true
metadata:
  version: "0.2.0"
---

# 初始化 Pure-Admin Iconify 方案（Vite + Vue3）

本技能用于在任意 `vite + vue3` 项目中，快速初始化一套与 pure-admin 思路一致的 iconify 图标体系，提供：

- `IconifyIconOffline`（离线图标）
- `IconifyIconOnline`（在线图标）
- `useRenderIcon`（统一分流渲染）
- `offlineIcon`（本地离线图标映射与兼容别名）

目标是让业务层只关心“传什么图标”，不关心底层是离线、在线还是组件对象。

## 适用场景

- 新项目首次接入 iconify 图标体系
- 老项目希望统一图标渲染入口，减少各处重复封装
- 需要兼容旧 `IconXxx` 命名，同时支持新式 `collection/name`、`collection:name`
- 菜单、路由、配置驱动场景需要返回 `Component` 类型图标

## 核心原则 [CRITICAL]

1. 统一出口：业务代码优先通过 `ReIcon` 导出使用，不要各处二次封装 `@iconify/vue`
2. 离线优先：高频图标优先离线映射，长尾图标再走在线
3. 配置驱动优先用 `useRenderIcon`：菜单、路由、表格配置统一返回组件
4. 保留兼容层：旧 `IconXxx` 仅做兼容，不作为新代码首选

## 1. 照抄策略（先定模式） [CRITICAL]

优先使用“照抄 + 最小改造”策略，不要凭记忆重写。

### 1.1 首选来源

1. pure-admin 原方案（架构参考）
2. 你项目里已经落地过的 ReIcon 实码（实施参考）

如果已有可运行的 `src/components/ReIcon`，优先完整复制后做最小改动。

### 1.2 文件映射（必须按表执行）

将来源项目 `src/components/ReIcon` 映射到目标项目同路径：

```plain
来源文件                                  -> 目标文件
src/components/ReIcon/index.ts            -> src/components/ReIcon/index.ts
src/components/ReIcon/type.ts             -> src/components/ReIcon/type.ts
src/components/ReIcon/src/hooks.ts        -> src/components/ReIcon/src/hooks.ts
src/components/ReIcon/src/iconifyIconOffline.ts -> src/components/ReIcon/src/iconifyIconOffline.ts
src/components/ReIcon/src/iconifyIconOnline.ts  -> src/components/ReIcon/src/iconifyIconOnline.ts
src/components/ReIcon/src/offlineIcon.ts  -> src/components/ReIcon/src/offlineIcon.ts
```

只复制这 6 个文件即可完成核心能力。

### 1.3 只允许改这 4 类内容

1. 路径别名：`@/` 是否存在
2. 入口注册位置：`main.ts` 或 `src/plugins/icon.ts`
3. 离线图标清单：`offlineIcon.ts` 里导入和映射项
4. 历史兼容别名：`IconXxx` 是否需要保留

除上述改动外，不要主动改 API、类型和导出结构。

## 2. 安装依赖

在目标项目安装：

```bash
pnpm add -D @iconify/json @iconify/vue unplugin-icons vite-svg-loader
```

可选工具：

```bash
pnpm add @pureadmin/utils
```

> 如果你采用 `~icons/...` 组件导入方式，`unplugin-icons` 是必需项。

## 3. 配置 Vite 插件

在 `vite.config.ts`（或插件聚合文件）添加 `unplugin-icons`：

```ts
import Icons from "unplugin-icons/vite";

export default defineConfig({
	plugins: [
		vue(),
		Icons({
			compiler: "vue3",
			scale: 1,
		}),
	],
});
```

## 4. 创建 ReIcon 目录结构

建议结构：

```plain
src/components/ReIcon/
├── index.ts
├── type.ts
└── src/
    ├── iconifyIconOffline.ts
    ├── iconifyIconOnline.ts
    ├── hooks.ts
    └── offlineIcon.ts
```

## 5. 一揽子现成代码（可直接照抄）

模板代码已拆分到 `templates/` 目录，直接按路径复制，不需要手动从文档里摘代码。

```plain
templates/ReIcon/index.ts
templates/ReIcon/type.ts
templates/ReIcon/src/iconifyIconOffline.ts
templates/ReIcon/src/iconifyIconOnline.ts
templates/ReIcon/src/hooks.ts
templates/ReIcon/src/offlineIcon.ts
templates/setup-icon.ts
```

复制规则：

1. `templates/ReIcon/**` -> `src/components/ReIcon/**`
2. `templates/setup-icon.ts` -> `src/plugins/icon.ts`（或合并到你的入口注册文件）
3. 复制后只改“必改项检查”列出的内容

> 如果你希望“一字不动照抄”旧项目，请把旧项目 `offlineIcon.ts` 全量复制过来，再对照模板补齐缺失导出。

## 6. 入口注册（可选但推荐）

在 `src/plugins/icon.ts`（或等价入口）注册：

```ts
import type { App } from "vue";
import { IconifyIconOffline, IconifyIconOnline, registerOfflineIcons } from "@/components/ReIcon";

export function setupIcon(app: App) {
	registerOfflineIcons(app);
	app.component("IconifyIconOffline", IconifyIconOffline);
	app.component("IconifyIconOnline", IconifyIconOnline);
}
```

如果旧项目已大量使用 Element Plus 全局图标别名，不要删除原注册，只新增 iconify 能力。

## 7. 业务使用规范

### 7.1 模板直出（离线）

```vue
<IconifyIconOffline icon="ep/menu" width="18" height="18" />
```

### 7.2 模板直出（在线）

```vue
<IconifyIconOnline icon="ri:home-4-line" width="18" height="18" />
```

### 7.3 配置驱动（菜单/路由/表格）

```ts
import { useRenderIcon } from "@/components/ReIcon";

const iconComp = useRenderIcon("ep/setting", { width: "18px", height: "18px" });
```

### 7.4 菜单配置约定

菜单项 `icon` 可直接写：

- 旧别名：`IconUser`
- 离线字符串：`ep/setting`
- 在线字符串：`ri:shield-user-line`

渲染层统一走 `useRenderIcon`，不要在菜单组件内部再写一套 icon 分流逻辑。

## 8. 必改项检查（照抄后立刻检查） [CRITICAL]

1. `~icons/...` 导入是否生效（未生效通常是漏配 `unplugin-icons`）
2. 路径别名 `@/components/ReIcon` 是否可解析
3. `registerOfflineIcons(app)` 是否在应用启动阶段执行
4. 旧页面如果用 `IconXxx`，对应 alias 是否存在

## 9. 离线图标扩充策略

仅在以下情况扩充 `offlineIcon.ts`：

- 同一在线图标在后台高频复用
- 对网络依赖敏感（内网或弱网）
- 希望字符串在 `useRenderIcon` 中稳定命中离线路径

扩充步骤：

1. 导入图标：`import EpXxx from "~icons/ep/xxx"`
2. 新增映射：`offlineIcons["ep/xxx"] = markRaw(EpXxx)`
3. 必要时补兼容别名：`aliasIcons.IconXxx = offlineIcons["ep/xxx"]`

## 10. 验证清单

- [ ] `vite.config.ts` 已启用 `unplugin-icons`
- [ ] `ReIcon` 目录和导出结构完整
- [ ] `useRenderIcon` 可同时处理组件、离线字符串、在线字符串
- [ ] 旧 `IconXxx` 页面未被破坏
- [ ] 菜单/路由等配置驱动场景可正常渲染图标
- [ ] 至少有一个示例页覆盖四种用法（旧别名、离线、在线、hook）

## 11. 常见坑位 [CRITICAL]

1. 误删原有注释和说明：集成改造要用最小补丁，不要整文件覆盖导致信息丢失
2. 样式类名过宽：示例页避免 `.icon-title` 这类容易冲突的命名，使用更局部语义类名
3. 误把兼容层当规范：`IconXxx` 只保兼容，新代码优先 `ep/menu`、`ri:...`、`useRenderIcon`
4. 在业务层重复封装：不要绕开 `ReIcon` 再造一套 `renderIcon`

## 12. 推荐落地顺序（10 分钟）

1. 依赖安装 + Vite 插件
2. 按映射表复制 6 个 `ReIcon` 文件
3. 入口注册（保留旧别名）
4. 选一个菜单或示例页接入 `useRenderIcon`
5. 完成验证清单后，再批量迁移业务页面

## 13. 参考来源

- Pure-Admin Icon 方案调研报告： https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-11-14-pure-admin-icon-solution-research.md
- Iconify 图标检索： https://icon-sets.iconify.design/
- Iconify 官方文档： https://iconify.design/
