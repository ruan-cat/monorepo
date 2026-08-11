# 2026-08-12 monorepo CI 构建缓存与包依赖闭包事故报告

> 生成工具：Codex Desktop（GitHub CLI、Memorix MCP、OpenCode）
>
> 主模型：GPT-5.6（Codex）；独立复核模型：`opencode-go/gpt-5.6-luna`（`variant=max`）
>
> 报告性质：已修复事故的 RCA 与长期预防记录；所有根因结论均对应提交、失败日志或通过的验证结果。

## 1. 结论先行

这不是一个单一的「pnpm 链接坏了」问题，而是一串被 fail-fast CI 依次遮住的独立契约缺口：

1. VitePress 文档脚本曾依赖包内 `node_modules` 的物理路径；pnpm 的链接布局并不承诺这个路径存在。
2. `Turbo build.outputs` 使用 `**/dist/**` 与 `**/.output/**`，缓存边界宽于任务自身产物，扩大了依赖目录与远程缓存相互影响的风险。
3. `@ruan-cat/vercel-deploy-tool` 的 `build: tsup` 没有声明本地 `tsup` 与 `typescript`，本地 hoist 掩盖了缺口。
4. `@ruan-cat/utils` 的 ESM 产物保留了 `yaml` 外部导入，却没有把它声明为直接运行时依赖。

`consola` shim、全局 `node-linker=hoisted`、强制重装依赖、重建链接和 Node 版本切换都曾是高干扰假设；它们没有构成这次最终修复的因果证据。特别是 `exit 139` 是前序模块解析失败后的伴随现象，不能倒置为根因。

最终修复由四个小而独立的提交构成：恢复标准 VitePress CLI、收紧 Turbo 输出、补齐构建工具依赖、补齐 `yaml` 运行时依赖。代码修复提交 [010845a7](https://github.com/ruan-cat/monorepo/commit/010845a7dad0a1f8d2db25688fe1b95e8b7d4360) 的 [CI 31512258550](https://github.com/ruan-cat/monorepo/actions/runs/31512258550) 完成全量构建和 `utils` 入口测试；后续文档提交的 [CI 31512798884](https://github.com/ruan-cat/monorepo/actions/runs/31512798884) 再次全绿。

## 2. 用户可见现象与影响

最初报告的 [31488377756](https://github.com/ruan-cat/monorepo/actions/runs/31488377756) 与后续 [31505466235](https://github.com/ruan-cat/monorepo/actions/runs/31505466235) 都在 `@ruan-cat/vitepress-preset-config#build:docs` 失败：

```log
> node node_modules/vitepress/bin/vitepress.js build src/docs
Error: Cannot find module '.../packages/vitepress-preset-config/node_modules/vitepress/bin/vitepress.js'
```

紧随其后的 `Segmentation fault` / `exit 139` 使表象更加混乱。后续每次消除前一个阻断点，CI 都会继续暴露下一个真实缺口：先是 VitePress ESM 解析，再是 `tsup: not found`，最后是 `yaml` 运行时解析失败。影响是 `dev` 推送 CI 持续失败，构建与发布入口的可信度下降。

## 3. 事件时间线与证据

| 阶段         | 提交或工作流                                                                             | 观察到的事实                                                                                                             | 结论                                                              |
| ------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 起始         | `31488377756`、`31505466235`                                                             | VitePress 脚本直接访问包内物理路径并找不到 `vitepress.js`；随后出现 `139`。                                              | 先处理脚本契约；`139` 不单独定性为原生崩溃。                      |
| 错误绕行     | `5141d926`                                                                               | 将脚本改为 `node node_modules/vitepress/bin/vitepress.js`。                                                              | 该绕行继续依赖不稳定物理路径，不能作为最终方案。                  |
| 收敛入口     | `f509a791`                                                                               | 恢复 `vitepress build src/docs`。                                                                                        | 用包管理器暴露的标准 CLI 入口，而非假设嵌套 `node_modules` 布局。 |
| 全局链接试验 | `ecb79404`、[31510911304](https://github.com/ruan-cat/monorepo/actions/runs/31510911304) | 强制 `node-linker=hoisted` 后，`dist/config.mjs` 仍找不到包内 `vitepress/index.js`，并伴随 `139`。                       | 改变全局链接布局不是根治，且放大影响面；随后已回退。              |
| 缓存边界转折 | `40821036`、[31511256427](https://github.com/ruan-cat/monorepo/actions/runs/31511256427) | `build.outputs` 从宽 glob 收紧；该 run 在 15 个构建任务中完成 11 个，唯一失败改为 `@ruan-cat/vercel-deploy-tool#build`。 | 原先的构建/缓存故障不再阻断，真实包清单缺口首次稳定暴露。         |
| 构建工具闭包 | `790ff779`、[31511684710](https://github.com/ruan-cat/monorepo/actions/runs/31511684710) | 全部 15 个 Turbo 构建任务成功；随后 `utils` 入口测试因 `ERR_MODULE_NOT_FOUND: yaml` 失败。                               | `tsup`/`typescript` 的本地声明有效，下一层为真实运行时依赖缺口。  |
| 运行时闭包   | `010845a7`、[31512258550](https://github.com/ruan-cat/monorepo/actions/runs/31512258550) | 完整构建成功；`public-subpath-exports.test.ts` 为 1 个文件、4 个测试全部通过。                                           | `yaml` 直接依赖补齐，代码修复闭环成立。                           |
| 最新复验     | `656b54b5`、[31512798884](https://github.com/ruan-cat/monorepo/actions/runs/31512798884) | 最新 `dev` CI 成功，构建步骤与 `验证utils发布入口` 均成功。                                                              | 文档/经验提交没有破坏已经修复的链路。                             |

## 4. 根因分析：为什么会连续出现“新问题”

### 4.1 失败是串行揭露，不是一个错误反复变形

CI 在第一个失败任务即停止。于是，VitePress 的物理入口问题遮住了缓存和其他包的构建；缓存问题被收紧后，缺失的构建二进制才暴露；构建工具补齐后，发布产物的 `yaml` 外部依赖才暴露。把这些后续错误全部归到 pnpm 或 `consola` 上，会把四个不同层次的合同问题混成一个“环境问题”。

### 4.2 缓存输出越界破坏任务所有权

`Turbo` 的 `outputs` 是任务可恢复产物的声明，不是“磁盘里看起来像构建结果的所有目录”。`**/dist/**` 会比 `dist/**` 宽得多；前者不表达“当前 package 自己生成的 dist”，容易覆盖到任务不拥有的子目录。修复后的配置是：

```json
"outputs": ["dist/**", ".output/**"]
```

这不是为了追求缓存命中率，而是恢复任务输出所有权。现有 `build:docs` 的输出模式未被本次无证据地扩大修改；若将来出现文档缓存异常，必须先清点实际输出归属，再做独立变更。

### 4.3 本地依赖树不能替代包的发布合同

`@ruan-cat/vercel-deploy-tool` 声明了 `build: tsup`，却未把运行该脚本的 `tsup` 和 `typescript` 放入自己的 `devDependencies`。`@ruan-cat/utils` 则把依赖链中的 `yaml` 保留为 ESM 外部导入，但未在 `dependencies` 声明它。二者都能在本地 root hoist 布局下“恰好可用”，却会在干净 CI 或消费者安装布局中失败。

包级合同必须按产物而非源码印象审查：构建命令需要的二进制是本包开发依赖；发布产物仍会 `import` 的包是本包运行时直接依赖。

### 4.4 `consola` 不是本次最终根因

此前 Node.js 24 + pnpm 工作区 ESM 解析确实存在 `consola`、`tinyglobby`、`pnpm-workspace-yaml` 的边界问题，且已有窄子路径和最小 `noExternal` 处理。但本次最后失败日志明确是：

```log
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'yaml'
imported from '.../packages/utils/dist/node-esm/index.js'
```

这把排障从“第三方 shim 是否正确”拉回了发布产物的直接依赖合同。最新入口测试还明确在禁止解析 `consola` 时通过，因此不应重新引入 shim，也不应把移除外部 `consola` 导入视为破坏 `utils` 的行为。

## 5. 自我批判：错误假设与无效动作

### 5.1 把物理路径当成稳定 API

`node node_modules/vitepress/bin/vitepress.js` 既不是 VitePress 的稳定 CLI 合同，也不是 pnpm 必须提供的布局。它把“当时本机能找到”误写成“所有 Runner 必须存在”。正确动作是恢复标准 `vitepress build src/docs`，再用 CI 验证。

### 5.2 在全局层处理包级症状

`node-linker=hoisted`、全量 hoist、反复安装、重建 workspace 链接都改变了大范围安装语义，却没有证明对应缺失模块的声明已正确。这类动作的诊断价值低、回归半径大，并让每一次 run 的环境基线不可比较。

### 5.3 把失败后的 `139` 当成根因

日志先给出明确的模块解析失败，再出现 `Segmentation fault`。先处理可读、可复现的第一个异常，才是正确的因果顺序；否则会把注意力从 JavaScript 模块边界错误转移到没有证据的原生崩溃猜测。

### 5.4 把历史绿灯当成当前提交的验收

不同 SHA、不同 Turbo hash 和远程缓存状态的成功不证明后续依赖图安全。此次真正的代码验收是 `010845a7` 的完整 CI；`656b54b5` 的快速绿色 workflow 只能证明后续文档提交未破坏链路，不能替代前者。

### 5.5 让经验文档本身过期

旧案例一度把包内 VitePress 物理入口描述为“保留绕过”。这与后续 `f509a791` 的实际最终状态冲突。长期记忆如果不随最终验证纠正，会成为下一次错误决策的来源；本次已同步更正。

## 6. 最终修复与边界

| 改动                                                       | 作用                                                 | 不做什么                                    |
| ---------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `f509a791` 恢复标准 VitePress CLI                          | 去除对 package-local `node_modules` 的物理布局假设。 | 不修改 pnpm linker。                        |
| `40821036` 收紧 Turbo `build.outputs`，并回退 hoisted 试验 | 让缓存只恢复任务自身产物。                           | 不凭猜测修改 `build:docs` 缓存模式。        |
| `790ff779` 为 Vercel 工具声明 `tsup`、`typescript`         | 让 `build: tsup` 的执行条件由本包自己提供。          | 不依赖 root hoist。                         |
| `010845a7` 为 utils 声明 `yaml`                            | 让 ESM 发布入口的外部运行时 import 有直接依赖。      | 不重新引入 `consola` shim，不全量内联依赖。 |

## 7. 验证证据与剩余边界

### 已验证

1. 本地在 `@ruan-cat/utils` 运行：

   ```powershell
   pnpm install --filter @ruan-cat/utils --frozen-lockfile
   pnpm --filter @ruan-cat/utils run build
   pnpm --filter @ruan-cat/utils run test:entrypoints
   ```

   三项均通过；入口测试为 4/4。

2. `31511684710` 证明 `@ruan-cat/vercel-deploy-tool` 后已完成 15/15 Turbo 构建，随后才暴露 `yaml` 缺口。
3. `31512258550` 成功完成完整构建与 `utils` 入口测试；测试覆盖默认 ESM、`node-esm`、`node-cjs` 和“禁止解析 `consola`”的场景。
4. `31512798884` 对最新 `dev` 再次成功；当前 `dev` 与 `origin/dev` 无分叉。
5. OpenCode Luna 独立只读审计会话 `ses_00e2c7082ffe7O48JiCpak7Dmx` 复核上述两次 CI 与分支关系，结论一致。

### 明确未覆盖

- 本次 push CI 没有执行真实 npm 发布后的干净消费者安装。下次 `@ruan-cat/utils` 发布时，应增加一次 tarball 或 registry 安装 smoke test，验证 `yaml` 随包依赖闭包可解析。
- 安装阶段仍有部分 workspace CLI 的 `Failed to create bin ... ENOENT` 警告。它们没有阻断本次 CI，也不是本次故障根因；但不应被长期忽略，应在独立任务中确认其是否只是构建前 bin 目标尚未生成。

## 8. 长期防复发规则

1. **第一失败优先**：记录第一个可读异常、关联的 SHA、任务名、完整命令和文件存在性；`139`、清理失败等后续噪音不得抢占根因。
2. **缓存所有权**：Turbo `outputs` 只允许任务自身拥有的相对输出。任何宽 glob 变更必须说明它是否能匹配依赖树，并用 cache miss 的 CI 复验。
3. **包清单闭包**：每个发布包独立声明构建命令依赖的二进制；每个保留到产物的外部 import 都是直接运行时依赖。不得以本机 hoist 为证据。
4. **入口测试是发布合同**：每次修改 bundler `external/noExternal`、exports、包清单或 Node/ESM 边界，都在最新代码 SHA 的 CI 上运行构建后的入口测试。
5. **禁止全局补丁式止血**：修改 node-linker、全局 patch、Node 版本或全量 reinstall 前，必须给出“错误路径 → 该全局变更 → 可复现实验”的因果链；否则优先修复脚本、缓存声明或包清单。
6. **记忆可撤销、可更正**：事故记忆必须记录证据级别和最终 SHA；后续事实推翻早期绕行时，更新旧结论而非让互相矛盾的经验并存。

## 9. 完整性声明

在当前可获得证据下，所有公开验收均通过，当前已知高风险路径已修复或明确列为未覆盖边界。本报告不把“CI 已绿”夸大为“所有未来发布绝不会失败”；它说明的是：本次 GitHub Actions 构建、VitePress 入口、Turbo 缓存边界、Vercel 工具构建与 utils 发布入口故障，均已用最新代码和独立审计证据闭环。
