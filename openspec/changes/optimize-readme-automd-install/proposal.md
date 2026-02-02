## Why

本项目目前在多个子包的 `README.md` 文件中手动维护依赖安装命令，这种方式容易导致信息过时，且维护成本高。为了提高文档的自动化程度和准确性，我们需要引入 `automd:pm-install` 生成器来自动生成安装说明。

## What Changes

本次变更将对多个子包进行批量更新，主要内容包括：

- **依赖升级**: 将全局及子包中的 `automd` 依赖升级到最新版本（0.4.3）。
- **文档补全**: 为确实 `README.md` 的核心子包补充文档。
- **文档优化**: 使用 `automd:pm-install` 替换 `README.md` 中手动编写的安装命令。
- **自动化生成**: 运行 `automd` 重新生成所有相关文档内容。

## Capabilities

### New Capabilities

- `automd-install-generator`: 在所有子包的 README.md 中集成 automd 的 pm-install 生成器，实现安装命令的自动生成和维护。

## Impact

- **涉及范围**:
  - `packages/*`
  - `configs-package/*`
  - `vite-plugins/*`
- **依赖变更**: 升级 `automd` 版本。
- **文件变更**: 修改所有子包的 `package.json` (依赖更新) 和 `README.md` (内容生成)。
