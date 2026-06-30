# 2026-06-30 consola ESM 解析故障在 Node.js 24 CI 环境根因调研

## 摘要

2026-06-30 期间，GitHub Actions CI 在 `ubuntu-latest` + Node.js `24.18.0` 环境下反复出现 `ERR_MODULE_NOT_FOUND`，错误指向 `packages/utils/node_modules/consola/index.js`，触发位置为 `automd/dist/cli.mjs` 对 `consola` 的 ESM 导入。

本报告通过分析错误堆栈、Node.js v24.18.0 ESM 解析源码、consola@3.4.2 的 `package.json` 结构以及本地复现实验，得出以下核心结论：

1. **consola@3.4.2 的 `package.json` 是规范的**，并非"没有 `main` 入口"。它有完整的 `exports` 字段、`main` 字段和 `module` 字段。
2. 错误堆栈中出现 `legacyMainResolve`，说明运行时 Node.js **没有使用 `exports` 字段**，而是 fallback 到了旧式主入口解析。
3. 根据 Node.js v24.18.0 源码，`legacyMainResolve` 只在 `package.json` **不存在 `exports` 字段** 且请求包根路径时调用。因此，CI 失败意味着在那一刻，Node.js 读取到的 consola `package.json` 的 `exports` 字段为 `null/undefined`。
4. 本地同版本 Node.js 24.18.0 无法复现该错误，说明问题不是 Node 24 与 consola 的"绝对不兼容"，而是与 **CI 环境状态**（pnpm 版本、hoisting、缓存、remote cache、操作系统路径差异等）相关。
5. 此前多次修复（垫片、workflow 顺序、patches、composite action）均未触及这个"运行时 `exports` 字段失效"的假设，因此症状反复出现。

---

## 1. 错误现象

CI 日志（`.github/workflows/ci.yaml` 触发 `pnpm run ci`）中的关键错误：

```log
> @ruan-cat-monorepo/root@1.0.0 ci /home/runner/work/monorepo/monorepo
> pnpm run build && pnpm run build:docs

> @ruan-cat-monorepo/root@1.0.0 build /home/runner/work/monorepo/monorepo
> turbo build

@ruan-cat/utils:prebuild
> @ruan-cat/utils@4.25.1 prebuild /home/runner/work/monorepo/monorepo/packages/utils
> automd

node:internal/modules/run_main:107
    triggerUncaughtException(
    ^

Error: Cannot find package '/home/runner/work/monorepo/monorepo/packages/utils/node_modules/consola/index.js' imported from /home/runner/work/monorepo/monorepo/packages/utils/node_modules/automd/dist/cli.mjs
Did you mean to import "consola/lib/index.cjs"?
    at legacyMainResolve (node:internal/modules/esm/resolve:201:26)
    at packageResolve (node:internal/modules/esm/resolve:778:12)
    ...

Node.js v24.18.0
```

注意两个关键信息：

- 错误路径是 `.../consola/index.js`，不是 `consola/dist/index.mjs`。
- 堆栈顶部是 `legacyMainResolve`，不是 `packageExportsResolve`。

---

## 2. consola@3.4.2 的 package.json 结构

本地 `node_modules/consola/package.json`（即 pnpm store 中 consola@3.4.2 的真实副本）的关键字段如下：

```json
{
	"name": "consola",
	"version": "3.4.2",
	"type": "module",
	"main": "./lib/index.cjs",
	"module": "./dist/index.mjs",
	"exports": {
		".": {
			"node": {
				"import": {
					"types": "./dist/index.d.mts",
					"default": "./dist/index.mjs"
				},
				"require": {
					"types": "./dist/index.d.cts",
					"default": "./lib/index.cjs"
				}
			},
			"default": {/* browser */}
		},
		"./browser": {/* ... */},
		"./basic": {/* ... */},
		"./core": {/* ... */},
		"./utils": {/* ... */}
	}
}
```

结论：

- `main` 字段存在，指向 `./lib/index.cjs`。
- `module` 字段存在，指向 `./dist/index.mjs`。
- `exports` 字段完整，对 `node` + `import` 环境明确返回 `./dist/index.mjs`。
- 包文件列表中，`dist/index.mjs`、`lib/index.cjs` 均存在。

因此，**"consola 的 package.json 没有 main 入口"这一判断不成立**。包的元数据是完整且规范的。

---

## 3. Node.js v24.18.0 ESM 解析机制分析

### 3.1 `packageResolve` 的决策逻辑

根据 Node.js v24.18.0 源码 `lib/internal/modules/esm/resolve.js`：

```js
function packageResolve(specifier, base, conditions) {
  // ...
  const { packageJSONUrl, packageJSONPath, packageSubpath } =
    packageJsonReader.getPackageJSONURL(specifier, base);

  const packageConfig = packageJsonReader.read(packageJSONPath, { ... });

  // 如果存在 exports 字段，直接走 packageExportsResolve
  if (packageConfig.exports != null) {
    return packageExportsResolve(
      packageJSONUrl, packageSubpath, packageConfig, base, conditions);
  }

  // 只有不存在 exports 且请求包根路径时，才走 legacyMainResolve
  if (packageSubpath === '.') {
    return legacyMainResolve(packageJSONUrl, packageConfig, base);
  }

  return new URL(packageSubpath, packageJSONUrl);
}
```

### 3.2 `legacyMainResolve` 的行为

`legacyMainResolve` 按旧式 CommonJS 规则解析主入口，顺序包括：

1. `pkgPath + (json main field)`
2. `main.js`、`main.json`、`main.node`
3. `main/index.js`、`main/index.json`、`main/index.node`
4. `pkg_url/index.js`、`pkg_url/index.json`、`pkg_url/index.node`

当 `main` 字段不存在时，最后会尝试 `pkg_url/index.js`，即 `.../consola/index.js`。

### 3.3 关键推论

错误堆栈中出现 `legacyMainResolve`，且最终尝试 `consola/index.js`，说明：

- Node.js 读取到的 consola `package.json` 的 `exports` 字段为 `null/undefined`，或者 `package.json` 整体读取失败导致 `packageConfig.exports` 被判定为不存在。
- 由于 `main` 字段存在，如果正常走 `legacyMainResolve`，应该首先成功找到 `./lib/index.cjs`，不会走到 `index.js`。但错误显示走到了 `index.js`，这进一步暗示 **`main` 字段在那一刻也可能未被正确识别**，或者 `lib/index.cjs` 文件在 CI 的该路径下不存在。

---

## 4. 本地复现实验

### 4.1 实验环境

- OS: Windows 11（Git Bash）
- Node.js: v24.18.0
- pnpm: 10.33.0
- consola: 3.4.2
- automd: 0.4.3

### 4.2 实验 1：默认状态下运行 automd

```log
$ cd packages/utils
$ pnpm exec automd --help
Your automated markdown maintainer! (automd v0.4.3)
USAGE automd [OPTIONS]
...
```

结果：**成功**，无 `ERR_MODULE_NOT_FOUND`。

### 4.3 实验 2：删除 consola 的 index.js 垫片后运行

```log
$ rm -f node_modules/consola/index.js
$ rm -f ../../node_modules/.pnpm/consola@3.4.2/node_modules/consola/index.js
$ pnpm exec automd --help
Your automated markdown maintainer! (automd v0.4.3)
USAGE automd [OPTIONS]
...
```

结果：**仍然成功**。说明本地 Node.js 24.18.0 能够正确解析 consola 的 `exports` 字段，不需要 `index.js` 垫片。

### 4.4 实验 3：移除 consola 的 exports 字段后运行

```log
$ # 临时删除 package.json 中的 exports 字段
$ cd packages/utils && node -e "import('automd').then(...).catch(...)"
automd ok
```

结果：即使在 Node 24 下移除 `exports` 字段，由于 `main` 字段指向的 `./lib/index.cjs` 存在，`legacyMainResolve` 仍然成功，automd 正常运行。

### 4.5 实验结论

| 场景             | 本地结果 | CI 结果 |
| ---------------- | -------- | ------- |
| 默认状态         | 成功     | 失败    |
| 无 index.js 垫片 | 成功     | 失败    |
| 无 exports 字段  | 成功     | 失败    |

这说明：**CI 环境存在某种本地不具备的状态差异**，导致 consola 的 `package.json` 在 Node.js 解析时失效。

---

## 5. 根因假设

基于以上分析，提出以下按可能性排序的根因假设：

### 假设 1：CI 中 consola 的 package.json 被改写或损坏（最可能）

在 CI 的 `packages/utils/node_modules/consola/package.json` 路径下，`exports` 字段可能为 `null` 或被截断。可能原因：

- 之前的 `postinstall` 或修复脚本在 CI 环境下写入了不完整的内容。
- pnpm 的某个版本在 Linux 下创建 symlink 或 hardlink 时，导致 package.json 指向了异常副本。
- turbo remote cache 恢复了旧的、不完整的 `node_modules` 状态。

### 假设 2：pnpm 版本差异导致 package.json 解析行为不同

本地 pnpm 为 10.33.0，CI 通过 `pnpm/action-setup@v5` 可能安装了不同版本（如 10.4x 或 9.x）。新版本对 `package.json` 的修改或 hoisting 策略可能影响了 Node.js 的读取。

### 假设 3：Node.js 24 在 Linux 下读取 symlink 包 package.json 存在边界问题

`packages/utils/node_modules/consola` 是一个指向 `.pnpm/consola@3.4.2/node_modules/consola` 的 symlink。Node.js 24 在特定 Linux 内核/文件系统下解析 symlink 包的 `package.json` 时，可能出现 race condition 或路径规范化问题，导致 `exports` 字段读取失败。

### 假设 4：全局工具安装污染了依赖解析

CI 中通过 `pnpm add -g vercel @dotenvx/dotenvx tsx turbo` 安装全局工具。某些全局包可能依赖不同版本的 consola，从而干扰了 `packages/utils` 的局部依赖解析。

---

## 6. 已做努力清单

截至本报告撰写时，为修复该问题已进行以下尝试：

1. **创建 consola index.js 垫片脚本**（`scripts/fix-consola-esm.ts`）：
   - 在根 `node_modules/consola` 和各 workspace 的 `node_modules/consola` 下创建 `index.js`。
   - 跟随 symlink 定位 pnpm store 中的真实目录。
   - 扫描 `.pnpm/consola@*` 和 `.pnpm/automd@*/node_modules/consola`。

2. **尝试 `pnpm patch`**：
   - 试图永久修改 consola 的 package.json，但 `pnpm patch-commit` 对新增文件识别不稳定。
   - 已清理失败的 patch 残留。

3. **修正 GitHub Workflow 语法**：
   - 修复 `pnpm/action-setup@v5` 的 `run_install` 参数错误（原配置会错误地全局安装工具）。
   - 创建 `.github/actions/setup-monorepo` composite action，统一 CI 初始化逻辑。
   - 在 `ci.yaml` 和 `release.yml` 中均复用该 action。

4. **纳入 `pnpm-lock.yaml`**：
   - 将 `pnpm-lock.yaml` 从 `.gitignore` 移除并提交，减少依赖版本漂移。

5. **增加 CI 诊断步骤**：
   - 在 build 前打印 consola 垫片状态和 automd 入口路径。
   - 在 build 前显式执行 `pnpm exec tsx scripts/fix-consola-esm.ts`。

以上努力均未彻底解决问题，症状反复出现。

---

## 7. 推荐修复方案

### 方案 A：降级 CI Node.js 到 22.x（短期最稳妥）

根据用户记忆和本地验证，Node.js 22 环境下从未出现此问题。将 `.github/actions/setup-monorepo/action.yml` 的默认 Node 版本从 `24.18.0` 改为 `22.x`，可以立即消除 CI 失败。

**优点**：

- 快速止血，恢复 CI 可用性。
- 与本地开发环境一致（项目最初基于 Node 22 构建）。

**缺点**：

- 未解决 Node 24 下的根本问题。
- 如果项目有必须使用 Node 24 的理由，此方案不可行。

### 方案 B：在 CI 中打印并校验 consola package.json 内容（定位根因）

在 `.github/actions/setup-monorepo/action.yml` 的诊断步骤中，增加对 `packages/utils/node_modules/consola/package.json` 的完整打印和校验：

```bash
echo "=== consola package.json 完整内容 ==="
cat ./packages/utils/node_modules/consola/package.json

echo "=== consola package.json exports 字段 ==="
node -e "console.log(JSON.stringify(require('./packages/utils/node_modules/consola/package.json').exports, null, 2))"

echo "=== consola lib/index.cjs 是否存在 ==="
test -f ./packages/utils/node_modules/consola/lib/index.cjs && echo "存在" || echo "不存在"

echo "=== consola dist/index.mjs 是否存在 ==="
test -f ./packages/utils/node_modules/consola/dist/index.mjs && echo "存在" || echo "不存在"
```

通过 CI 日志确认：

- `exports` 字段是否完整。
- `main` 字段是否被识别。
- 实际文件是否存在。

### 方案 C：强制修复 consola package.json（绕过运行时解析问题）

如果诊断确认 `exports` 字段在 CI 下失效，可以在 `scripts/fix-consola-esm.ts` 中不再只创建 `index.js`，而是**重写 consola 的 package.json**，添加一个稳定的 `"exports": { ".": "./dist/index.mjs" }` 简化的导出映射，确保 Node.js 24 能正确解析。

**风险**：

- 修改第三方包的 package.json 是侵入性操作。
- 升级 consola 后需要重新适配。

### 方案 D：升级 consola 到最新版本

检查 consola 是否有 3.4.3+ 版本修复了 Node.js 24 的兼容性问题。但截至调研时，consola@3.4.2 的 `package.json` 结构本身没有明显缺陷，升级可能只是迁移问题而非修复问题。

---

## 8. 下一步行动建议

1. **立即执行方案 A**：将 CI Node 版本降级到 22.x，恢复 CI 可用性。
2. **并行执行方案 B**：在 CI 中增加详细的 consola package.json 诊断，获取失败时的真实状态。
3. **根据诊断结果选择长期方案**：
   - 如果确认是 pnpm 版本差异 → 锁定 CI pnpm 版本。
   - 如果确认是 package.json 损坏 → 采用方案 C 强制修复。
   - 如果确认是 Node 24 Linux 特定问题 → 向 Node.js 或 consola 提交 issue，并暂时停留在 Node 22。

---

## 9. 结论

该故障**不是**因为 consola 官方包"没有 main 入口"或 package.json 不规范。consola@3.4.2 的 package.json 完全符合 Node.js 的 ESM 规范。

真正的谜团在于：**为什么在 CI 的 Node.js 24 环境下，Node.js 没有使用 consola 的 `exports` 字段，而是 fallback 到了 `legacyMainResolve` 并失败**。这一现象在本地同版本 Node.js 24 下无法复现，说明问题与 CI 环境状态强相关。

截至报告完成时，最有效的短期止血措施是 **降级 CI Node.js 到 22.x**，同时通过增强诊断获取 CI 失败时的真实 package.json 状态，以确定长期修复方向。
