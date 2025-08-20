# 方案一：基于 Changelogen 的增强型 CHANGELOG 生成解决方案

## 概述

本方案旨在通过集成 [changelogen](https://github.com/unjs/changelogen) 来增强现有的 changesets 工作流，生成包含完整 git 提交语义信息的高质量 CHANGELOG.md 和 GitHub Release。

## 核心特性

- ✅ **保持现有工作流**：完全兼容现有的 changesets + GitHub Actions 发布流程
- ✅ **语义提交增强**：集成 changelogen 解析和展示 Conventional Commits + Emoji 格式
- ✅ **内容一致性**：确保 CHANGELOG.md 与 GitHub Release 内容完全同步
- ✅ **最小改动**：仅需修改配置文件，无需重构现有代码结构

## 技术架构

```mermaid
graph TB
    A[开发者提交 PR] --> B[PR 合并到 main]
    B --> C[GitHub Actions 触发]
    C --> D[changesets/action@v1]
    D --> E[自定义 changelog 插件]
    E --> F[Changelogen 语义分析]
    F --> G[生成增强版 CHANGELOG.md]
    G --> H[changesets 发布到 NPM]
    H --> I[GitHub Release 同步脚本]
    I --> J[创建/更新 GitHub Release]
    
    F --> K[解析 Git 提交]
    K --> L[提取语义信息]
    L --> M[格式化为 Markdown]
    M --> G
```

## 实施架构

### 1. @ruan-cat/release-toolkit 子包

新建专用的工具包，包含三个核心模块：

```
packages/release-toolkit/
├── src/
│   ├── plugins/
│   │   └── changelog-with-changelogen.ts    # 自定义changesets插件
│   ├── scripts/
│   │   └── sync-github-release.ts           # GitHub Release同步脚本
│   ├── configs/
│   │   └── changelogen.config.ts            # changelogen配置
│   └── index.ts                             # 统一导出
├── package.json
├── tsup.config.ts                           # 构建配置
└── README.md
```

### 2. 自定义 Changesets 插件

```typescript
// src/plugins/changelog-with-changelogen.ts
import { generateMarkDown } from 'changelogen'
import type { ChangelogFunction } from '@changesets/types'
import { consola } from 'consola'

export const getReleaseLine: ChangelogFunction['getReleaseLine'] = async (
  changeset,
  type,
  changelogOpts
) => {
  // 使用changelogen分析git提交
  const { commits } = await generateMarkDown({
    from: `${changeset.commit}~1`,
    to: changeset.commit,
    repo: changelogOpts.repo
  })

  if (commits.length > 0) {
    const commit = commits[0]
    const semanticInfo = parseSemanticCommit(commit.message)
    
    return `- ${semanticInfo.emoji} **${semanticInfo.type}**: ${changeset.summary} ([#${commit.shortHash}](${commit.url}))`
  }

  return `- ${changeset.summary}`
}
```

### 3. GitHub Release 同步脚本

```typescript
// src/scripts/sync-github-release.ts
import { Octokit } from '@octokit/rest'
import { readFileSync } from 'fs'
import { consola } from 'consola'

export class GitHubReleaseSync {
  private octokit: Octokit
  
  constructor(token: string, repo: string) {
    this.octokit = new Octokit({ auth: token })
    this.repo = repo
  }

  async syncFromChangesets(publishedPackages: any[]) {
    for (const pkg of publishedPackages) {
      const changelogPath = `packages/${pkg.name}/CHANGELOG.md`
      const { version, releaseNotes } = this.parseLatestChangelog(changelogPath)
      
      await this.createOrUpdateRelease(
        `${pkg.name}@${version}`,
        `${pkg.name} v${version}`,
        releaseNotes,
        version
      )
    }
  }
}
```

### 4. Changelogen 配置

```typescript
// src/configs/changelogen.config.ts
import { defineConfig } from 'changelogen'
import { getCommitTypes } from '@ruan-cat/commitlint-config'

export default defineConfig({
  types: getCommitTypes(),
  
  formatOptions: {
    groupByType: true,
    showReferences: true,
    showAuthors: false
  },

  excludeAuthors: ['renovate[bot]', 'dependabot[bot]'],
  
  // 自定义解析器处理emoji + conventional格式
  parseCommit: (commit) => {
    const emojiMatch = commit.message.match(/^([\u{1f000}-\u{1f9ff}|\u{2600}-\u{27bf}])\s*(.+)$/u)
    if (emojiMatch) {
      const [, emoji, rest] = emojiMatch
      const typeMatch = rest.match(/^(\w+)(\(.+\))?:\s*(.+)$/)
      
      if (typeMatch) {
        const [, type, scope, description] = typeMatch
        return {
          type,
          scope: scope?.slice(1, -1),
          description,
          emoji
        }
      }
    }
    
    return null
  }
})
```

## 配置更新

### 1. .changeset/config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.3/schema.json",
  "changelog": [
    "@ruan-cat/release-toolkit/plugins/changelog-with-changelogen",
    {
      "repo": "ruan-cat/monorepo"
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

### 2. .config/changelogen.config.ts

```typescript
import config from '@ruan-cat/release-toolkit/configs/changelogen.config'
export default config
```

### 3. GitHub Actions 工作流更新

```yaml
# .github/workflows/release.yml (部分)
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

## 实施步骤

1. **创建 @ruan-cat/release-toolkit 子包**
   - 设置 TypeScript + tsup 构建配置
   - 实现三个核心模块
   - 配置 package.json 双模式导出

2. **集成 commitlint 配置**
   - 从 @ruan-cat/commitlint-config 读取 emoji 映射
   - 实现语义提交解析器

3. **更新配置文件**
   - 修改 .changeset/config.json 使用新插件
   - 创建 .config/changelogen.config.ts

4. **更新工作流**
   - 在 release.yml 中添加 GitHub Release 同步步骤

5. **文档和质量保证**
   - 编写详细的 README.md
   - 添加 automd badges
   - 确保构建和发布流程正常

## 预期效果

### CHANGELOG.md 增强示例

**之前**:
```markdown
- 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([`b5b8d38`](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))
```

**之后**:
```markdown
- 🔧 **build**: 增加发包配置 `!**/.vercel/**` 避免出现不小心把部署信息一起打包的情况。减少打包体积。 ([#b5b8d38](https://github.com/ruan-cat/monorepo/commit/b5b8d3833553cdae070422233612a85066228e16))
- ✨ **feat**: 新增用户认证模块支持OAuth2.0登录 ([#a1b2c3d](https://github.com/ruan-cat/monorepo/commit/...))
- 📃 **docs**: 更新API文档和使用示例 ([#e4f5g6h](https://github.com/ruan-cat/monorepo/commit/...))
```

## 技术优势

1. **渐进式改进**：无需推倒重来，基于现有工作流逐步增强
2. **类型安全**：全 TypeScript 实现，完整类型约束
3. **可维护性**：模块化设计，职责清晰分离
4. **扩展性**：易于添加新的 commit 类型和格式化规则
5. **一致性**：确保所有发布渠道内容完全同步

这个解决方案既满足了您对 changelogen 集成的需求，又保持了与现有 changesets 工作流的完美兼容性，是一个实用且可靠的技术方案。