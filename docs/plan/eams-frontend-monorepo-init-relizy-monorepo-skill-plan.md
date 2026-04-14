<!-- 已完成 -->

# eams-frontend-monorepo 任意 Monorepo 初始化 Relizy 发版配置工作流计划

## 目标

- 设计一个可复用的工作流 skill，用于给任意 monorepo 初始化 `relizy` 发版配置。
- 该 skill 不是纯规划器，而是一个可直接落地的执行型技能。
- skill 最终需要能够直接修改仓库文件、安装依赖、写入配置、补充 README，并在必要时接入兼容补丁。
- 本文以 `eams-frontend-monorepo` 作为首个落地案例，沉淀通用流程、决策树与实现任务拆分。

## 背景

给 monorepo 接入 `relizy` 时，真正复杂的部分并不只是写一份 `relizy.config.ts`。不同仓库在以下方面经常存在明显差异：

- `pnpm-workspace.yaml` 的工作区范围不同，不能假设永远只有 `packages/*`。
- `private: true` 会直接影响 `relizy` 对子包的扫描与纳管范围。
- `versionMode` 的语义容易被误解，`selective` 与 `independent` 不能混用。
- README 中往往缺少发版命令说明、首次发版注意事项、以及 dry-run 验证方式。
- Windows 环境下可能出现 `grep`、`head`、`sed` 依赖问题，不能假设上游工具天然跨平台。
- TypeScript 配置、包导出方式、以及第三方声明文件边界不一致，可能导致配置文件本身出现类型报错。

因此，这个 skill 不能只是“拷贝一份配置模板”，而要具备“先侦察，再决策，再落地，再验证”的执行工作流。

## 设计原则

- 先侦察后修改，不允许在未知工作区结构下盲写配置。
- 主技能负责决策树，子模板负责具体落地片段，避免把所有条件判断写成一大段硬编码说明。
- 仅在高风险策略点向用户确认，其余步骤在确认后自动落地。
- `relizy.config.ts` 保持简洁，兼容性与类型适配优先下沉到辅助配置或模板层。
- README 必须同步，不允许只接配置、不补使用入口。
- 验证必须包含 dry-run，不能只凭静态配置宣称接入完成。

## 技能架构

建议实现为一个主技能 `init-relizy-monorepo`，再配套 5 组子模板能力。这里的“子模板”不是单独对用户暴露的独立技能，而是主技能内部引用的固定章节、模板块或决策分支。

### 1. workspace-discovery

负责仓库侦察，识别：

- 根 `package.json`
- `pnpm-workspace.yaml`
- 根 README
- 现有 `changelog.config.*`
- 现有 `relizy.config.*`
- 根脚本与已有 release/changelog 工具
- 工作区 glob 范围
- 各工作区包的 `package.json`
- Prettier / TypeScript / Git hooks / lint-staged 等约束

输出一份结构化侦察结果，作为后续决策输入。

### 2. package-eligibility

负责判断哪些包应该被纳入 `relizy`：

- 当前可纳管包清单
- 被 `private: true` 阻断的包
- 应用包与库包是否都应纳入
- 是否要求覆盖全部 workspace 包
- 哪些调整属于破坏性变更，需要先征求用户确认

### 3. config-writer

负责生成或更新：

- `changelog.config.ts`
- `relizy.config.ts`
- 根 `package.json` 的脚本与依赖
- 必要时的 `tsconfig` 或类型适配
- 必要时的格式化命令

目标是保持主配置简洁，把兼容逻辑集中在更稳定的边界层。

### 4. runtime-compat

负责处理平台兼容与上游工具缺陷：

- Windows 下 `grep` / `head` / `sed` 依赖问题
- 是否采用 `pnpm patchedDependencies`
- 是否改为 runner 脚本封装
- 是否完全不需要额外兼容层

### 5. docs-sync

负责把最终发版入口写回 README，包括：

- 命令说明
- 行为说明
- 是否会生成根与子包 changelog
- 是否会生成 git tag 并 push
- 是否跳过 `npm publish`
- 安全变体命令，例如 `--no-push`

## 技能执行流程

主技能建议按五阶段执行：

### 第一阶段：侦察

读取并整理以下信息：

- 根目录 `package.json`
- `pnpm-workspace.yaml`
- 根 README
- 工作区内所有 `package.json`
- 是否已有 `changelog.config.ts`
- 是否已有 `relizy.config.ts`
- 是否已有发版脚本、changesets、changelogen、standard-version 等工具

侦察阶段的输出应是结构化结果，而不是散乱的观察笔记。

### 第二阶段：第一次确认点

仅针对高风险策略进行确认：

- `versionMode` 使用 `selective` 还是 `independent`
- 是否覆盖全部 workspace 包
- 是否允许移除 `private: true`
- Windows 兼容采用补丁还是 runner
- 是否自动补 README

如果用户没有明确给出选择，主技能可以按默认推荐策略执行，但必须把默认值明确写入输出。

### 第三阶段：落地

确认后自动执行：

- 安装 `relizy`
- 写入或更新 `changelog.config.ts`
- 写入或更新 `relizy.config.ts`
- 更新根 `package.json` 脚本
- 必要时更新 `pnpm-workspace.yaml`
- 必要时添加补丁文件
- 必要时移除相关包的 `private: true`
- 补充 README

### 第四阶段：验证

至少跑以下三类验证：

- `relizy --help`
- `relizy changelog --dry-run`
- `relizy release --dry-run`，必要时带 `--no-publish --no-provider-release --no-push --no-commit`

验证失败时，应归类为以下几类原因之一：

- 配置文件类型问题
- 依赖安装问题
- 平台兼容问题
- 仓库当前没有 tag 或没有符合 bump 条件的提交

### 第五阶段：第二次确认点

最终输出必须包含：

- 实际修改文件清单
- 哪些改动是破坏性的
- 哪些风险仍然存在
- 正式发版前下一步该做什么

## 决策树

这是该技能最关键的部分，必须显式写清楚，而不是让执行者靠临场猜。

### 1. 版本模式决策

- 如果用户要求“各子包独立版本号”，默认推荐 `independent`
- 如果用户要求“只 bump 变更包，但本次 bump 的包共用同一版本”，使用 `selective`
- 不允许把“独立版本”和 `selective` 混为一谈

### 2. 包纳管决策

- 如果用户要求“覆盖全部 workspace 包”，就必须检查所有工作区包的 `private: true`
- 如果 `private: true` 阻断了扫描，主技能必须先列出受影响的包，再向用户确认是否移除
- 如果用户拒绝移除 `private: true`，则自动退回为“只纳管可扫描包”的保守方案

### 3. 配置生成决策

- 优先生成 `changelog.config.ts` 与 `relizy.config.ts`
- 主配置文件保持简洁
- 类型兼容层优先下沉，不要把冗长类型逻辑堆在 `relizy.config.ts`
- 若仓库已有现成 changelog 类型来源，优先复用，不重复定义

### 4. 平台兼容决策

- 如果 Windows 下 dry-run 报 `grep` / `head` / `sed` 缺失，则优先进入兼容层分支
- 若仓库适合本地补丁，则使用 `pnpm patchedDependencies`
- 若仓库更适合脚本入口，则使用 runner 包装
- 若验证不报跨平台问题，则不额外引入兼容层

### 5. 文档同步决策

- 如果根 README 已有发版章节，则增量补充
- 如果没有，则新增一节专门的 `Relizy 发版` 说明
- 命令说明必须与实际脚本完全一致，不允许 README 写法与脚本脱节

## 首个落地案例：eams-frontend-monorepo

### 仓库特征

目标仓库：

- `D:\code\01s\202603-13hzb\yunxiao\01s-2603-13eams\eams-frontend-monorepo`

该仓库的关键特征：

- 通过 `pnpm-workspace.yaml` 管理 `apps/*`、`old/*`、`packages/*`、`configs/*`
- 目标是把全部工作区包纳入 Relizy
- 用户要求的是“各子包独立版本号”
- 当前仓库在 Windows 下实际暴露了 `relizy` 的 Unix 命令依赖问题

### 首个案例的策略结论

- `monorepo.versionMode` 采用 `independent`
- `monorepo.packages` 覆盖 `apps/*`、`old/*`、`packages/*`、`configs/*`
- 当用户要求“全部工作区包都纳管”时，需要识别并移除相关包上的 `private: true`
- 生成根 `changelog.config.ts`
- 生成根 `relizy.config.ts`
- 在 README 中补齐 `pnpm release` 与原生命令说明
- 使用 `pnpm patchedDependencies` 接入 Windows 兼容补丁

### 首个案例的关键经验

#### 1. 不能误用 `selective`

若需求是“各包独立版本”，就必须使用 `independent`。  
`selective` 只是“只 bump 有变更的包”，不是“每个包独立版本线”。

#### 2. `private: true` 是纳管分界线

如果目标是覆盖全部 workspace 包，就不能忽略 `private: true`。  
技能必须把“列出受影响包 -> 请求确认 -> 移除字段”设计成显式流程。

#### 3. 主配置必须保持简洁

`relizy.config.ts` 应尽量模仿已验证仓库中的简洁写法，例如：

```ts
import { defineConfig } from "relizy";
import changelogConfig from "./changelog.config";

export default defineConfig({
	projectName: "EAMS Frontend Monorepo",
	types: changelogConfig.types,
	templates: {
		...(changelogConfig.templates ?? {}),
		changelogTitle: "{{newVersion}} ({{date}})",
	},
	monorepo: {
		versionMode: "independent",
		packages: ["apps/*", "old/*", "packages/*", "configs/*"],
	},
	changelog: {
		rootChangelog: true,
		includeCommitBody: true,
		formatCmd: "pnpm run format:changelog",
	},
});
```

#### 4. 类型兼容优先下沉

如果 `changelogen` 与 `relizy` 的 `types` 声明边界不一致，应优先在 `changelog.config.ts` 或辅助层做兼容，不要把复杂类型样板堆在 `relizy.config.ts` 中。

#### 5. Windows 兼容需要真实验证

在该仓库中，真正暴露的问题是：

- `relizy` 的独立模式内部依赖 `grep`
- 依赖 `head`
- 依赖 `sed`

因此技能不能只写配置，还必须提供兼容分支。

### 首个案例的最小验证基线

以下命令应被明确写进案例中：

```bash
pnpm exec relizy --help
pnpm exec relizy changelog --dry-run
pnpm exec relizy release --dry-run --no-publish --no-provider-release --no-push --no-commit --no-clean --yes
```

并说明：

- 如果输出为 `No packages to bump`
- 且没有跨平台命令缺失或配置报错

则应判定为“接入验证通过但当前仓库暂无可 bump 内容”，而不是配置失败。

## 待确认清单模板

未来执行该技能时，建议固定询问以下关键问题：

1. 你要 `independent` 还是 `selective`？
2. 是否要覆盖全部 workspace 包？
3. 是否允许移除 `private: true`？
4. 是否允许自动写入 README 发版说明？
5. Windows 兼容问题优先走补丁还是 runner？
6. 是否需要根 changelog 与子包 changelog 同时生成？
7. 是否暂时跳过 `npm publish` 与 provider release？

## 未来技能的落地位置建议

建议在 `gh.ruancat.monorepo` 内未来落成以下结构：

- `.claude/skills/init-relizy-monorepo/SKILL.md`
- `.claude/skills/init-relizy-monorepo/templates/workspace-discovery.md`
- `.claude/skills/init-relizy-monorepo/templates/package-eligibility.md`
- `.claude/skills/init-relizy-monorepo/templates/config-writer.md`
- `.claude/skills/init-relizy-monorepo/templates/runtime-compat.md`
- `.claude/skills/init-relizy-monorepo/templates/docs-sync.md`
- `.claude/skills/init-relizy-monorepo/references/eams-frontend-monorepo.md`

如需兼容本仓库的 `.agent/.agents` 技能目录镜像，也应同步生成对应副本。

## 实施任务拆分

### 任务 1：定义主技能骨架

- 新建 `init-relizy-monorepo` 技能目录
- 编写技能目标、触发条件、输入输出
- 明确它是执行型技能，而不是只输出建议

### 任务 2：编写侦察模板

- 固定读取哪些文件
- 如何整理工作区信息
- 如何识别已有发版工具
- 如何输出待确认清单

### 任务 3：编写决策模板

- `versionMode` 判定
- 包纳管判定
- `private: true` 处理流程
- 类型兼容策略
- Windows 兼容策略

### 任务 4：编写配置写入模板

- `changelog.config.ts`
- `relizy.config.ts`
- 根脚本更新
- README 注入段落
- `pnpm-workspace.yaml` 补丁接入

### 任务 5：沉淀 EAMS 案例

- 把 `eams-frontend-monorepo` 的真实落地方案写成 reference
- 记录为什么选 `independent`
- 记录为什么移除 `private: true`
- 记录 Windows 补丁接入方式

### 任务 6：跨仓验证

- 在 `eams-frontend-monorepo` 中验证该 skill 设计是否覆盖真实复杂度
- 后续选择第二个仓库做对照验证
- 评估哪些分支应抽象成模板，哪些保留为仓库特有逻辑

## 验收标准

当满足以下条件时，可认为该 skill 达到可用状态：

- 能对任意 `pnpm` monorepo 做基础侦察
- 能明确列出工作区范围与可纳管包
- 能在用户确认后直接写入 `relizy` 配置
- 能处理 `private: true` 带来的纳管分歧
- 能处理至少一种 Windows 兼容策略
- 能把命令说明同步进 README
- 能输出 dry-run 验证命令与结果解释
- 能以 `eams-frontend-monorepo` 作为首个案例跑通整个工作流

## 风险与后续关注点

- `relizy` 上游若修复 Windows 兼容问题，技能中的补丁策略应及时降级或移除。
- 不同仓库可能对“是否允许移除 `private: true`”有不同容忍度，必须保留确认点。
- 某些仓库可能已有 changesets、changelogen、standard-version 等工具，技能要避免粗暴覆盖。
- 如果仓库根 TypeScript 检查严格，配置文件本身的类型适配策略必须更谨慎。

## 结论

该工作流 skill 最适合采用“主技能 + 子模板型”设计。  
主技能负责仓库侦察、决策树和执行流程，子模板负责把具体差异点转成稳定的落地片段。  
`eams-frontend-monorepo` 已经提供了一个足够复杂且真实的首个案例，尤其适合作为：

- `independent` 版本模式的基线
- 全工作区纳管的基线
- `private: true` 处理的基线
- Windows 兼容补丁接入的基线
- README 同步与 dry-run 验证的基线

后续实现该技能时，应优先把“仓库侦察、策略确认、配置写入、平台兼容、README 同步、dry-run 验证”六部分固定下来，再逐步扩展到更多 monorepo 案例。
