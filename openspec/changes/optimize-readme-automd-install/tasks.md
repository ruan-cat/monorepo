## 1. 依赖管理

- [ ] 1.1 扫描项目中的所有 `package.json`，识别出所有有意义的子包（位于 `packages/`, `configs-package/`, `vite-plugins/`），并列出清单。
- [ ] 1.2 检查所有子包的 `automd` 依赖安装情况。
- [ ] 1.3 将根目录及所有子包的 `automd` 依赖升级到最新版本 (0.4.3+)。
- [ ] 1.4 使用 `git-commit` 提交依赖升级变更。

## 2. 文档补全

- [ ] 2.1 检查上述清单中的每个子包，确认是否存在 `README.md` 文件。
- [ ] 2.2 为缺失 `README.md` 的子包创建基础文档。
- [ ] 2.3 使用 `git-commit` 提交新建的文档文件。

## 3. 文档内容优化

- [ ] 3.1 遍历所有有意义子包的 `README.md`，手动或半自动替换现有的安装命令。
- [ ] 3.2 插入 `<!-- automd:pm-install name="<package-name>" [dev] -->` 注释块。
  - 对于 `configs-package/` 和 `vite-plugins/` 下的包，添加 `dev` 参数。
  - 对于 `packages/` 下的大部分包（如 `utils`），根据实际用途决定是否添加 `dev` 参数（通常作为运行时依赖库不需要 `dev`）。
- [ ] 3.3 运行 `pnpm automd:all` 或批量运行子包的 `prebuild` 脚本，生成安装说明内容。
- [ ] 3.4 检查生成的内容 diff，确保格式正确且链接有效。

## 4. 提交与收尾

- [ ] 4.1 使用 `git-commit` 提交所有 `README.md` 的变更，描述为“docs: optimize installation instructions with automd”。
- [ ] 4.2 验证变更是否符合 OpenSpec 规范，准备归档。
