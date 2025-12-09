# 重构对 `tinyglobby` 以及对 `isMonorepoProject` 的使用

1. 请你阅读 `https://01s-11comm-doc.ruan-cat.com/docs/reports/2025-12-09-nitro-build-ruan-cat-utils-version-fix.md` 文档，了解清楚 `@ruan-cat/utils` 包在正常情况下导致的严重故障。
2. 必须保证 `isMonorepoProject` 函数，即 `packages\utils\src\monorepo\index.ts` 文件，只能以 node-esm 和 node-cjs 这两款路径内导出使用。
3. 不允许 `isMonorepoProject` 在 `packages\utils\src\index.ts` 内导出。
4. 同步地去更改其他引用 `@ruan-cat/utils` 的 `isMonorepoProject` 函数的包。特别是：
   - configs-package\taze-config\package.json
   - configs-package\commitlint-config\package.json
5. 在 `@ruan-cat/taze-config` 内，应该以 `node-esm` 路径导入该依赖包。
6. 在 `@ruan-cat/commitlint-config` 内，应该以 `node-cjs` 路径导入该依赖包。
7. 重构完成后，请及时地 build 构建产物，检查在 `packages\utils\dist\index.js` 目录内不要出现直接使用 `tinyglobby` 的情况。
8. 在 `packages\utils\src\monorepo\index.md` 内编写文档，确保其可以正确使用。
9. 为 `@ruan-cat/utils` 编写更新日志，说明清楚为什么会导致 bug，以及 isMonorepoProject 未来要如何使用。发版标签为 minor 。
10. 为其他被修改的包，也编写更新日志，说明内部的工具包如何使用 isMonorepoProject 。发版标签为 patch 。
