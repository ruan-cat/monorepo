# tsconfig 内存优化策略矩阵 · 14 仓库实战判定明细

> 来源：2026-09-05 VSCode 内存优化任务（PLAN v2 Task B/C/D 四批次），本地 ruan-cat 代码工作区全部 19 目录过账。
> 本文是 SKILL.md 判定矩阵的实证支撑，每个条目都是真实执行结果，可作同类项目的对照样本。

## 一、判定与改写明细（14 仓库）

### Batch 1（Task B/C 试点 + D 推广首批）

| 仓库                                          | 形态                                                   | 判定与改法                                                                                                             | 验证结果                                                                 |
| :-------------------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| eams-component-lib `packages/vue-element-cui` | A 单体（Vue 组件库子包）                               | 全文改写：skipLibCheck + incremental + tsBuildInfoFile + assumeChanges + 显式 include/exclude                          | tsc 0 错 / vite build 5.63s / 跨包跳转用户确认 / 四链路全绿              |
| SmallAliceWeb `packages/ai-vue`               | A 单体（monorepo 子包）                                | 加 incremental + tsBuildInfoFile + assumeChanges + exclude 块（含 `**/*.d.ts`——该配置 include 未显式列 .d.ts，不矛盾） | 裸 tsc TS2307 为既有假阴性（基线 4 错→2 错），vue-tsc exit=0，build 通过 |
| eams-component-lib 根                         | A 单体                                                 | 加 skipLibCheck + incremental + tsBuildInfoFile                                                                        | tsc 错误 70→70 零回归                                                    |
| 01s-11comm 根                                 | A 单体（已有 skipLibCheck，include 窄集无 references） | 只加 incremental + tsBuildInfoFile，不盲从模板加 solution 键                                                           | exit=0，tsbuildinfo 生成                                                 |

### Batch 2（D 推广次批）

| 仓库                                | 形态                            | 判定与改法                                                   | 验证结果         |
| :---------------------------------- | :------------------------------ | :----------------------------------------------------------- | :--------------- |
| 01s-11comm-app                      | A 单体                          | incremental + tsBuildInfoFile                                | 0→0 错误，零回归 |
| notes                               | A 单体                          | incremental + tsBuildInfoFile + gitignore 补 `*.tsbuildinfo` | 1 既有错不变     |
| stars-list                          | A 单体                          | 同上                                                         | 0→0              |
| ai-chat-demo-by-meoo                | solution 根（已有 incremental） | 幂等规则跳过                                                 | —                |
| monorepo 根                         | B solution-style                | **判定跳过**（根加键 no-op，真实收益在子配置，超范围）       | —                |
| gzpc-big-screen / dfsw-assets-admin | F 无根 tsconfig                 | 跳过                                                         | —                |

### Batch 3（用户扩容范围后）

| 仓库                            | 形态                    | 判定与改法                                                                                    | 验证结果                                            |
| :------------------------------ | :---------------------- | :-------------------------------------------------------------------------------------------- | :-------------------------------------------------- |
| 01s-08mes                       | B solution-style → 下探 | 根不动；app/node 双子配置各加 incremental，tsBuildInfoFile **分名**（app/node），gitignore 补 | app 65→65、node 14→14（基线对照实验归因既有）零回归 |
| 01s-09oa                        | B solution-style → 下探 | 同上                                                                                          | app 67→67、node 10→10 零回归                        |
| 01s-10wms                       | 单仓多工程              | 仅改 `main/tsconfig.json`（真实主工程）；`examples/` 脚手架示例跳过                           | 8→8 零回归                                          |
| hzx10                           | A 单体                  | incremental + tsBuildInfoFile                                                                 | 0→0                                                 |
| learn-nitro-starter-with-vercel | E extends preset        | 本地 compilerOptions 覆盖 incremental + tsBuildInfoFile，gitignore 补                         | 1 既有 TS5101 不变                                  |
| resume                          | A 单体                  | incremental + tsBuildInfoFile                                                                 | 0→0                                                 |
| learn-openx-ui                  | C composite             | **判定跳过**——子配置 `composite: true` 天然增量                                               | —                                                   |

### Batch 4（SmallAliceWeb 解除暂缓，用户限定"只处理少数文件"）

| 仓库                            | 形态                                          | 判定与改法                             | 验证结果              |
| :------------------------------ | :-------------------------------------------- | :------------------------------------- | :-------------------- |
| SmallAliceWeb 根                | A 单体（docs/.vitepress 工程，带 references） | 根配置加 incremental + tsBuildInfoFile | 0→0，tsbuildinfo 生成 |
| SmallAliceWeb `packages/ai-vue` | （Task C 遗留改动提交）                       | vue-tsc 复验 exit=0                    | 同 Task C             |

## 二、跳过判定的完整口径

| 跳过原因                  | 案例                               | 规则                                          |
| :------------------------ | :--------------------------------- | :-------------------------------------------- |
| composite 天然增量        | learn-openx-ui                     | 子配置已有 `composite: true` 不加 incremental |
| solution 根无源码         | monorepo                           | 根加键 no-op；下探子配置需单独评估范围        |
| 无 tsconfig / 无 TS       | 01s-12psi、drill-docx              | 不在范围，不新建                              |
| 无根 tsconfig（多工程仓） | gzpc-big-screen、dfsw-assets-admin | 只处理真实工程配置，不猜测                    |
| 已有 incremental          | ai-chat-demo-by-meoo               | 幂等规则                                      |
| 示例/脚手架               | 01s-10wms examples/                | 非主工程，与上游模板同步易冲突                |

## 三、gitignore 口径

`*.tsbuildinfo` 逐仓检查（grep .gitignore），缺失则追加：

```gitignore
# TypeScript 增量构建缓存
*.tsbuildinfo
```

实测分布：eams-component-lib、01s-11comm、01s-09oa、01s-10wms、hzx10、learn-openx-ui、resume 原本已有；notes、01s-11comm-app、stars-list、01s-08mes、learn-nitro-starter-with-vercel、SmallAliceWeb 由本次补齐。缓存文件统一落 `node_modules/.cache/`（node_modules 整体忽略兜底，gitignore 条目作第二道防线）。

## 四、提交口径

- 类型：`🔨 build(tsconfig)`（远程 commit-types 权威源）；gitignore 变更独立 `🐳 chore` 提交
- Trailer：`Assisted-by: <客户端> / <模型>`；Co-authored-by 按 allowlist 严格判定，不在表内禁止编造
- 消息文件放**仓库根目录内**（`/tmp` 路径对原生 git.exe 会解析错，且 lint-staged 场景必炸）
- push 前用户拍板；遇 non-fast-forward 先 fetch 确认改动面交集，零交集才 `stash → rebase → push → pop`

## 五、结果总账

- 14 仓库改写落地、5 个判定跳过（含 monorepo/composite/无配置）、全部"改前基线对照"零回归
- 15 个提交（build×11 + chore×4）推送成功，唯一例外：11comm-app 仓库已归档（403）
- 结构性证据：tsserver syntax/semantic 拆分生效、tsbuildinfo 全部生成、semantic server 稳定 ~184 MB
