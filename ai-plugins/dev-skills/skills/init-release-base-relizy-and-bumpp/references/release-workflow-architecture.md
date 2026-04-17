# Relizy + Bumpp 组合发版架构详解

## 设计理念

1. **本地控制 tag 生成**：开发者在本地运行 `pnpm release` 一条命令完成所有版本管理（bump、changelog、tag）
2. **云端负责 GitHub Release**：GitHub Actions 检测到 tag 推送后，自动从 CHANGELOG.md 提取内容创建 GitHub Release
3. **单次 push**：所有 tags（子包 + 根包）在一次 `git push --follow-tags` 中推送，减少 CI 触发延迟
4. **根包有两种合法入口**：串行主链路使用 `release:root` + `--no-push`；单独根包发版使用 `release:bumpp` + `--push`
5. **两工具协作**：relizy 负责子包（independent 模式），bumpp 负责根包，各司其职

## 工具职责分工

| 工具                       | 职责                                                 |
| -------------------------- | ---------------------------------------------------- |
| `relizy`                   | 子包独立版本管理（bump + changelog + tag）           |
| `bumpp`                    | 根包版本管理（bump + tag）                           |
| `conventional-changelog`   | 根包 CHANGELOG.md 生成（由 bumpp 的 `execute` 调用） |
| `changelogen`              | 提供 commit types 配置（被 relizy 复用）             |
| `gh` CLI（GitHub Actions） | 创建 GitHub Release（CI 中预装，无需安装）           |

## 执行流程

```plain
pnpm release
    │
    ├── 1. pnpm run release:sub（relizy）
    │   ├── 分析各子包 commits
    │   ├── bump 有变更的子包 package.json version
    │   ├── 生成子包 CHANGELOG.md + 根 CHANGELOG.md
    │   ├── git commit（如 "📢 publish: release @scope/admin@6.1.8, @scope/type@1.1.5"）
    │   ├── git tag（如 @scope/admin@6.1.8, @scope/type@1.1.5）
    │   └── 不 push（--no-push）
    │
    ├── 2. pnpm run release:root（bumpp）
    │   ├── bump 根 package.json version（patch）
    │   ├── 执行 changelogen 生成根 CHANGELOG 聚合 section
    │   ├── git commit（如 "📢 publish(root): release v0.12.0"）
    │   ├── git tag（如 v0.12.0）
    │   └── 不 push（--no-push）
    │
    └── 3. pnpm run git:push
        └── git push --follow-tags（一次性推送所有 commits + tags）
```

### 单独根包发版入口

```plain
pnpm run release:bumpp
    ├── bumpp 交互式选择根包版本
    ├── 生成根包 commit + tag
    └── 立即 push（--push）
```

## 为什么要单次 push

- 所有 tags 同时到达远端，GitHub Actions 几乎同时触发
- 避免分批推送导致 CI 执行时间差
- 减少 GitHub 通知邮件的时间跨度
- 单独执行 `release:bumpp` 是显式例外：它服务于只发根包的场景，因此应立即推送根 tag

## 配置文件协作关系

```plain
changelog.config.ts ─── 提供 types + templates ──→ relizy.config.ts
                    └── 提供 types ──→ changelogithub.config.ts

relizy.config.ts ─── 子包发版（push: true 但 CLI --no-push 覆盖）
bump.config.ts   ─── 根包发版（不写死 push，execute → changelogen）

.github/workflows/release.yaml ─── 检测 tag 推送 → 从 CHANGELOG.md 提取 → gh release create
```

## 为什么 `bump.config.ts` 不写死 `push`

- `bump.config.ts` 同时服务于串行主链路和单独根包发版两个入口。
- 若在配置文件中写死 `push: false`，单独运行 `bumpp` 时只会生成本地 tag，远程拿不到根 tag。
- 因此 push 策略必须回到官方 CLI 参数：`release:root` 用 `--no-push`，`release:bumpp` 用 `--push`。

## 两种 tag 格式与 CHANGELOG 提取

| tag 格式                     | 生成工具                       | CHANGELOG section header                                                 |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| `@scope/pkg@version`（子包） | relizy                         | `## @scope/pkg@version (date)`                                           |
| `v*`（根包）                 | bumpp + conventional-changelog | `## <small>version (date)</small>` 或 `## [version](compare-url) (date)` |

GitHub Actions 工作流通过 `if [[ "$TAG" == v* ]]` 判断 tag 类型，分别用不同的 awk 模式提取对应 section。

## 为什么用 `gh release create` 而不是其他方案

| 工具                      | 问题                                                            |
| ------------------------- | --------------------------------------------------------------- |
| `changelogithub`          | 底层 `git log tag1...tag2` 无法解析含 `@` 的 scoped tag（歧义） |
| `relizy provider-release` | 单独运行缺少 `release` 流程上下文，创建 0 个 release            |
| `changelogen gh release`  | Release 内容正确，但 tag 映射为 `v*` 格式，无法关联 scoped tag  |
| **`gh release create`**   | tag 名作为普通字符串传给 GitHub API，无歧义，完全可控           |

## 首次接入要点

1. 安装依赖（详见 SKILL.md 依赖清单）
2. 创建 5 个配置文件（详见 templates/）
3. 补充 baseline tag（relizy independent 模式需要每个子包有初始 tag）
4. 配置 package.json scripts（详见 templates/package-scripts.md）
5. 创建 GitHub Actions 工作流（详见 templates/release.yaml）
6. 确保子包非 private（relizy independent 模式忽略 `private: true` 的包）
7. 处理 Windows 兼容性（使用 relizy-runner）

## 工作流未触发时先查远程 tag

若本地已经生成根包 tag，但 GitHub Actions 的 `release.yaml` 没有触发，先不要直接怀疑 CHANGELOG 提取逻辑。优先检查远程 tag 是否真的存在：

```bash
git tag --list "v0.11.5-beta.1"
git ls-remote --tags origin "v0.11.5-beta.1"
```

本地 tag 存在但远程 tag 缺失时，根因通常是单独执行 bumpp 时没有显式使用 `--push`。

## 验证方法

发版后检查：

1. **Git tags**：`git tag --list --sort=-creatordate | head -5`
2. **GitHub Releases**：在 `https://github.com/<owner>/<repo>/releases` 检查
3. **Release 内容**：子包 Release 包含该包变更日志，根包 Release 包含聚合提交
