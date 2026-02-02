## Context

目前，本 Monorepo 项目中的多个子包（位于 `packages/*`, `configs-package/*`, `vite-plugins/*`）在 `README.md` 中手动维护安装说明。随着项目发展，手动维护容易导致文档滞后、格式不统一，且增加了维护负担。`automd` 工具提供了 `pm-install` 生成器，能够根据 `package.json` 中的信息自动生成多包管理器的安装命令，非常适合用于优化当前的文档维护流程。

## Goals / Non-Goals

**Goals:**

1.  **全面升级**: 将项目中所有使用的 `automd` 升级到最新版本 (v0.4.3+)，确保使用最新的功能和修复。
2.  **全量覆盖**: 识别所有“有意义”的子包（即需要发布的 npm 包），确保它们都有 `README.md`。
3.  **自动化安装说明**: 在所有有意义子包的 `README.md` 中，使用 `<!-- automd:pm-install ... -->` 替换手动编写的安装命令。
4.  **统一构建**: 确保所有子包的 `prebuild` 脚本都能正确调用 `automd` 更新文档。

**Non-Goals:**

1.  **重构其他文档内容**: 本次变更专注于安装说明的自动化，不涉及 `README.md` 中其他内容（如使用指南、API 文档）的重构。
2.  **修改构建流程**: 仅利用现有的 `prebuild` 钩子，不引入新的构建工具或改变构建顺序。

## Decisions

### 1. 目标子包的筛选策略

**Decision**:
通过解析 `pnpm-workspace.yaml` 获取工作区模式，并结合文件系统扫描 `package.json` 来确定目标子包。排除 `private: true` 且不打算作为库发布的包（如 `demos/*`, `tests/*`），重点关注 `packages/*`, `configs-package/*`, `vite-plugins/*` 下的包。

**Rationale**:
并非所有工作区目录都需要标准的安装说明。例如，示例代码（demos）通常不需要被安装，测试代码也不发布。聚焦于库性质的包能最大化文档优化的价值。

### 2. `automd:pm-install` 参数配置与增强

**Decision**:
使用如下标准格式，并根据包的特性补充对等依赖和运行方式说明：

```markdown
<!-- automd:pm-install name="<package-name>" <dev?> -->
<!-- /automd -->
```

**增强规则**:

1.  **对等依赖 (Peer Dependencies)**:
    - 对于存在 `peerDependencies` 且必须配合安装的包（如 `commitlint-config` 依赖 `commitizen`），**必须**在安装说明中显式包含这些依赖。
    - 鉴于 `automd:pm-install` 原生不支持自动合并 peerDeps，我们需要在设计上要求：
      - 方案 A (理想): 如果 `automd` 支持，传入额外参数 (如 `name="@ruan-cat/pkg peer-dep-a"`)。
      - 方案 B (当前可行): 在 `automd` 块之外，或者作为 `automd` 的一部分，必须补充说明 "同时安装 peerDependencies" 的步骤。
    - **修正**: 为了满足 "同步安装齐全足够的 peer 依赖" 的要求，我们将手动或通过配置确保安装命令包含必要的 peer deps。

2.  **CLI 工具 (npx/dlx)**:
    - 对于主要以 CLI 形式使用的包（如 `taze-config`, `commitlint-config`, `vercel-deploy-tool`），**必须**在文档中显著位置（通常是安装说明后或“快速开始”节）提供 `npx` 或 `pnpm dlx` 的使用示例。
    - 明确区分 "安装使用" (作为依赖) 和 "一次性运行" (CLI) 的场景。

**Rationale**:
准确区分 `dependencies` 和 `devDependencies` 对用户至关重要。同时，现代前端工具链常依赖对等依赖（如 eslint config, commitlint config），若文档遗漏会导致用户配置失败。CLI 工具的 `dlx` 用法能极大降低用户试用门槛。

### 3. 批量处理脚本

**Decision**:
不编写复杂的 Node.js 脚本来执行替换，而是采用“人工辅助 + 批量命令”的方式：

1.  手动或半自动（通过 IDE 替换）修改 `README.md` 插入 automd 注释。
2.  使用 `pnpm -r exec -- automd` 或项目根目录的 `automd:all` 脚本批量执行生成。

**Rationale**:
`README.md` 内容各异，编写脚本精准定位并替换旧的安装命令逻辑复杂且容易出错。人工审查并插入 automd 标签更安全。后续的生成过程完全自动化。

## Risks / Trade-offs

### Risk: `automd` 版本升级导致的不兼容

**Risk**: 升级 `automd` 可能引入破坏性变更，导致现有的其他 automd 生成器（如 `badges`）失效或输出格式改变。
**Mitigation**: 在全量应用前，先在一个子包（如 `@ruan-cat/utils`）进行测试，验证生成的文档效果。

### Risk: 遗漏部分子包

**Risk**: 可能漏掉某些生僻的或新增加的子包。
**Mitigation**: 使用 `find` 命令结合 `pnpm-workspace.yaml` 进行双重校验，列出清单逐一核对。

## Migration Plan

1.  **准备**:
    - 升级根目录及所有子包的 `automd` 依赖。
    - 提交依赖升级变更。
2.  **实施**:
    - 扫描并列出所有目标子包。
    - 逐个检查 `README.md`，不存在则创建。
    - 逐个修改 `README.md`，插入 `automd:pm-install` 注释，删除旧安装说明。
    - 识别包类型（运行时 vs 开发时），正确设置 `dev` 标志。
3.  **生成与验证**:
    - 运行 `pnpm automd:all` 或 `pnpm -r prebuild`。
    - 检查生成的 diff，确保格式正确，链接有效。
4.  **提交**:
    - 提交文档变更。
