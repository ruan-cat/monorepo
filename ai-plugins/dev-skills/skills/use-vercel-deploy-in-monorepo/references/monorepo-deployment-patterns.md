# Monorepo 部署模式

## 先选一种一致的拓扑

### 模式 A：仓库根 `.vercel/output`

适用于根目录安装、根 Build Command 和根产物读取。子包构建后由独立的搬运任务生成仓库根 `.vercel/output`；Vercel 的 Root Directory、Install Command、Build Command 和 Output Directory 都必须以仓库根为口径。

### 模式 B：子包直接产物

适用于目标 Project 的 Root Directory、安装方式、构建命令和 Output Directory 均已验证采用目标子包口径的静态产物。不能把模式 B 的子包 Output Directory 与模式 A 的根 Build Command 混用。

## Turbo 任务图

跨包构建用 `dependsOn` 和 `outputs` 表达依赖，而不是用多步骤 shell 串接。典型顺序为：

```text
核心依赖包构建
  → 框架构建（Nitro/Vite/Nuxt/UniApp）
    → 根产物搬运
```

每个任务只做一个动作：核心任务输出自己的构建目录；框架任务依赖核心任务并声明框架产物；搬运任务依赖框架任务并声明根 `.vercel/output/**`。根命令仅运行最终 Turbo task 并过滤目标包，避免与根 task 同名递归。

职责必须分层：包级 `package.json` 提供原子 `build` 与搬运脚本，包级 `turbo.json` 声明 `dependsOn`/`outputs`，根 `package.json` 仅执行 `turbo run <final-task> --filter=<target-package>`。根脚本不得重复手写构建或搬运链，也不得与根 Turbo task 以同名方式互相调用。

跨包依赖已写入 workspace 依赖图时使用 `^build`；只有该关系无法由依赖图表达且已确认必须强制顺序时，使用 `<core-package>#build`。核心包、框架构建和根搬运的 outputs 必须分别对应各自真实产物。

可复制模板：

- [Nitro scripts](../templates/package-scripts-nitro.md) 与 [Nitro task](../templates/turbo-task-nitro.json)
- [Nuxt scripts](../templates/package-scripts-nuxt.md) 与 [Nuxt task](../templates/turbo-task-nuxt.json)
- [Vite scripts](../templates/package-scripts-vite.md) 与 [Vite task](../templates/turbo-task-vite.json)
- [UniApp H5 scripts](../templates/package-scripts-uniapp-h5.md) 与 [UniApp H5 task](../templates/turbo-task-uniapp-h5.json)
- [根搬运任务说明](../templates/turbo-task-move-vercel-output.md)
- [独立 Nitro 仓库](../templates/standalone-repo-nitro.md)

## 远端设置一致性

无论模式 A 或 B，都要在 Settings 的 GET 比较中同时核对 Root Directory、Build Command、Output Directory、Install Command 和 `nodeVersion`。Root Directory 是拓扑输入，默认不自动 PATCH；变更需用户明确授权并重新评估所有路径。

`vercel.json` 可覆盖远端构建设置。同一仓库多项目时，先审查根目录与 Root Directory 内的 `vercel.json`，确认它不会污染其他 Project，再做远端配置结论。
