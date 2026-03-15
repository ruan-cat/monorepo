# move-vercel-output-to-root

这个脚本用于解决 Vercel 在 pnpm workspace monorepo 中部署子包时的 `.vercel/output` 路径冲突问题。

问题本质：

1. Vercel 需要在 monorepo 根目录执行依赖安装，才能正确识别 `workspace:*` 依赖。
2. Nitro / Nuxt / 其他子包构建时，通常会把 `.vercel/output` 生成在子包目录内。
3. Vercel 最终又要求在 monorepo 根目录下读取 `.vercel/output`。

因此需要在子包构建结束后，把当前子包的构建产物搬运到 monorepo 根目录。

## ⚠️ 重要：必须使用 bin 命令调用

> [!CAUTION]
> **禁止**使用 `tsx @ruan-cat/utils/move-vercel-output-to-root` 方式调用本脚本。
>
> 这种写法会导致 `ERR_MODULE_NOT_FOUND` 错误。原因是 `tsx`/`node` 等运行时的 CLI 参数只解释为**文件系统路径**，不会触发 `node_modules` 内 `package.json` 的 `exports` 模块解析。
>
> 详见：[避坑指南：为什么 tsx 执行 NPM 包导出的脚本会报错 ERR_MODULE_NOT_FOUND？](https://ruan-cat.github.io/notes/ruan-cat-notes/docs/tsx/tsx-cli-module-resolution-trap.html)

本包通过标准的 `bin` 字段提供可执行命令，安装 `@ruan-cat/utils` 后即可直接调用。

## 使用方式

### 方式一：通过快捷命令（推荐）

安装本包后，`move-vercel-output-to-root` 命令自动注册到 `node_modules/.bin`：

```bash
npx move-vercel-output-to-root
```

### 方式二：通过统一入口命令

```bash
npx ruan-cat-utils move-vercel-output-to-root
```

两种方式完全等价。

## 默认行为

在子包目录内执行命令：

```bash
npx move-vercel-output-to-root
```

脚本会自动执行以下行为：

1. 以当前工作目录作为子包目录。
2. 向上查找 `pnpm-workspace.yaml`，定位 monorepo 根目录。
3. 读取当前子包的 `.vercel/output` 作为源目录。
4. 清空 monorepo 根目录下的 `.vercel/output`。
5. 将源目录内容复制到 monorepo 根目录下的 `.vercel/output`。

## 可选参数

```text
--root-dir <path>    显式指定 monorepo 根目录
--source-dir <path>  指定子包内构建产物目录，默认 .vercel/output
--target-dir <path>  指定根目录内目标目录，默认 .vercel/output
--skip-clean         跳过目标目录清理
--dry-run            仅打印路径解析结果，不执行复制
-h, --help           查看帮助信息
```

说明：

- `--root-dir` 相对路径基于当前子包目录解析。
- `--source-dir` 相对路径基于当前子包目录解析。
- `--target-dir` 相对路径基于 monorepo 根目录解析。

## 子包 package.json 示例

```json
{
	"scripts": {
		"build:vercel": "nuxi build --preset vercel && move-vercel-output-to-root"
	}
}
```

也可以在 Vercel 或 Turbo 的构建链中搭配使用：

```json
{
	"scripts": {
		"build:prod:vercel": "nuxi build --preset vercel && move-vercel-output-to-root"
	}
}
```

## dry-run 示例

```bash
npx move-vercel-output-to-root --dry-run
```

## 显式指定路径示例

```bash
npx move-vercel-output-to-root --root-dir ../../.. --source-dir .vercel/output --target-dir .vercel/output
```

## 编程式调用

如果你需要在 TypeScript/JavaScript 代码中调用本脚本的功能，可以通过以下方式引用：

```typescript
// 通过 node-esm 导出引用
import { moveVercelOutputToRoot } from "@ruan-cat/utils/node-esm";

moveVercelOutputToRoot({
	dryRun: true,
});
```

> [!NOTE]
> 本包已移除 `exports` 中的 `"./move-vercel-output-to-root"` 导出入口。
> CLI 调用请使用 `bin` 命令，编程式调用请通过 `@ruan-cat/utils/node-esm` 导出访问。
