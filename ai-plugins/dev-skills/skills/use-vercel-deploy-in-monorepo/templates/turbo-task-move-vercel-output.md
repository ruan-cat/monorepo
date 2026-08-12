# Turbo 任务模板索引

> 本目录模板仅表达任务依赖和产物缓存。包级 `turbo.json` 定义原子任务；根 `package.json` 只调用最终任务，避免同名脚本和任务互相递归。

## 模式 A：根目录 `.vercel/output`

目标子包选择一个框架模板，并在根目录运行：

```json
{
	"scripts": {
		"build:vercel": "turbo run <final-task> --filter=<target-package>"
	}
}
```

`<final-task>` 是该框架的搬运任务：

- [turbo-task-nitro.json](turbo-task-nitro.json)：`move-vercel-output-to-root`
- [turbo-task-nuxt.json](turbo-task-nuxt.json)：`move-vercel-output-to-root`
- [turbo-task-vite.json](turbo-task-vite.json)：`move-vercel-output-to-root`
- [turbo-task-uniapp-h5.json](turbo-task-uniapp-h5.json)：`move-h5-output-to-root`

每个最终任务依赖本包 `build`，并声明 `$TURBO_ROOT$/.vercel/output/**`；因此根 `.vercel/output` 是最终产物，而不是各包脚本串接出来的副作用。

默认搬运任务不传 `--dereference`，以保留既有符号链接复制语义。只有在确认模式 A、`.func` 符号链接导致 Vercel 函数拓扑或路由消费失败，并完成实体化后的根输出与 Git E2E 验收后，才在这个原子任务中显式加入可选标志：

```json
{
	"scripts": {
		"move-vercel-output-to-root": "move-vercel-output-to-root --dereference"
	}
}
```

`--dereference` 不修复 pnpm/Corepack 安装失败、Nitro 配置问题或运行时 5xx；这些问题必须在对应阶段分层排查。`--dry-run` 可用于显示最终路径和 `dereference` 解析值，但不能替代真实构建产物与 Vercel Git 验收。

## 跨包依赖选择

- 目标子包在 `package.json` 中已声明核心包依赖时，用 `^build`，由 workspace 依赖图解析。
- 只有当构建依赖未体现在 workspace 依赖图中、且已确认必须强制顺序时，才用 `<core-package>#build` 明确指定。
- 核心包的 `build` 应声明自身真实构建目录为 `outputs`；框架 `build` 声明自身 Vercel 或静态产物；搬运任务才声明根 `.vercel/output`。

## 模式 B 与独立仓库

模式 B 直接读取子包产物，不调用根搬运任务。独立仓库的单一步骤构建也不强制使用 Turbo；不要为了统一外观虚构根 `.vercel/output` 搬运链。
