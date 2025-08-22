# @ruan-cat/release-toolkit

<!-- automd:badges color=yellow -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/release-toolkit?color=yellow)](https://npmjs.com/package/@ruan-cat/release-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/release-toolkit?color=yellow)](https://npm.chart.dev/@ruan-cat/release-toolkit)

<!-- /automd -->

基于 [changelogen](https://github.com/unjs/changelogen) 增强 [changesets](https://github.com/changesets/changesets) 工作流的发布工具包，提供语义化提交解析和 GitHub Release 同步功能。

## 特性

- 🚀 **完全兼容** - 与现有 changesets 工作流无缝集成，无需重构
- 📝 **语义增强** - 支持 emoji + conventional commits 格式的智能解析
- 🔄 **自动同步** - CHANGELOG.md 与 GitHub Release 内容完全一致
- 🎯 **类型安全** - 完整的 TypeScript 类型支持
- ⚡ **开箱即用** - 预配置了常用的提交类型和 emoji 映射

## 技术架构

本工具包包含三个核心模块：

```plain
@ruan-cat/release-toolkit/
├── plugins/changelog-with-changelogen    # changesets 自定义插件
├── scripts/sync-github-release           # GitHub Release 同步脚本
└── configs/changelogen.config            # changelogen 配置
```

### 工作流程

```mermaid
graph TB
    A[开发者提交 PR] --> B[PR 合并到 main]
    B --> C[GitHub Actions 触发]
    C --> D[changesets/action@v1]
    D --> E[自定义 changelog 插件]
    E --> F[语义提交解析]
    F --> G[生成增强版 CHANGELOG.md]
    G --> H[changesets 发布到 NPM]
    H --> I[GitHub Release 同步脚本]
    I --> J[创建/更新 GitHub Release]
```

## 安装

```bash
pnpm add -D @ruan-cat/release-toolkit
```

## 快速开始

### 1. 更新 changesets 配置

修改 `.changeset/config.json`：

```json
{
	"$schema": "https://unpkg.com/@changesets/config@3.0.3/schema.json",
	"changelog": [
		"@ruan-cat/release-toolkit/plugins/changelog-with-changelogen",
		{
			"repo": "your-org/your-repo"
		}
	],
	"commit": false,
	"fixed": [],
	"linked": [],
	"access": "public",
	"baseBranch": "main",
	"updateInternalDependencies": "patch",
	"ignore": []
}
```

### 2. 创建 changelogen 配置

在项目根目录创建 `.config/changelogen.config.ts`：

```typescript
import config from "@ruan-cat/release-toolkit/configs/changelogen.config";
export default config;
```

### 3. 更新 GitHub Actions 工作流

在 `.github/workflows/release.yml` 中添加 GitHub Release 同步步骤：

```yaml
- name: 构建并发版
  id: changesets
  uses: changesets/action@v1
  with:
    publish: pnpm release
    version: pnpm run version
    commit: "📢 publish: release package(s)"
    title: "📢 publish: release package(s)"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

- name: 同步GitHub Release
  if: steps.changesets.outputs.published == 'true'
  run: tsx scripts/sync-github-release.ts
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    PUBLISHED_PACKAGES: ${{ steps.changesets.outputs.publishedPackages }}
```

### 4. 创建同步脚本

在项目根目录 `scripts/sync-github-release.ts`：

```typescript
#!/usr/bin/env tsx
import { runSync } from "@ruan-cat/release-toolkit/scripts/sync-github-release";

runSync().catch((error) => {
	console.error("Sync failed:", error);
	process.exit(1);
});
```

## 支持的提交格式

本工具支持多种提交消息格式：

### Emoji + Conventional Commits (推荐)

```plain
✨ feat(auth): 新增OAuth2.0登录功能
🐞 fix(api): 修复用户数据获取错误
📃 docs: 更新API文档和使用示例
🔧 build: 升级依赖包版本
```

### 纯 Conventional Commits

```plain
feat(auth): 新增OAuth2.0登录功能
fix(api): 修复用户数据获取错误
docs: 更新API文档
build: 升级依赖包版本
```

### 仅 Emoji

```plain
✨ 新增用户认证模块
🐞 修复登录页面显示bug
📃 完善README文档说明
```

## 生成效果对比

### 之前 (基础 changesets)

```markdown
- 增加发包配置避免部署信息打包。减少体积。 ([`b5b8d38`](https://github.com/...))
```

### 之后 (增强版)

```markdown
- 🔧 **build**: 增加发包配置避免部署信息打包。减少体积。 ([b5b8d38](https://github.com/...))
- ✨ **feat**(auth): 新增 OAuth2.0 登录支持 ([a1b2c3d](https://github.com/...))
- 📃 **docs**: 更新 API 文档和使用示例 ([e4f5g6h](https://github.com/...))
```

## API 文档

### changelogFunctions

changesets 自定义插件函数：

```typescript
import { changelogFunctions } from '@ruan-cat/release-toolkit'

// 在 .changeset/config.json 中使用
{
  "changelog": ["@ruan-cat/release-toolkit/plugins/changelog-with-changelogen"]
}
```

### GitHubReleaseSync

GitHub Release 同步类：

```typescript
import { GitHubReleaseSync } from "@ruan-cat/release-toolkit";

const sync = new GitHubReleaseSync({
	token: "ghp_xxxx",
	repository: "owner/repo",
});

await sync.syncFromChangesets([{ name: "@my/package", version: "1.0.0" }]);
```

### 配置工具

```typescript
import { extractCommitTypes, createEmojiTypeMap, getSupportedTypes } from "@ruan-cat/release-toolkit";

// 获取所有提交类型
const types = extractCommitTypes();
console.log(types);
// [{ emoji: '✨', type: 'feat', description: '新增功能' }, ...]

// 创建 emoji 映射
const emojiMap = createEmojiTypeMap();
console.log(emojiMap.get("✨"));
// { emoji: '✨', type: 'feat', description: '新增功能' }
```

## 集成说明

### 与 @ruan-cat/commitlint-config 集成

本工具包自动读取 `@ruan-cat/commitlint-config` 中定义的提交类型和 emoji 映射，确保提交规范与变更日志生成的一致性。

### monorepo 支持

针对 monorepo 项目进行了优化：

- 自动识别包结构 (`packages/*/CHANGELOG.md`)
- 支持 scoped 包名处理
- 独立的 GitHub Release 标签 (`@scope/package@version`)

### 错误处理

- 提交信息解析失败时回退到基础格式
- 单个包同步失败不影响其他包处理
- 详细的日志输出便于问题排查

## 开发

```bash
# 开发模式
pnpm dev

# 构建
pnpm build

# 生成文档
pnpm prebuild
```

## 许可证

[MIT](./LICENSE) License © 2024 [ruan-cat](https://github.com/ruan-cat)

## 相关项目

- [changesets](https://github.com/changesets/changesets) - 版本管理和发布工具
- [changelogen](https://github.com/unjs/changelogen) - 变更日志生成器
- [@ruan-cat/commitlint-config](../commitlint-config) - 提交信息规范配置

## 警告 该项目目前完全不能用

原本是期望给 .changeset\config.json 的 changelog 项配置一个日志生成功能，但是现在发现，所依赖的 changelogen 本身是不支持 monorepo 的，不如等待 changelogen 自身支持 monorepo，这样我就不需要封装该包了。

目前该包是用 claude code 自动生成的，效果完全不行，完全不能满足要求的。

暂且放弃，不再继续跟进。
