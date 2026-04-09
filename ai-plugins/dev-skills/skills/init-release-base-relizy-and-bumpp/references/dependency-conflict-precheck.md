# commit-and-tag-version 依赖冲突预检

## 问题概述

`commit-and-tag-version` 在 `package.json` 中将 `conventional-changelog` **锁死在 `4.0.0`**（不带 `^`），导致其子依赖 `conventional-changelog-angular@6.0.0` 被 pnpm 的 `shamefully-hoist` 提升到根 `node_modules`，遮蔽新链路需要的 `angular@8.x`。

新版 `preset-loader@5` 加载到旧版 `angular@6` 后因 API 不兼容而静默失败，最终回退到 `conventional-changelog-writer` 的默认 `<small>` 模板，导致 CHANGELOG 标题退化。

## 影响范围

当项目同时安装以下依赖时，`conventional-changelog -p angular -i CHANGELOG.md -s` 命令可能输出错误格式的 CHANGELOG：

- `commit-and-tag-version`（引入旧版 `conventional-changelog@4.0.0` → `angular@6.0.0`）
- `conventional-changelog-cli@5`（新链路，期望 `angular@8.x`）

## 两代 API 断代

| API 版本     | angular 版本           | 导出形态              | loader 版本  | 兼容性   |
| ------------ | ---------------------- | --------------------- | ------------ | -------- |
| 旧 API       | ≤ 7.0.0                | `Promise` / `object`  | loader@3.0.0 | 仅旧链路 |
| 新 API       | ≥ 8.0.0                | `function`            | loader@5.0.0 | 仅新链路 |
| **交叉冲突** | 6.0.0 被 loader@5 加载 | `object` ≠ `function` | loader@5.0.0 | **失败** |

## 预检命令

在目标仓库根目录执行：

```bash
node --input-type=module -e "const m = await import('conventional-changelog-angular'); console.log('export type:', typeof m.default);"
```

| 输出                    | 含义                         | 处理     |
| ----------------------- | ---------------------------- | -------- |
| `export type: function` | 命中 angular@8.x，兼容       | 无需处理 |
| `export type: object`   | 命中 angular@6.x/7.x，不兼容 | 需修复   |

## 检查 commit-and-tag-version 是否存在

```bash
pnpm why commit-and-tag-version
pnpm why conventional-changelog-angular
```

若 `pnpm why` 显示 `angular@6.0.0` 来自 `commit-and-tag-version` → `conventional-changelog@4.0.0`，确认为此故障。

## 修复方案

### 方案 A：移除 commit-and-tag-version（推荐）

项目已切换到 relizy + bumpp，`commit-and-tag-version` 是废弃的遗留工具：

```bash
pnpm remove commit-and-tag-version -w
```

### 方案 B：pnpm overrides 强制版本对齐

在根 `package.json` 添加：

```json
{
	"pnpm": {
		"overrides": {
			"conventional-changelog-angular": "^8.3.0"
		}
	}
}
```

### 推荐

方案 A 更彻底——移除已废弃的工具，消除依赖冲突根源。

## 为什么 `<small>` 标题不是 angular 模板

`<small>` 来自 `conventional-changelog-writer` 的**内置默认 fallback 模板**，在 preset 加载失败时被启用。所有版本的 `angular` preset（6.0.0 / 7.0.0 / 8.3.x）的 `headerPartial` 模板完全相同，都是 compare-link 格式。

## `commit-and-tag-version` 的锁死版本问题

`commit-and-tag-version` 的 `dependencies` 中几乎所有 `conventional-changelog` 系列依赖都被锁死精确版本：

| 依赖包                                       | 锁死版本 | 当前最新 |
| -------------------------------------------- | -------- | -------- |
| `conventional-changelog`                     | `4.0.0`  | `6.0.0`  |
| `conventional-changelog-conventionalcommits` | `6.1.0`  | `8.1.0`  |
| `conventional-recommended-bump`              | `7.0.1`  | `10.0.0` |

这种精确锁定版本的做法让其依赖树与上游更新完全脱钩，在 `shamefully-hoist=true` 环境下极易导致新旧版本遮蔽问题。

## 阻断条件

若预检发现 `angular` 导出类型为 `object`，**必须先修复依赖冲突**再继续接入发版配置。在依赖冲突未解决前，`conventional-changelog -p angular -i CHANGELOG.md -s` 命令会产生错误格式的 CHANGELOG，影响 bumpp 的 `execute` 步骤。
