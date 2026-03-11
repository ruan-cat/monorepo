# move-vercel-output-to-root

这个脚本用于解决 Vercel 在 pnpm workspace monorepo 中部署子包时的 `.vercel/output` 路径冲突问题。

问题本质：

1. Vercel 需要在 monorepo 根目录执行依赖安装，才能正确识别 `workspace:*` 依赖。
2. Nitro / Nuxt / 其他子包构建时，通常会把 `.vercel/output` 生成在子包目录内。
3. Vercel 最终又要求在 monorepo 根目录下读取 `.vercel/output`。

因此需要在子包构建结束后，把当前子包的构建产物搬运到 monorepo 根目录。

## 默认行为

在子包目录内执行：

```bash
tsx @ruan-cat/utils/move-vercel-output-to-root
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
		"build:vercel": "nuxi build --preset vercel && tsx @ruan-cat/utils/move-vercel-output-to-root"
	}
}
```

## dry-run 示例

```bash
tsx @ruan-cat/utils/move-vercel-output-to-root --dry-run
```

## 显式指定路径示例

```bash
tsx @ruan-cat/utils/move-vercel-output-to-root --root-dir ../../.. --source-dir .vercel/output --target-dir .vercel/output
```
