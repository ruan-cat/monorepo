# Windows 构建与命令执行完整参考

## 问题概览

在 Windows + pnpm workspace 环境下，`shadcn-docs-nuxt` 文档站的构建和依赖安装有 3 类特有问题：

1. **构建"假卡死"**：`nuxt build` 长时间停在 Nitro 收尾阶段
2. **子进程残留**：中断构建后旧进程链不退出，与后续操作叠加
3. **EPERM 文件锁**：IDE 内置终端安装依赖时原生 `.node` 文件被锁

---

## 事故 1：Nitro 构建"假卡死"

### 现象

`nuxt build` 停在以下日志不再前进：

```plain
Building Nuxt Nitro server (preset: node-server)
```

CPU/内存持续高占用，无任何新输出，看起来像"死了"。

### 根因

Nitro 的 `node-server` preset 在出包阶段默认启用 `externals.trace`（即 `@vercel/nft` 的 `nodeFileTrace`）。该工具会递归扫描所有 `node_modules` 依赖的文件引用链，在 pnpm workspace 的硬链 / 嵌套 `.pnpm` store 结构下：

- 扫描范围爆炸性增长
- 内存占用可超过默认 Node 堆限制（约 4GB）
- 单线程 CPU 持续 100%

**这不是"卡死"，是"在做一件做不完的事"。**

### 诊断方法

1. 检查是否已生成 `.nuxt/dist/server/server.mjs`（Vite SSR 已完成）
2. 检查 `.output/server/` 是否为空（Nitro 收尾未完成）
3. 如果 1 存在、2 为空 → 卡点在 Nitro trace，不是 Vite

```powershell
# 诊断命令
Test-Path .nuxt/dist/server/server.mjs   # 应为 True
ls .output/server/ 2>$null                # 应为空或不存在
```

### 修复

在 `nuxt.config.ts` 中关闭 trace：

```ts
nitro: {
  externals: {
    trace: false,
  },
},
```

### 附加优化：关闭预渲染

文档站在 `node-server` 模式下通常不需要构建期预渲染。预渲染会拉起额外的 `nitro-prerender` 进程，加载完整 SSR 包，在默认堆限制下容易 OOM：

```ts
nitro: {
  externals: {
    trace: false,
  },
  prerender: {
    crawlLinks: false,
  },
  hooks: {
    "prerender:routes"(routes: Set<string>) {
      routes.clear();
    },
  },
},
```

### 验证

使用单进程 verbose 模式验证构建是否恢复正常：

```powershell
# 先清理旧产物
Remove-Item -Recurse -Force .nuxt, .output -ErrorAction SilentlyContinue

# 单进程 verbose 构建
npx nuxi build --logLevel=verbose
```

成功标志：

- 日志打印 `Build complete!`
- `.output/server/index.mjs` 存在
- 进程自动退出

---

## 事故 2：子进程链残留

### 现象

- 构建越来越慢，每次比上次更卡
- 即使重新运行 `nuxt dev` 或 `nuxt build`，也异常缓慢
- 任务管理器中有多个 `node.exe` 和 `cmd.exe` 进程

### 根因

在 PowerShell 中运行 `pnpm run build` 时，进程链为：

```plain
PowerShell → pnpm → cmd.exe → node.exe (nuxi)
                                └─ node.exe (Vite worker)
                                └─ node.exe (Nitro worker)
```

当通过以下方式中断时，**只有最外层进程退出**，内层 `cmd.exe` 和 `node.exe` 成为孤儿进程：

- PowerShell 超时终止（如 AI agent 的 `block_until_ms` 超时）
- `Ctrl+C` 在某些终端模拟器中不传递到子进程
- 关闭终端标签页
- 手动 `Stop-Process` 只杀 pnpm

### 诊断

```powershell
# 查看所有 node 进程
Get-Process node -ErrorAction SilentlyContinue | Select-Object Id, CPU, WorkingSet64, CommandLine

# 查看 cmd.exe 残留
Get-Process cmd -ErrorAction SilentlyContinue | Select-Object Id, CPU
```

### 清理

```powershell
# 杀死所有 node 进程（谨慎：会影响其他 Node 应用）
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

# 更精准：只杀含 nuxi 或 nuxt 的 node 进程
Get-WmiObject Win32_Process -Filter "Name = 'node.exe'" |
  Where-Object { $_.CommandLine -match 'nuxi|nuxt' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

# 清理可能被锁的临时文件
Remove-Item -Recurse -Force .nuxt, .output -ErrorAction SilentlyContinue
```

### 预防

1. 中断构建后，**先清理旧进程，再复现**
2. 避免在同一终端中叠加多次构建命令
3. 对"可能卡住"的命令，优先短等待 + 快止损
4. 使用 `npx nuxi build` 而非 `pnpm run build`，减少进程链层级

---

## 事故 3：EPERM 文件锁

### 现象

在 Cursor / VS Code 内置终端运行 `pnpm install` 时报错：

```plain
EPERM: operation not permitted, unlink 'node_modules/@oxc-parser/binding-win32-x64-msvc/parser.win32-x64-msvc.node'
```

安装回滚，依赖无法更新。

### 根因

IDE 的 TypeScript 语言服务（`tsserver`）会加载并持有原生 `.node` 文件（如 `@oxc-parser`、`esbuild`、`@swc/*` 的 native bindings）。Windows 的文件锁机制不允许删除正在使用的文件，导致 pnpm 无法完成 `unlink` 操作。

### 受影响的常见包

| 包名                            | native binding 文件          |
| ------------------------------- | ---------------------------- |
| `@oxc-parser`                   | `parser.win32-x64-msvc.node` |
| `esbuild`                       | `esbuild.exe`                |
| `@swc/core`                     | `swc.win32-x64-msvc.node`    |
| `@rollup/rollup-win32-x64-msvc` | `rollup.win32-x64-msvc.node` |

### 修复

**在 IDE 外部的独立 PowerShell / CMD 终端中运行 `pnpm install`**。

```powershell
# 在独立终端中（非 IDE 内置终端）
cd D:\code\your-monorepo
pnpm install
```

### 预防规则

> **凡是涉及原生 addon 依赖更新（`@oxc-parser`、`esbuild`、`@swc/*`、`@rollup/*`），一律在外部终端执行 `pnpm install`。**

---

## 综合排查流程

当 Windows 环境下出现构建或安装异常时，按以下顺序：

```plain
1. 检查是否有残留 node.exe / cmd.exe 进程 → 清理
2. 清理旧产物（.nuxt, .output）
3. 单进程复现（npx nuxi build --logLevel=verbose）
4. 如果卡在 Nitro 收尾 → 检查 nitro.externals.trace 配置
5. 如果 pnpm install 报 EPERM → 切换到外部终端
6. 如果以上都不是 → 检查 Node 内存限制和系统资源
```

---

## 环境建议

| 项目        | 推荐值                                      |
| ----------- | ------------------------------------------- |
| Node.js     | >= 18.x，推荐 20.x LTS                      |
| pnpm        | >= 9.x                                      |
| PowerShell  | 建议使用 PowerShell 7（pwsh）               |
| Node 堆限制 | 默认即可，除非需要预渲染                    |
| 磁盘空间    | `.pnpm-store` + `node_modules` 需要充足空间 |
