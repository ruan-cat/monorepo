# 生成工作区文件

本库用于生成工作区文件。

## 使用方式

### 函数用法

```ts
// scripts/generate.code-workspace.ts
import { generateCodeWorkspace } from "@ruan-cat/generate-code-workspace";
generateCodeWorkspace("monorepo单仓");
```

```json
{
	"scripts": {
		"code-workspace:create": "node --import=tsx ./scripts/generate.code-workspace.ts"
	}
}
```

### 命令行传参

```ts
// scripts/generate.code-workspace.ts
import "@ruan-cat/generate-code-workspace";
```

```json
{
	"scripts": {
		"code-workspace:create": "node --import=tsx ./scripts/generate.code-workspace.ts --name=monorepo单仓"
	}
}
```

## 更新日志

[CHANGELOG.md](./CHANGELOG.md)
