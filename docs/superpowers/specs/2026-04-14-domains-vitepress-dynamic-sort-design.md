# 2026-04-14 domains vitepress 动态页面排序设计

## 目标

为 `packages/domains` 的 VitePress 文档站补齐基于 `packages/domains/src/types.ts` 中 `projects[].order` 的统一排序能力，使以下两处行为保持一致：

- 域名页侧边栏项目列表
- `domain/[project].md` 的动态路由参数生成顺序

同时满足兜底规则：

- `order` 有值的项目按升序排序
- 未配置 `order` 的项目整体排在后面
- 未配置 `order` 的项目保持在原数组中的相对顺序

## 现状

当前实现中，`projects` 在两个位置被直接遍历：

- `packages/domains/docs/.vitepress/config.mts`
- `packages/domains/docs/domain/[project].paths.ts`

这会带来两个问题：

1. `order` 字段虽然已经写入数据模型，但尚未真正参与排序。
2. 排序逻辑分散在两个消费点，后续一旦只改其中一处，动态路由与侧边栏就会继续漂移。

根据 VitePress 官方动态路由说明，`[param].paths.ts` 只需要在 `paths()` 中返回形如 `{ params: { ... } }` 的数组，适合直接复用一份预排序后的数据源，而不需要各自重新组织数据。

## 方案选择

### 方案 A：在文档站内抽共享导航模块

在 `packages/domains/docs/.vitepress/` 下新增一个仅服务于文档站的共享模块，集中处理：

- 项目排序
- 侧边栏项目项生成
- 动态路由路径参数生成

优点：

- 排序规则只有一份实现
- `config.mts` 和 `[project].paths.ts` 都变薄
- 逻辑边界清楚，不污染发布包的公开 API

缺点：

- 需要新增一个小文件

### 方案 B：把排序工具做进 `packages/domains/src`

把排序逻辑做成公开工具函数，由文档侧直接复用。

优点：

- 理论上复用范围更大

缺点：

- 这是文档站导航需求，不适合推入包的公开源码边界
- 容易把展示层语义带进运行时包导出

### 方案 C：两处分别排序

在 `config.mts` 和 `[project].paths.ts` 各自补排序。

优点：

- 就地修改，改动直观

缺点：

- 逻辑仍然重复
- 后续很容易再次失配

### 结论

采用方案 A。

## 设计

### 新增共享模块

新增文件：

- `packages/domains/docs/.vitepress/project-navigation.ts`

该模块只承担文档站导航数据整理职责，不处理 VitePress 配置装配。

### 模块职责

该模块提供三个导出：

1. `getSortedProjects()`
   - 返回排好序的项目列表
   - 是唯一的排序数据源
2. `getProjectSidebarItems()`
   - 基于排序结果生成 `[{ text, link }]`
   - 供 `config.mts` 使用
3. `getProjectRoutePaths()`
   - 基于排序结果生成 `[{ params: { project } }]`
   - 供 `[project].paths.ts` 使用

### 排序规则

`getSortedProjects()` 使用“显式原始索引 + 排序值”的方式构造稳定排序：

1. 遍历 `projects`，记录每项原始索引
2. 若两项都存在 `order`，按 `order` 升序
3. 若仅一项存在 `order`，有 `order` 的排前面
4. 若两项都没有 `order`，按原始索引升序

这样可以避免依赖隐含排序稳定性，并把兜底规则写成显式行为。

### 调用点改造

#### `packages/domains/docs/.vitepress/config.mts`

现状：

- 直接 `projects.map(...)` 生成 `sidebarDomain`

改造后：

- 引入 `getProjectSidebarItems()`
- `sidebarDomain` 只负责结构装配，不再了解排序细节

#### `packages/domains/docs/domain/[project].paths.ts`

现状：

- 在 `paths()` 内直接 `projects.map(...)`

改造后：

- 引入 `getProjectRoutePaths()`
- `paths()` 直接返回共享模块生成的结果

## 数据流

数据流将统一为：

`src/types.ts` 中的 `projects`
→ `project-navigation.ts` 做稳定排序
→ 侧边栏和动态路由分别从同一排序结果派生

这样所有展示顺序都由 `projects[].order` 驱动，不再由多个调用点各自决定。

## 错误处理与约束

本次设计不增加新的运行时异常处理，原因如下：

- 数据源为本地静态常量
- `order` 为可选字段，缺省值已有明确兜底规则
- 动态路由格式固定，`paths()` 只需要返回参数数组

约束：

- 不修改 `projects` 原始数据结构以外的语义
- 不把文档排序逻辑迁移到包的公开导出层
- 不在两个消费点保留重复排序逻辑

## 验证方案

### 静态验证

检查共享模块输出是否满足：

- 已配置 `order` 的项目按升序
- 未配置 `order` 的项目在尾部
- 未配置 `order` 的项目保持原始相对顺序

### 运行验证

运行：

```bash
pnpm --dir packages/domains docs:dev
```

并在浏览器中验证：

- 侧边栏项目顺序符合预期
- 点击项目链接后动态页面正常打开
- 动态页面没有因排序改造而失效

### 回归验证

确认自动生成侧边栏的其他非 `domain/**` 内容不受影响。

## 风险

1. 若排序逻辑继续散落在多个文件中，后续维护仍会再次漂移。
2. 若未显式保留原始索引，未配置 `order` 的项目顺序可能不够直观。
3. 若在文档配置文件内混入过多数据处理细节，可读性会继续下降。

本设计通过共享模块、单一数据源和显式索引兜底来收敛上述风险。

## 完成标准

- `config.mts` 和 `[project].paths.ts` 都不再直接遍历原始 `projects`
- 排序规则只存在于一处共享实现
- 侧边栏顺序按 `order` 生效，未配置项稳定排后
- `docs:dev` 启动成功，浏览器内验证通过
