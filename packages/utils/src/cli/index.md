# @ruan-cat/utils CLI

本包提供了命令行工具，通过 `package.json` 的 `bin` 字段注册，安装后即可直接调用。

## 安装

作为 monorepo 内的 workspace 依赖引用：

```json
{
	"devDependencies": {
		"@ruan-cat/utils": "workspace:^"
	}
}
```

或者作为 npm 包安装：

```bash
pnpm add -D @ruan-cat/utils
```

## 可用命令

安装后，以下 CLI 命令将自动注册到 `node_modules/.bin`：

1. `ruan-cat-utils` —— 统一入口命令，通过子命令分发执行。
2. `move-vercel-output-to-root` —— 直接执行搬运 Vercel 构建产物的专用快捷命令。

### 通过统一入口调用

```bash
npx ruan-cat-utils move-vercel-output-to-root [options]
```

### 通过快捷命令调用

```bash
npx move-vercel-output-to-root [options]
```

两种方式完全等价。

## 查看帮助

```bash
npx ruan-cat-utils --help
npx ruan-cat-utils move-vercel-output-to-root --help
```

## 在 package.json scripts 中使用

由于安装依赖后命令已注册到 `.bin`，可以直接在 `scripts` 中以命令名调用：

```json
{
	"scripts": {
		"move-output": "move-vercel-output-to-root --dry-run"
	}
}
```

## 设计说明

本 CLI 采用标准的 `bin` 字段方案，而非 `tsx <包名>` 的方式调用。

原因是 `tsx`、`ts-node`、`node` 等运行时的 CLI 参数只会被解释为**文件系统路径**，而不会触发 Node.js 的模块解析算法。因此 `tsx @ruan-cat/utils/move-vercel-output-to-root` 这种写法会报 `ERR_MODULE_NOT_FOUND` 错误——运行时会在当前工作目录拼接路径去查找文件，而不是去 `node_modules` 里根据 `exports` 字段解析模块。

标准的 `bin` 字段方案通过包管理器（pnpm/npm/yarn）在 `node_modules/.bin` 中创建可执行链接，完全绕过了这个问题。
