## ADDED Requirements

### Requirement: README 文档自动生成安装命令

所有发布的 npm 包必须在 README.md 文档中使用 automd 的 pm-install 生成器来自动生成安装命令，而不是手动编写。

#### Scenario: 检测 automd 安装命令注释

- **WHEN** 运行 automd 更新文档时
- **THEN** automd 应当识别 `<!-- automd:pm-install name="<package-name>" [dev] -->` 注释块
- **THEN** automd 应当根据 `name` 参数生成对应的 npm/yarn/pnpm 安装命令
- **THEN** 如果指定了 `dev` 参数，生成的命令应包含 `-D` 或 `--save-dev` 标志

#### Scenario: 覆盖有意义的子包

- **WHEN** 检查项目中的子包时
- **THEN** 位于 `packages/*`, `configs-package/*`, `vite-plugins/*` 下的包必须包含 `README.md`
- **THEN** 这些 `README.md` 文件中必须包含 `automd:pm-install` 配置
- **THEN** `demos/*` 和 `tests/*` 目录下的包不强制要求包含此配置

#### Scenario: 依赖版本一致性

- **WHEN** 检查开发依赖版本时
- **THEN** 根目录和所有子包中的 `automd` 版本必须更新至最新版 (0.4.3+)
- **THEN** 所有包的 `automd` 版本应保持一致

#### Scenario: 对等依赖 (Peer Dependencies) 完整性

- **WHEN** 生成安装说明时
- **THEN** 检查 `package.json` 中的 `peerDependencies`
- **THEN** 如果存在必须的对等依赖（如 `commitlint-config` 依赖 `commitizen`），安装命令或文档说明中**必须**包含这些依赖
- **THEN** 确保用户复制安装命令后，能一次性安装所有必要组件，无需二次报错

#### Scenario: CLI 工具使用说明 (npx/dlx)

- **WHEN** 包被识别为 CLI 工具（存在 `bin` 字段或设计为 CLI 使用）
- **THEN** 文档必须提供基于 `npx` 或 `pnpm dlx` 的“免安装运行”或“初始化”命令示例
- **THEN** 例如：`pnpm dlx @ruan-cat/commitlint-config init`
