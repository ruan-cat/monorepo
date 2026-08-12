# 2026-08-12 init-prettier-git-hooks v3 设计

## 背景

`init-prettier-git-hooks` v2 把一次缺少完整运行矩阵的中间判断固化成了技能契约：它要求导入 `prettier-plugin-lint-md` 对象，并以 `plugins: [prettierPluginLintMd]` 注册。这个写法能通过普通 Prettier CLI 和部分 VSCode 场景，却会被 `--experimental-cli` 的字符串插件边界拒绝。与此同时，依赖声明 `^1.0.1` 会解析到 `1.0.3`；该版本的 CJS 主入口又会使 VSCode `esbenp.prettier-vscode` 的字符串加载链路静默失效。

v3 是一次破坏性纠偏。它不保留 v2 的对象插件兼容层，也不把被推翻的判断继续包装成可选方案。

## 最高优先级契约

1. `prettier-plugin-lint-md` 必须精确锁定为 `1.0.1`。依赖声明、lockfile 解析结果和运行时解析结果必须一致；`^1.0.1`、`~1.0.1`、`1.0.3` 均不合格。
2. Prettier 配置必须在顶层使用字符串插件声明：

   ```js
   plugins: ["prettier-plugin-lint-md"],
   ```

   禁止顶层对象导入，禁止只在 Markdown override 中注册插件。

这两条是普通 CLI、`--experimental-cli` 与 VSCode 三条加载链路共同成立的前提，不能为了单条链路的局部通过而放宽。

## 技能形态

继续采用“AI 审计流程 + 五份纯配置模板”的轻量形态，不重新引入迁移 CLI、`scripts/`、`src/`、事务层或证明文件。AI 必须先确认配置所有权和 Git 状态，再定点修改。依赖安装、Hook 安装、暂存区归一化等副作用仍需用户授权。

技能新增 `references/` 作为长期知识保留层。`SKILL.md` 只保留当前可执行契约、决策入口和验收门禁；历史错误、版本差异、运行时加载模型、pnpm 隔离和事故分流写入引用目录。历史结论不得静默覆盖，必须标明“现行”“已废弃”或“背景”。

## 配置与命令设计

`templates/prettier.config.mjs` 删除 lint-md 的 default import，顶层 `plugins` 改为字符串。该属性上方必须保留完整 JSDoc，按“版本漂移与 CJS 入口 -> 顶层对象失败 -> override 对象失败 -> 现行双核心契约 -> 三链路验证”记录历史演进；JSDoc 是受保护知识块，不得压缩成一句话或普通行注释。`@prettier/plugin-oxc` 仍可在对应 override 中使用对象，因为本次事故只约束 lint-md 的跨入口加载。

所有活动的 `--experimental-cli` 命令继续带且只带一个 `--no-parallel`，防止 Windows/Node 环境中的 worker 崩溃。experimental CLI 与普通 CLI 的参数名、配置发现方式和插件加载入口必须分开说明；不得用一条“Prettier CLI 已通过”概括两条链路。

此前只验证“显式 `--plugin` 能工作”，就把它误写成活动命令要求；补充的根 cwd、嵌套 cwd 与绝对路径 A/B 实验显示不传参数时输出完全一致。因此生产命令不重复传 `--plugin`；该参数只保留为解析故障的诊断/隔离手段。

## 历史知识保留

`references/` 至少包含：

- `README.md`：索引、状态标签和阅读顺序。
- `decision-evolution.md`：从 pnpm 解析、CRLF、worker 崩溃、对象方案到最终纠偏的完整决策链；明确记录错误中间结论很快被完整矩阵推翻。
- `runtime-loading-model.md`：普通 CLI、experimental CLI、VSCode/esbenp 的入口差异。
- `version-matrix.md`：`1.0.1` 与 `1.0.3` 的包入口和行为边界。
- `pnpm-resolution.md`：严格隔离、hoist 与“找不到包”和“找到错误入口”的区别。
- `crlf-and-hook-incidents.md`：LF 四层治理、`--no-parallel` 和 Hook/暂存区副作用。
- `verification-playbook.md`：三条运行链路、版本三层一致性与真实 Markdown 输出断言。

对外分发引用不得包含本机绝对路径、内部报告路径、内部测试路径或 Memorix 编号。内部证据转写为可复用的现象、根因、错误诱因、现行规则和验证方式。

## 测试策略

先修改现有 Vitest 契约，令 v2 在以下断言上失败：

- 元数据版本为 `3.0.0`。
- 文档和模板精确要求 `prettier-plugin-lint-md@1.0.1`。
- 模板存在顶层字符串插件，不存在 lint-md import 或对象引用。
- 模板的 lint-md 顶层声明前存在紧邻的完整 JSDoc，覆盖版本、对象、override、三链路和真实输出验证历史。
- `references/` 的规定文件完整，且历史中间方案被明确标为废弃。
- 所有 experimental CLI 活动命令含一个 `--no-parallel`，且不重复传入 lint-md `--plugin`；验证剧本另行覆盖显式参数 A/B。
- 对外内容没有本机路径或内部证据路径污染。

GREEN 阶段改写技能和模板，使静态契约通过。随后用隔离探针验证依赖元数据与真实 Markdown 输出；不能只运行 `prettier --check`，因为插件未加载时也可能得到误导性的绿色结果。VSCode 完整 Extension Host 若无法自动启动，至少要以本机扩展的等价解析链路验证并清楚标注证据边界。

## 分发文档

同步更新 `ai-plugins/common-tools/README.md` 的 v3 说明和 `CHANGELOG.md` 的 Unreleased 条目。v2 历史保留在 changelog 中，但必须注明其对象插件判断已由 v3 废弃。本轮不改插件市场版本、不发布、不提交。

## 验收标准

- 两条最高优先级契约在 `SKILL.md`、模板、测试和分发说明中一致。
- v2 的 lint-md 对象导入契约已破坏性删除，没有兼容分支或模糊措辞。
- 历史错误已进入 `references/`，状态清楚且没有内部路径污染。
- Vitest 定向测试、Markdown/格式检查、`git diff --check` 和路径污染扫描通过。
- 主代理亲自复核最终 diff，写集不包含用户已有修改。
