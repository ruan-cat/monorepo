# @ruan-cat/vite-plugin-ts-alias

<!-- automd:badges color="yellow" name="@ruan-cat/vite-plugin-ts-alias" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vite-plugin-ts-alias?color=yellow)](https://npmjs.com/package/@ruan-cat/vite-plugin-ts-alias)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vite-plugin-ts-alias?color=yellow)](https://npm.chart.dev/@ruan-cat/vite-plugin-ts-alias)

<!-- /automd -->

将 tsconfig.paths 配置转换成 vite 的 alias 路径别名。

> [!CAUTION]
> 这个包是基于 [Codpoe/vite-plugin-ts-alias](https://github.com/Codpoe/vite-plugin-ts-alias) 仓库的代码进行修改和增强的，**不是作者原创的包**。
>
> **主要改进**：
>
> - ✅ 增加了更详细的错误提示
> - ✅ 优化了类型定义
> - ✅ 改进了错误处理机制
>
> **原始仓库**：[Codpoe/vite-plugin-ts-alias](https://github.com/Codpoe/vite-plugin-ts-alias)

## 安装

<!-- automd:pm-install name="@ruan-cat/vite-plugin-ts-alias" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/vite-plugin-ts-alias

# npm
npm install -D @ruan-cat/vite-plugin-ts-alias

# yarn
yarn add -D @ruan-cat/vite-plugin-ts-alias

# pnpm
pnpm add -D @ruan-cat/vite-plugin-ts-alias

# bun
bun install -D @ruan-cat/vite-plugin-ts-alias

# deno
deno install --dev npm:@ruan-cat/vite-plugin-ts-alias
```

<!-- /automd -->

> [!NOTE]
> 需要确保项目中已安装 `vite`。

## 使用方法

### 基本用法

```typescript
import { defineConfig } from "vite";
import { tsAlias } from "@ruan-cat/vite-plugin-ts-alias";

export default defineConfig({
	plugins: [tsAlias()],
});
```

### 自定义 tsconfig 文件名

```typescript
import { defineConfig } from "vite";
import { tsAlias } from "@ruan-cat/vite-plugin-ts-alias";

export default defineConfig({
	plugins: [
		tsAlias({
			tsConfigName: "tsconfig.path.json",
		}),
	],
});
```

## 功能特性

- 🔄 **自动转换**: 自动读取 tsconfig.json 中的 paths 配置并转换为 vite alias
- 📁 **路径解析**: 支持相对路径和绝对路径的解析
- ⚡ **性能优化**: 在 vite 构建的 pre 阶段执行，确保路径别名正确解析
- 🛠️ **类型安全**: 完整的 TypeScript 类型支持

## 配置说明

### tsconfig.json 示例

```json
{
	"compilerOptions": {
		"baseUrl": ".",
		"paths": {
			"@/*": ["src/*"],
			"@components/*": ["src/components/*"],
			"@utils/*": ["src/utils/*"]
		}
	}
}
```

### 转换结果

上述配置会被转换为以下 vite alias：

```typescript
{
  "@": "/path/to/your/project/src",
  "@components": "/path/to/your/project/src/components",
  "@utils": "/path/to/your/project/src/utils"
}
```

## API

### tsAlias(options?)

#### 参数

- `options` (可选): 配置选项
  - `tsConfigName` (可选): tsconfig 文件名，默认为 `'tsconfig.json'`

#### 返回值

返回一个 vite 插件对象。

## 注意事项

1. 这是一个开发环境依赖，建议使用 `-D` 参数安装到 `devDependencies` 中
2. 确保你的 tsconfig.json 中配置了 `baseUrl` 和 `paths`
3. 插件会在 vite 的 `pre` 阶段执行，确保路径别名在构建开始前就被正确设置
4. 如果找不到 tsconfig.json 或缺少必要的配置，插件会输出错误信息但不会中断构建

## 许可证

MIT
