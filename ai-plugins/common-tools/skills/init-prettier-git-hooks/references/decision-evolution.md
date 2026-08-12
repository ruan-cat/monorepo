# 错误历史与决策演进

这份时间线保留曾经的错误判断，目的不是为旧方案提供兼容入口，而是让后续维护者知道它们为什么看似合理、又为什么必须废弃。

## 阶段一：先解决依赖可见性

**背景。** pnpm 严格隔离使某些编辑器或子包无法从预期位置解析 Prettier 插件。于是形成了 public hoist 经验。

**当时的短视。** 将“插件可被解析”视为“插件能正确运行”，没有继续核对实际版本、入口和插件选项。

**纠偏。** hoist 只处理找不到包；找到错误版本或错误 CJS/ESM 入口必须继续分流。

## 阶段二：把 CRLF 与格式化基础设施绑定

**背景。** Windows 工作区长期出现 CRLF、index LF 和幽灵 modified，形成 `.gitattributes`、`.editorconfig`、Prettier、编辑器设置的分层治理。

**当时的短视。** 当 Markdown 结果不变化时，容易继续调整行尾和 Hook，而没有先证明 lint-md 是否加载。

**纠偏。** CRLF 是字节与 index 问题；lint-md 是版本、插件声明和加载入口问题。两条故障树必须分开。

## 阶段三：experimental CLI worker 崩溃

**背景。** experimental CLI 并行 worker 在提交钩子中出现 `WorkTankWorkerError`。

**第一次修复。** 在 lint-staged 命令中加入 `--no-parallel`。

**遗漏。** 曾错误允许全量 format 保留并行，使相同 worker 风险仍可从另一活动命令进入。

**现行。** 所有 experimental CLI 活动命令均带且只带一个 `--no-parallel`。

## 阶段四：1.0.3 与 VSCode 静默失效

**背景。** 依赖范围从 `1.0.1` 漂移到 `1.0.3`。新版本引入 CJS 主入口，VSCode 的字符串加载链路可以完成格式化动作，却没有真正注册 lint-md 选项。

**错误诱因。** 静默失效没有抛异常；普通 CLI 又仍能工作，于是问题被误判为“字符串插件不可靠”。

**错误决策。** 改为 default import 并把插件对象放在顶层。该方案让普通 CLI 和 VSCode 局部恢复，因此被过早固化进 v2。

## 阶段五：对象方案被 experimental CLI 推翻

**事实。** experimental CLI 的 plugin specifier 只接受字符串，顶层对象会加载失败。

**中间错误方案。** 为规避对象失败，曾把顶层 plugins 留空，再把对象仅放进 Markdown override。这个方案能绕开 experimental CLI 的顶层对象检查，却让 VSCode 从顶层发现不到插件。

**为什么这是关键教训。** 该中间判断在很短时间内就被下一轮跨入口验证推翻，但此前的单一链路报告和技能测试没有建立完整矩阵，导致错误可以持续跨项目传播。

## 阶段六：曾经的过度修复：把诊断参数写进生产命令

**错误决策。** 在只证明“显式 `--plugin` 能工作”后，把它加入 `format` 和 `lint-staged` 默认命令，并误称为 experimental CLI 的健壮性补丁。

**缺失证据。** 没有做“不传参数”的对照，也没有验证 lint-staged 从根 cwd 启动时是否能向上发现根配置。

**A/B 纠偏。** 根 cwd、嵌套 cwd、Prettier 接收绝对 Markdown 路径三组等价验证均表明：不传 `--plugin` 与显式传入的输出一致。lint-staged 源码也显示默认 cwd 是调用时的 `process.cwd()`，从仓库根执行时会把该 cwd 传给任务。因此显式参数是重复声明，并增加了命令对 cwd 插件解析的耦合。

## 阶段七：v3 的最终收敛

完整矩阵把问题压缩为两条现行契约：

1. 精确锁定 `prettier-plugin-lint-md@1.0.1`，同时验证声明、lockfile 和运行时解析。
2. 使用顶层字符串 `plugins: ["prettier-plugin-lint-md"]`。

experimental CLI 默认只保留 `--no-parallel`；显式 `--plugin prettier-plugin-lint-md` 仅用于诊断/隔离 A/B，不改变顶层字符串契约。

## 已废弃判断清单

- “对象插件是唯一兼容写法”。
- “仅放 Markdown override 可以同时兼容 experimental CLI 和 VSCode”。
- “`^1.0.1` 等价于锁定 `1.0.1`”。
- “普通 CLI 通过即可代表全部运行入口通过”。
- “`prettier --check` 通过即可证明 lint-md 已加载”。
- “依赖能 resolve 就已经排除 pnpm 问题”。
- “只需在 lint-staged 关闭 parallel，format 可以保留并行”。
- “静态文案测试全绿即可证明技能可用”。

## 仍然保留的 v2 正确边界

- AI 先审计配置所有权和 Git 状态，再做定点修改。
- 用户已有改动默认受保护。
- 依赖安装、Hook 安装、lint-staged、renormalize 和真实提交验证按副作用授权。
- 不重新膨胀为迁移 CLI、事务框架或运行时代码。
- LF 分层治理、Hook 冲突停止和事故注释继续保留。
