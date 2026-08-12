# 2026-08-12 Prettier lint-staged 插件加载决策复核报告

> 本报告由 Codex agent 工具完成，AI 模型为 GPT-5.6。

## 结论先行

这次把 lint-staged 从 `prettier --experimental-cli --write --no-parallel` 改成显式传入 `--plugin prettier-plugin-lint-md`，并不是经过完整对照后证明的健壮性增强。原修改只证明“显式传参时可以工作”，没有证明“不传参数时不能工作”，属于把诊断手段误写成生产契约的过度配置。

补充 A/B 验证表明：从根目录执行、从嵌套目录执行，以及向 Prettier 传入绝对 Markdown 路径时，不传 `--plugin` 与显式传入的格式化输出一致。experimental CLI 能发现向上查找的根 `prettier.config.mjs`，顶层字符串 `plugins: ["prettier-plugin-lint-md"]` 已足够加载插件。

因此 v3 的默认命令恢复为 `prettier --experimental-cli --write --no-parallel`。显式 `--plugin prettier-plugin-lint-md` 仍保留在验证剧本中，但只作为解析故障的诊断/隔离 A/B 手段。

## 原修改与原动机

原模板曾从 `prettier --experimental-cli --write --no-parallel` 改成 `prettier --experimental-cli --plugin prettier-plugin-lint-md --write --no-parallel`。

原动机是 experimental CLI 对顶层对象插件不兼容，希望通过命令行预加载字符串插件提高成功率。这解决了一个真实问题：顶层对象会触发非字符串插件错误，显式 `--plugin` 确实可以绕过部分解析故障。但原动机没有区分“对象声明错误”和“根配置是否被发现”，也没有先验证 lint-staged 的实际 cwd。

## 关键决策

### 精确锁定版本

`prettier-plugin-lint-md` 必须精确使用 `1.0.1`。`^1.0.1` 允许漂移到 `1.0.3`；`1.0.1` 的主入口是 ESM `.js`，而 `1.0.3` 引入 CJS `.cjs` 主入口和条件导出，VSCode/esbenp 的字符串解析链路可能出现嵌套 default，格式化动作仍成功但 lint-md 规则静默失效。v3 要同时核对 `package.json`、lockfile 和运行时解析版本。

### 顶层字符串

完整矩阵的现行结论如下：

| 配置形式                  | 普通 CLI | experimental CLI | VSCode/esbenp          |
| ------------------------- | -------- | ---------------- | ---------------------- |
| `1.0.1` 顶层字符串        | 生效     | 生效             | 生效                   |
| 顶层对象                  | 可能生效 | 非字符串插件错误 | 可能生效               |
| 仅 Markdown override 对象 | 局部生效 | 可绕过顶层检查   | 顶层发现不到，静默失效 |

顶层字符串是三条入口共同成立的配置形式。对象不能因为某一路径能工作就重新成为默认方案。

### 三条加载入口

- 普通 CLI：读取根配置并自动发现顶层字符串；验证时不应传 `--plugin`，否则无法证明配置自身有效。
- experimental CLI：顶层对象会失败；根 cwd 能发现根配置中的顶层字符串；活动命令继续保留唯一的 `--no-parallel`，规避 Windows/Node worker 崩溃。
- VSCode/esbenp：依赖工作区 Prettier、真实文件路径的 `resolveConfig` 和顶层 `plugins`；只看格式化退出码会得到假绿。

### pnpm 严格隔离

pnpm 严格隔离只回答“从当前解析根能不能找到包”，不回答版本、ESM/CJS 入口、插件声明形式或 cwd 配置发现。只有在实际执行根的 `require.resolve("prettier-plugin-lint-md/package.json")` 失败时，才进入 `.npmrc` hoist 分流，不能因为怀疑 pnpm 就默认加入 `--plugin`。

## A/B 验证证据

对照变量只有是否增加 `--plugin prettier-plugin-lint-md`：

| 执行位置/输入              | 不传 `--plugin` | 显式传 `--plugin` | 结果     |
| -------------------------- | --------------- | ----------------- | -------- |
| 根 cwd，项目内文件         | lint-md 生效    | lint-md 生效      | 输出一致 |
| 嵌套 cwd，向上发现根配置   | lint-md 生效    | lint-md 生效      | 输出一致 |
| 根 cwd，绝对 Markdown 路径 | lint-md 生效    | lint-md 生效      | 输出一致 |

关键命令如下：

```log
pnpm exec prettier --experimental-cli --no-parallel --write <absolute-markdown-file>
pnpm exec prettier --experimental-cli --plugin prettier-plugin-lint-md --no-parallel --write <absolute-markdown-file>
```

四组历史探针输出一致。证据是完整 Markdown 输出一致，不是单纯退出码为 0。

## lint-staged cwd 源码证据

当前 WorkBuddy 使用 Prettier `3.9.6`、lint-staged `17.3.0`、prettier-plugin-lint-md `1.0.1`。lint-staged `runAll.js` 在未传 `--cwd` 时使用 `process.cwd()`，单配置模式把该 cwd 传给 spawned task；`getSpawnedTask.js` 对普通命令使用传入 cwd，只有 Git 命令切换到 top-level dir。

因此从仓库根执行 `pnpm exec lint-staged` 时，Prettier 任务 cwd 就是仓库根，根 `prettier.config.mjs` 会被发现，顶层字符串会被自动加载。答案是：lint-staged 的 Prettier 能读取根配置，前提是从根 cwd 启动且配置所有权唯一。

## v3 纠偏

1. `format` 和 lint-staged 默认命令删除显式 `--plugin`。
2. 保留 experimental CLI 与唯一的 `--no-parallel`。
3. 顶层字符串和精确 `1.0.1` 继续作为最高优先级契约。
4. 验证剧本增加不传参数 vs 显式参数的 A/B；只有自动发现失败时才调查 cwd、hoist 和包入口。
5. `prettier.config.mjs` 的 JSDoc 明确记录：显式 `--plugin` 是诊断手段，不是生产命令健壮性证明。
6. `references/decision-evolution.md` 新增“过度修复”阶段，保留错误动机、证据缺口和纠偏依据。

## 最终验收要求

后续执行必须完成版本三层核对、普通 CLI/experimental CLI/VSCode 三链路、同一 Markdown 样例真实内容断言、默认命令不重复 `--plugin`、A/B 失败时的解析根分流，以及探针清理和 `git diff --check`。

本次结论不是“显式参数永远不能用”，而是“不能在缺少反事实证据时把它当默认生产配置”。
