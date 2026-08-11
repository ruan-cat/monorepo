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

1. VitePress 的首个 `bin/vitepress.js` 找不到错误尚未建立可控复现。安装后和真正执行前均确认目标文件存在，因此保留直接调用包本地 `node_modules/vitepress/bin/vitepress.js` 的窄绕过；不要无证据地把它归因于 pnpm shim。
2. 真正的 `consola` 故障来自错误的模块边界。VitePress 仅需要 `isConditionsSome` 与 `findMonorepoRoot`，却分别经 `@ruan-cat/utils` 默认 ESM 和 `node-esm` 宽 barrel 导入；它们会 re-export `print.ts`，从而无关地静态加载 `consola`。Node.js 24 在该工作区嵌套解析路径回退到 `legacyMainResolve` 并访问不存在的 `consola/index.js`。

修复过程中还暴露了独立的构建竞态：`tsup.config.ts` 的四组并行构建都使用 `clean: true` 且共享 `dist`。某组完成后会删除另一组刚写出的 `.d.ts`。可信信号是 [run 31494445288](https://github.com/ruan-cat/monorepo/actions/runs/31494445288) 中 `@ruan-cat/commitlint-config` 无法从 `@ruan-cat/utils/node-cjs` 读取 `isConditionsEvery`；源码有该导出，但最终声明文件被并行清理掉了。

## 关键误导点

- `31490521146` 曾在同一 utils Turbo hash 下成功，而紧接着的 `31490863532` 又在外部 `consola` 路径失败；一次成功不能证明 resolver 已修复。
- `noExternal: ["consola"]` 只会把问题掩盖在两个 ESM 产物中，不能成为所有入口的通用策略；CJS 与 CLI 仍有外部依赖边界。
- `consola.patch` 重写第三方 `exports`/`main` 并添加 shim，影响整个工作区且依赖特定包布局。它不是 VitePress 只需两个工具函数的正确解决层。
- 删除缓存、`pnpm i --force`、降低 Node 版本或改全局 linker 都未证明解决根因，且扩大了影响范围。

## 最终修复

1. 为 `@ruan-cat/utils/conditions` 和 `@ruan-cat/utils/monorepo` 提供真实的 `dist` ESM 与声明产物；VitePress 两个消费者改用这两个窄子路径，不再穿过会加载日志模块的 barrel。
2. 删除 `noExternal: ["consola"]`、`patchedDependencies.consola`、`patches/consola.patch` 和孤儿的 `ensure-consola-patch.ts`。保留 `scripts/run-automd.cjs`，因为它是 automd CLI 的独立 CJS 兼容边界。
3. 在 `build` 开始前只清理一次 `dist`，四组 tsup 构建均不再自行 `clean`，消除共享输出目录的声明删除竞态。
4. 新增构建后入口测试：用 ESM loader 显式拒绝解析 `consola`，验证两个窄子路径可运行；同时断言 `node-cjs/index.d.cts` 保留 `isConditionsEvery`。

## 验证

- [run 31494861244](https://github.com/ruan-cat/monorepo/actions/runs/31494861244) 在 Node.js `24.18.0` 的全新 GitHub Runner 成功完成 `turbo并发打包全部子项目`。
- 同一 run 的 `验证utils发布入口` 成功，证明默认 ESM、`node-esm`、`node-cjs` 以及两个窄子路径在构建产物上均可加载，且窄路径不解析 `consola`。
- `git diff --check` 通过；最终代码提交为 `9d983230` 与 `5edbc70b`。

## 后续约束

遇到 Node.js 24 + pnpm monorepo 的模块找不到错误时，先在失败生命周期确认文件实际存在，再按真实导入栈收缩消费者，而不是全局 patch 或无差别内联依赖。为一个包新增多个 tsup 配置时，不能让共享输出目录的每个并行配置都执行 `clean`；清理必须在并行构建前只做一次。所有新增 public subpath 都要同时验证运行时产物、类型声明与真实消费者。
