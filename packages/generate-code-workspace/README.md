# 生成工作区文件

<!-- automd:badges color="yellow" name="@ruan-cat/generate-code-workspace" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/generate-code-workspace?color=yellow)](https://npmjs.com/package/@ruan-cat/generate-code-workspace)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/generate-code-workspace?color=yellow)](https://npm.chart.dev/@ruan-cat/generate-code-workspace)

<!-- /automd -->

本库用于生成工作区文件。

## 安装

```bash
pnpm i -D @ruan-cat/generate-code-workspace tsx
```

本库应当作为开发环境依赖。

本库将使用 `tsx` 完成对 ts 脚本的运行，故需要安装 `tsx` 作为对等依赖。

## 使用方式

### 函数用法

<details>

<summary>
函数用法
</summary>

```ts
// scripts/generate.code-workspace.ts
import { generateCodeWorkspace } from "@ruan-cat/generate-code-workspace";
generateCodeWorkspace("monorepo单仓");
```

```json
{
	"scripts": {
		"code-workspace:create": "tsx ./scripts/generate.code-workspace.ts"
	}
}
```

</details>

### 命令行传参

```ts
// scripts/generate.code-workspace.ts
import "@ruan-cat/generate-code-workspace";
```

```json
{
	"scripts": {
		"code-workspace:create": "tsx ./scripts/generate.code-workspace.ts --name=monorepo单仓"
	}
}
```

## 更新日志

[CHANGELOG.md](./CHANGELOG.md)

<!-- 尝试触发部署 -->
