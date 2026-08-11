# 2026-08-11 VitePress Node.js 24 pnpm 工作区入口解析故障

## 现象

GitHub Actions 在 Node.js `24.18.0` 执行 `pnpm run ci` 时，`@ruan-cat/vitepress-preset-config#build:docs` 先报：

```log
Cannot find module '.../packages/vitepress-preset-config/node_modules/vitepress/bin/vitepress.js'
```

将命令改为直接调用 VitePress 入口后，故障继续暴露为：

```log
Cannot find package '.../packages/utils/node_modules/consola/index.js'
imported from '.../packages/utils/dist/node-esm/index.js'
```

错误后偶发 `Segmentation fault`、退出码 `139`；它是前一个生命周期错误后的伴随现象，不应据此把根因归为原生崩溃。

## 根因

这不是简单的“VitePress 未安装”或“删缓存即可恢复”。其中有两个彼此独立的边界问题：

1. VitePress 的首个 `bin/vitepress.js` 找不到错误说明“包内物理路径”不是可靠入口。早期曾尝试直接调用该路径，但 [31488377756](https://github.com/ruan-cat/monorepo/actions/runs/31488377756) 与 [31505466235](https://github.com/ruan-cat/monorepo/actions/runs/31505466235) 都证明它在 CI 中不存在；最终以 `f509a791` 恢复标准 `vitepress build src/docs`。不要再把该物理路径绕过记为可保留方案，也不要无证据归因于 pnpm shim。
2. 真正的 `consola` 故障来自错误的模块边界。VitePress 仅需要 `isConditionsSome` 与 `findMonorepoRoot`，却分别经 `@ruan-cat/utils` 默认 ESM 和 `node-esm` 宽 barrel 导入；它们会 re-export `print.ts`，从而无关地静态加载 `consola`。Node.js 24 在该工作区嵌套解析路径回退到 `legacyMainResolve` 并访问不存在的 `consola/index.js`。

修复过程中还暴露了独立的构建竞态：`tsup.config.ts` 的四组并行构建都使用 `clean: true` 且共享 `dist`。某组完成后会删除另一组刚写出的 `.d.ts`。可信信号是 [run 31494445288](https://github.com/ruan-cat/monorepo/actions/runs/31494445288) 中 `@ruan-cat/commitlint-config` 无法从 `@ruan-cat/utils/node-cjs` 读取 `isConditionsEvery`；源码有该导出，但最终声明文件被并行清理掉了。

## 关键误导点

- `31490521146` 曾在同一 utils Turbo hash 下成功，而紧接着的 `31490863532` 又在外部 `consola` 路径失败；一次成功不能证明 resolver 已修复。
- 只内联 `consola` 会遗漏同样在 Node.js 24 + pnpm 工作区 ESM 解析失败的 `tinyglobby`；上一轮远端入口测试又继续暴露 `pnpm-workspace-yaml`。反过来，全量内联会把 CJS 版 `yaml` 打入 ESM 并触发不支持的动态 `require("process")`。兼容边界必须由真实入口测试约束，不能以一次绿灯或本地依赖布局提前定案。
- `consola.patch` 重写第三方 `exports`/`main` 并添加 shim，影响整个工作区且依赖特定包布局。它不是 VitePress 只需两个工具函数的正确解决层。
- 删除缓存、`pnpm i --force`、降低 Node 版本或改全局 linker 都未证明解决根因，且扩大了影响范围。

## 最终修复

1. 恢复标准 `vitepress build src/docs`，并为 `@ruan-cat/utils/conditions` 和 `@ruan-cat/utils/monorepo` 提供真实的 `dist` ESM 与声明产物；VitePress 两个消费者改用这两个窄子路径，不再穿过会加载日志模块的 barrel。
2. 删除全局 `patchedDependencies.consola`、`patches/consola.patch` 和孤儿的 `ensure-consola-patch.ts`。默认 ESM 与 `node-esm` 仅内联 Node.js 24 + pnpm 工作区中已证实不兼容的 `consola`、`tinyglobby` 与 `pnpm-workspace-yaml`；`yaml` 保持 ESM 外部依赖，避免将其 CJS 动态 `require` 打入 bundle。该边界不向 CJS、CLI 或所有依赖扩散。保留 `scripts/run-automd.cjs`，因为它是 automd CLI 的独立 CJS 兼容边界。
3. 在 `build` 开始前只清理一次 `dist`，四组 tsup 构建均不再自行 `clean`，消除共享输出目录的声明删除竞态。
4. 新增构建后入口测试：用 ESM loader 显式拒绝解析 `consola`，验证两个窄子路径可运行；同时断言 `node-cjs/index.d.cts` 保留 `isConditionsEvery`。

## 验证

- [run 31496471500](https://github.com/ruan-cat/monorepo/actions/runs/31496471500) 是关键反证：此前绿灯后的最新提交仍在 `验证utils发布入口` 失败，错误为 `pnpm-workspace-yaml/index.js` 不存在；因此没有把 `31496037534` 当作最终验收。
- [run 31498466901](https://github.com/ruan-cat/monorepo/actions/runs/31498466901) 在 Node.js `24.18.0` 的全新 GitHub Runner 成功完成完整 CI 和 `验证utils发布入口`，证明默认 ESM、`node-esm`、`node-cjs` 以及两个窄子路径在构建产物上均可加载，且窄路径不解析 `consola`。
- [run 31495666705](https://github.com/ruan-cat/monorepo/actions/runs/31495666705) 证明全量内联不可取：打入 CJS 版 `yaml` 会在 ESM 触发动态 `require("process")`。
- `git diff --check` 通过；最终代码提交为 `9d983230`、`5edbc70b`、`a3fd0863`、`9f1d1a2a` 与 `ea6b229f`。

## 后续约束

遇到 Node.js 24 + pnpm monorepo 的模块找不到错误时，先在失败生命周期确认文件实际存在，再按真实导入栈收缩消费者。包内 `node_modules/.../bin` 物理路径不是 CLI 合同，优先恢复包管理器公开的标准命令。全局 patch、只内联一个失败包、或无差别内联所有依赖都不是默认方案：用真实发布入口测试确定最小 ESM 兼容列表，并以**最新提交**的远端入口测试作为验收；前一个 SHA 的绿灯不能覆盖后一个 SHA 的失败。为一个包新增多个 tsup 配置时，不能让共享输出目录的每个并行配置都执行 `clean`；清理必须在并行构建前只做一次。所有新增 public subpath 都要同时验证运行时产物、类型声明与真实消费者。
