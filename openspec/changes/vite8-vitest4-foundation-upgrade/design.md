# 设计：Vite 8 与 Vitest 4 基础设施升级

## 设计目标

1. 把“升级工具版本”和“修复原有测试契约”分成可观察、可回滚的阶段。
2. 让每一个测试项目都有明确的配置、环境、入口和构建前置条件。
3. 在文档框架尚未支持 Vite 8 时允许双轨运行，不用强制 peer override 制造假统一。
4. 每个阶段都必须留下可复现命令和输出，未验证的推断不能写成通过。

## 版本与兼容性策略

- 核心开发链先保持 Node 22/CI Node 24 的约束矩阵，并固定 pnpm 版本；不把 Node 漂移混入 Vite/Vitest 迁移。
- Vitest 4 先在 Vite 6 上完成 projects 迁移和测试边界收敛，再评估 Vite 8。
- Vite 8 先作用于根和明确支持的非文档包；VitePress 1、VuePress bundler rc20 继续保留它们所需的 Vite 5/6，直到对应上游版本有可验证的 Vite 8 兼容证据。
- `@vitejs/plugin-vue`、`vite-plugin-dts`、Rollup/Vite 插件和仓库自有插件必须以实际 peer 范围和构建结果双重判定，不能只看 npm latest。

## 升级覆盖范围

首轮清单至少覆盖以下根、包和示例入口：根 `package.json`、Vite/Vitest 配置；`packages/vuepress-preset-config`、`packages/vitepress-preset-config`；`vite-plugins/vite-plugin-ts-alias`；`learn-create-compoents-lib/components` 与 `test-app`；`demos/gh.zou-hong-run.dobang`；`fork/vitepress-demo-plugin`；以及使用 `vite-plugin-dts`、`unplugin-vue-components` 或仓库自有 Vite 插件的模板和包。清单只用于确认依赖与构建边界，不代表所有入口必须同时切换到 Vite 8。

## Vitest projects 模型

- 删除最终运行路径对 `vitest.workspace.ts` 的依赖，在根 `vitest.config.ts` 中声明显式 `test.projects`。
- 只收录具有独立 Vitest 配置的包和明确列出的根级测试目录；不再使用 `packages/*` 这种会自动纳入裸包的 glob。
- 每个 project 显式声明 `name`、`include`、`environment`、setup 文件和必要的 `extends`/配置合并方式。
- 项目级测试不得默认依赖未构建的公共 `dist`；若测试的是包入口，先声明构建前置步骤，若测试源码则直接使用包内源码入口。
- 根级 reporters、输出文件和 UI 行为与项目级环境配置分离，避免为了一个 jsdom project 改变全部项目。
- 迁移前扫描 `vitest.workspace.*`、`vitest.config.*`、`poolOptions`、`maxThreads`、`maxForks`、`coverage`、browser provider 和自定义 reporter；没有实际使用的旧选项不做推测性改写。

## 既有基线问题的处理边界

基线中的源码子路径缺失、exports 与文件不同步、`dist` 尚未构建、缺失直接依赖和陈旧测试引用，属于迁移前置门槛。它们应在对应 checkpoint 中逐类修复或明确排除；不得通过扩大 alias、自动构建所有包或把依赖提升到根目录来掩盖问题。

## 文档栈双轨

VitePress 1.x 和 VuePress bundler rc20 当前会拉入 Vite 5/6。文档构建先作为独立 project 验证，记录其实际 Vite 版本和上游 peer 范围。只有 VitePress 2 / VuePress bundler 新版本及主题、插件完成构建验证后，才允许把文档轨道收敛到 Vite 8；否则保留明确的双版本锁定和说明。

文档轨道的出口必须分别覆盖 dev、build、链接检查、主题/插件加载和部署产物；不能用核心包构建通过替代文档兼容性证据。

## Vite 8/Rolldown 兼容性检查

- 现有 `build.rollupOptions` 先在兼容层验证，再依据实际使用情况决定是否转写 `rolldownOptions`；不得为了追求新配置名而做无证据重写。
- 自有插件至少检查 `resolveId`、`load`、`transform`、`generateBundle`、`writeBundle` 的输入输出、执行顺序和产物副作用。
- 必须针对 extglob、legacy namespace、bundle 直接写入、并行 hook 顺序和旧 Rollup 输出格式做边界检查；发现仓库没有使用的风险项，只记录扫描结果，不新增兼容层。
- library build、`preserveModules`、external、类型声明输出、别名解析和 watch 模式必须分别留下构建证据。

## 回滚与停止条件

- 任一 checkpoint 出现无法区分的多类失败时，停止扩大范围，保留当前证据并回到最近一个绿色边界。
- 不使用 `pnpm.overrides`、`patch` 或 alias 强行消除 peer 冲突，除非单独记录理由、影响和撤销方式并经过审核。
- Vitest projects 迁移和 Vite 8 迁移分别可独立回退；不把两次大版本升级塞进同一个不可逆提交。

## 阶段出口与最终判定

- 基线出口：核心包测试、node/jsdom 测试、文档配置测试、包构建和文档构建均有独立命令，失败有归属。
- projects 出口：项目列表、单 project、全量运行和 HTML/UI 入口可重复执行，且没有隐式 `packages/*` 发现。
- Vitest 4 出口：所有纳入项目通过，workspace deprecated 警告和未迁移选项均已解释或清理。
- 核心 Vite 8 出口：非文档包 build、产物结构、类型声明、入口导出和插件 smoke test 通过。
- 文档出口：VitePress/VuePress 各自的 dev/build、链接、主题插件和部署产物通过，或双轨边界已获批准并有退出条件。
- 最终只有在版本与配置入口符合目标、旧版本来源有解释、核心/文档/测试/CI 都有实际证据、临时兼容层已清理或批准保留、业务导出与产物无未说明回归时，才可称为“大规模升级完成”。

## 验收证据

最终验收必须同时包含：冻结锁文件安装；`pnpm why vite`、`pnpm why vitest`、`vite --version`、`vitest --version`；配置和 deprecated 选项扫描；Node/jsdom project 测试；核心 workspace 包 build、类型声明和 entrypoints；VitePress/VuePress dev/build；`pnpm turbo build`、`pnpm turbo build:docs`；以及 CI 等价命令。缺少任一层证据，只能报告为阶段性结果。
