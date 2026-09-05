---
name: init-tsconfig
description: 通过 tsconfig.json 的合理配置降低 VSCode tsserver 的运行时内存占用，附 14 仓库实证策略矩阵与批量落地流程。当用户要求降低 tsserver 或 TypeScript 内存、优化 VSCode/IDE 内存占用、批量治理项目 tsconfig 时使用。
user-invocable: true
metadata:
  version: "1.0.0"
---

# init-tsconfig：用 tsconfig.json 降低 tsserver 内存

## 目标

在不破坏类型检查与构建链路的前提下，通过 tsconfig.json 的合理配置降低 VSCode tsserver 的运行时内存占用。适用于任意数量、任意形态的 TypeScript/Vue 项目批量优化。

**实测战绩**：2026-09-05 于 14 个仓库（单体/solution/composite/monorepo 子包/nitro extends 五种形态）全部零回归落地，15 个提交推送。

## 核心配置（按降内存贡献排序）

|  #  | 配置                                                                                  | 作用机制                                           | 适用面                            |
| :-: | :------------------------------------------------------------------------------------ | :------------------------------------------------- | :-------------------------------- |
|  1  | `incremental: true` + `tsBuildInfoFile: "./node_modules/.cache/tsconfig.tsbuildinfo"` | 增量编译缓存，消除 tsserver 全量重复编译的内存峰值 | 一切真实编译单元                  |
|  2  | `skipLibCheck: true`                                                                  | 跳过 node_modules 内 `.d.ts` 全量类型检查          | 已有则不动；没有则加              |
|  3  | `include` / `exclude` 显式限定                                                        | 缩小 tsserver 文件收集面                           | include 已显式的只加 exclude 缺项 |
|  4  | `assumeChangesOnlyAffectDirectDependencies: true`                                     | 变更只重查直接依赖                                 | **仅 monorepo 子包**              |
|  5  | 用户级 settings 配套（见下）                                                          | 进程级降内存                                       | 一次性全局                        |

用户级 settings.json 配套（一次性，不属于 tsconfig 但同任务链路）：

```jsonc
"typescript.tsserver.useSeparateSyntaxServer": true,   // syntax/semantic 进程拆分
"typescript.tsserver.maxTsServerMemoryForSyntax": 1024, // syntax server 低堆上限
"typescript.tsserver.experimental.enableProjectDiagnostics": false,
"typescript.disableAutomaticTypeAcquisition": true,
"typescript.preferences.includePackageJsonAutoImports": "off",
"typescript.suggest.autoImports": false
```

## 项目形态判定（先判定，再下配置）

**核心原则：同一个键加错地方就是 no-op。** 动手前必须判定目标 tsconfig 是哪种形态：

| 形态                                       | 识别特征                                               | 策略                                                                                                                                                                                                                     |
| :----------------------------------------- | :----------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. 单体应用**                            | 有完整 `compilerOptions` + 非空 `include` 指向真实源码 | 直接加 incremental + tsBuildInfoFile；skipLibCheck 已有不加                                                                                                                                                              |
| **B. solution-style 根**                   | `files: []` + `references`，自身无源码                 | **根配置加键是 no-op，禁止在根加**。下探到真实子配置（tsconfig.app.json / tsconfig.node.json 等）分别加；多子配置的 tsBuildInfoFile **分文件命名**（`tsconfig.app.tsbuildinfo` / `tsconfig.node.tsbuildinfo`）避免写冲突 |
| **C. composite 子项目**                    | 子配置含 `"composite": true`                           | **跳过**——composite 强制增量行为，再加是冗余                                                                                                                                                                             |
| **D. monorepo 子包**                       | 被 references 引用 / 依赖 workspace 协议包             | A 的基础上追加 `assumeChangesOnlyAffectDirectDependencies: true`                                                                                                                                                         |
| **E. extends 外部 preset**                 | `"extends": "nitro/tsconfig"` 之类                     | 本地 `compilerOptions` 写 incremental + tsBuildInfoFile 覆盖即可生效                                                                                                                                                     |
| **F. 无 tsconfig / 无 TS 源码 / 示例工程** | 文件不存在 / 空目录 / examples 脚手架                  | **跳过，不新建**（创建 tsconfig 超出内存优化范围）                                                                                                                                                                       |

## 标准执行流程（每仓库 5 步）

```text
1. 基线对照  → 改前跑 tsc（或项目自带 typecheck），记录 exit 码与错误数
2. 幂等核查  → grep '"incremental"' tsconfig.json，已有则跳过改写
3. 兜底确认  → 确认原文件在 git HEAD 中（代替 .bak 备份）；gitignore 确认含 *.tsbuildinfo
4. 改写      → 只增不删，插入块带注释标记（日期 + 任务来源）；缓存统一写 node_modules/.cache/
5. 验证闭环  → 改后 tsc 错误数与基线一致 = 零回归；确认 tsbuildinfo 生成
```

### L1 验收判定（关键纪律）

- **错误数对照**：改后 `error TS` 计数 === 改前基线 → 零回归。**既有错误不是回归**（很多项目裸 tsc 本来就报错，真实类型链路可能是 vue-tsc / IDE）。
- **优先用项目自带 typecheck**：有 `vue-tsc` 用 `pnpm typecheck`，裸 `tsc` 对 `.vue` 项目是假阴性（TS2307 是工具链限制）。
- **管道后的 `$?` 不可信**：`cmd | tail` 后取到的是 tail 的退出码，用 `(cmd > log 2>&1; echo $?)` 结构。
- build 链路验证：根 tsconfig 的消费者是 tsc 本身，monorepo 根的 turbo build 不经过根配置——build N/A 要给依据，不装样子。

## 红线与常见坑

|  #  | 坑                       | 规则                                                                                             |
| :-: | :----------------------- | :----------------------------------------------------------------------------------------------- |
|  1  | include/exclude 双向矛盾 | include 显式包含 `*.d.ts` 时，exclude **不得**加 `**/*.d.ts`（声明文件需要进编译，本来也不该排） |
|  2  | solution 根装样子        | 根是 files:[] 时加任何编译键都是 no-op，必须下探子配置                                           |
|  3  | 双子配置缓存冲突         | app/node 共用同名 tsbuildinfo 会互相覆盖，必须分名                                               |
|  4  | MSYS 路径给原生程序      | `/tmp/xxx` 传给 node.exe/git.exe 会解析成 `盘符:\tmp`——临时脚本/消息文件放真实盘符路径           |
|  5  | PowerShell 5.1 编码      | `Get-Content -Raw` 默认 ANSI 读 UTF-8 文件产生 mojibake——配置文件读写用 Node `fs` 端到端 utf8    |
|  6  | 工作区 `type: module`    | 临时 Node 脚本用 `.cjs` 扩展名，`.js` 会被当 ESM 报 require undefined                            |
|  7  | 脏文件污染提交           | 批量仓库提交时只 `git add` 计划内路径，禁止 `-A`；用户/他人脏文件零触碰                          |
|  8  | 用户开发中动 GUI         | 禁止批量调用 `code` CLI（每条拉起一整套实例），语言服务验证交用户窗口内完成                      |

## 完整实战案例

14 个仓库的形态判定、改法与验证明细见 [references/strategy-matrix.md](./references/strategy-matrix.md)。

## 验收标准

- [ ] 每个改写过的 tsconfig 都有改前/改后错误数对照记录
- [ ] 所有 tsbuildinfo 正常生成且被 gitignore 覆盖
- [ ] 判定跳过的仓库有明确依据（形态 + 原因）
- [ ] 提交遵循 Conventional Commits（`🔨 build(tsconfig)`），push 前经用户确认
