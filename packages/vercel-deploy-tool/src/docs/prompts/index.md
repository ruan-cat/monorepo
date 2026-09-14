---
order: 8000
---

# 提示词文件

## 01 <!-- 已完成 --> 让部署行为改成，基于实际构建而触发部署的部署行为

请你阅读这些配置文件：

- vercel-deploy-tool.config.ts
- turbo.json
- package.json
- .github\workflows\ci.yaml

切换到主分支 main 后，会开始部署。但是现在是基于 static 静态资源部署，可是很多情况下。对应的子包根本就没有出现任何有意义的更改，也在 github workflow build 并且开始部署了。

我允许 github workflow 对全部的子包做 build，做文档的 build，这是全面校验的规范。但是文档构建后，还是被部署了。这造成了 vercel 部署额度的极大浪费。

我需要你设计一个合适的方案，去精确设计，识别那些文档需要被部署，那些则不需要。希望根据 git 修改内容和范围，来实现看情况部署。

## 02 <!-- 已完成 2026-9-14 WorkBuddy 正在做 --> 获得旧有部署大批量删减的能力

你认为我们的 D:\code\ruan-cat\monorepo\packages\vercel-deploy-tool 要怎么才能获取到这样的旧部署删除能力呢？比如我用这个 @ruan-cat/vercel-deploy-tool 去部署项目时，这个工具可以提供那些合理的配置呢？我希望 @ruan-cat/vercel-deploy-tool 可以增加一个配置，实现部署后及时的删除掉多余，存续的 vercel 部署。比如默认保留 10 个 vercel 生产环境部署，保留 5 个 preview 预览环境的 vercel 部署。通过开关开启这个部署后及时删除旧部署的功能。

在 `packages\vercel-deploy-tool\src\docs\superpower` 目录内设计你的 spec 和 plan 文档，实现旧部署的大批量删除。

1. `packages\vercel-deploy-tool` 要增加新的功能了，做好 `packages\vercel-deploy-tool\src\docs` 新增合适说明文档的设计。
2. 做好 `packages\vercel-deploy-tool\tests` 的测试用例设计。
3. 设计一个合适的字段，实现 vercel 部署存储的删改。默认不开启这个字段。这个字段提供配置改写。默认使用 vercel cli 来实现删改。
4. 你看清楚 vercel cli 要实现这个配置改动时，所需要的最低版本的 vercel cli。在 `packages\vercel-deploy-tool\package.json` 的 peerDependencies 内做好版本范围划分。

---

我认同 `packages\vercel-deploy-tool\src\docs\superpower\2026-09-09-cleanup-old-deployments-design.md` 和 `packages\vercel-deploy-tool\src\docs\superpower\2026-09-09-cleanup-old-deployments-plan.md` ，请你继续。

---

del/mkdirp/cpy 你认为是 `packages\vercel-deploy-tool\package.json` 项目的历史债务么？你认为这些配置和过往的实现手段，要不要永久性的删除啊？

1. package.json 不要手动 2.1.0 。
2. 编写 `.changeset\2026-09-09-cleanup-old-deployments.md` 是对的。就要用 changeset 来控制 `packages\vercel-deploy-tool\package.json` 的版本。我稍后会要求你用 github MCP 或者是 gh cli 完成 git push、rebase2main、merge pr（单纯的 rebase merge 的形式，不新增 merge 节点）、和删除临时 remote branch 的行为；我们走一系列的 github workflow 的方式来完成正式的 changeset 发版。

---

你产生了很多无意义的 javascript 缓存文件，请你及时清理掉；避免污染 git 工作区；避免误判。

---

我现在要求你这样做，完成发版的闭环：

用 github MCP 或者是 gh cli 完成：

1. git push
2. rebase2main
3. merge pr（单纯的 rebase merge 的形式，不新增 merge 节点）
4. 删除临时 remote branch 的行为；我们走一系列的 github workflow
5. 完成正式的 changeset 发版。

在这个过程内，注意监听检查清楚基于 main 分支更改的 vercel 流水线，检查是否完成了文档部署， `https://vercel-deploy-tool.ruancat6312.top` 文档站点是否能在 agent browser 内正常完成浏览器访问，新编写的 markdown 是否在文档站点内能正常看到。github workflow 是否能正常完成发版。npm 镜像源能不能检索到最新 publish 发布的包。

---

1. 你刚才新建了 worktree 来临时处理很脏的 pnpm 锁文件的问题，你是否及时的删除了 git worktree 的工作目录和文件，避免出现恶心的残留。我怕你遗漏遗忘了。
2. .prettierignore 要不要加上 pnpm-lock.yaml 锁文件的格式化忽略啊？我觉得是要的，可以有效避免无意义的格式化造成的 git 提交噪音。
3. lint-staged.config.js 还有什么更加优雅的手段来避免对 pnpm-lock.yaml 锁文件做多余的格式化么？

偏好单一事实源， lint-staged.config.js 改回去。

---

因工作区 pnpm-lock.yaml 被其他 agent 占用无法 ff pull——等那个会话收口后 git pull --ff-only 即可对齐
这个问题你解决了么？

---

packages\skill-router-mcp\runtime\build-info.generated.ts 是有意义的，必要的更改么？还是说这个是无意义的？

## 03 <!-- TODO: -->
