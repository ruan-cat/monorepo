# GitHub PR 云端格式化参考

## 设计来源与迁移边界

sxzz 系列 Node 项目的可复用 `setup-js` composite action 将环境初始化拆成四步：checkout、`pnpm/action-setup`、`actions/setup-node`（含 pnpm cache）和依赖安装。模板直接使用 `sxzz/workflows/setup-js@main`，不再复制其内部步骤，也不引用任何目标仓库的本地 monorepo composite action。

## 推荐工作流

将 [../templates/cloud-pr-prettier.yml](../templates/cloud-pr-prettier.yml) 复制到目标项目的 `.github/workflows/` 后，按项目实际脚本和权限审查。模板使用 `pull_request`，只对同仓 PR 写回；fork PR 不进入写回 job。`pull_request_target` 不得作为替代方案，因为它会把目标分支权限暴露给不受信任的 PR 代码。

## 初始化规则

- `sxzz/workflows/setup-js@main` 负责 pnpm、Node 与 pnpm cache 初始化；模板传入 `fetch-all: "true"`、`persist-credentials: "true"` 和可由仓库变量覆盖的 Node 版本。
- `setup-js` 当前没有 PR head `ref` 输入。为避免其内部 checkout 的 merge 提交被推回来源分支，模板将 `auto-install` 设为 `false`，随后显式 checkout PR head，再在该 head 上执行一次依赖安装。需要比较基线时通过事件中的 `base.sha` 获取。
- 模板在安装前检查 `package.json`、`pnpm-lock.yaml` 与 `package.json#packageManager` 的 `pnpm@` 声明；这些是可复现的独立运行前提。若缺失 lockfile，应先停下来让维护者决定是否允许非 frozen 安装。
- Node 版本优先读取 `package.json#engines.node`、`.nvmrc` 或项目约定；`lts/*` 只作为无法识别时的保守默认值。
- 对生产工作流固定 action 到经过审查的不可变 SHA，并在行尾保留可读版本注释；升级时重新审查 SHA 与权限。

## 差异格式化与写回

工作流应使用 `git diff --name-only -z "$BASE_SHA...HEAD"` 获取 PR 新增/修改文件，再按扩展名筛选并逐个运行本地 Prettier。NUL 分隔读取是为了保留空格和非 ASCII 文件名。格式化文件列表必须同时用于 `git add`、`git diff --cached --check` 和变更判断；禁止使用 `git add .` 吞入无关文件。

提交前必须确认：

1. 只有格式化后的 PR 文件进入 index。
2. `git diff --cached --check` 通过。
3. 有 staged diff 才提交，否则 job 成功结束但不产生空提交。
4. 推送目标是 `HEAD:${{ github.event.pull_request.head.ref }}`，且仅在 head 仓库等于当前仓库时执行。

## 失败分流

- `pnpm install` 失败：先检查 lockfile、`packageManager`、Node 版本和 registry，不要直接删除 lockfile 或关闭 frozen。
- fork PR 无法推送：这是预期安全边界；保留只读格式检查结果，不申请更宽权限。
- Prettier 没有产生 lint-md 变化：按主技能的三层版本和双 CLI 验证剧本排查，不要通过对所有文件执行格式化来掩盖插件未加载。
- workflow YAML 能解析但无法推送：分别核对 job 条件、`contents: write`、checkout 凭据和 head ref；成功构建不等于拥有 PR 写权限。
