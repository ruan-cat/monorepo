---
"@ruan-cat/commitlint-config": major
---

templates/.czrc 模板的 commitizen adapter path 由裸模块名 "cz-git" 改写为 git 仓库根相对路径 "node_modules/cz-git"，适配 pnpm 12 全局 per-package 隔离布局。

BREAKING CHANGE: 新模板要求使用方项目在项目根本地安装 cz-git（`pnpm i -D cz-git`），且 git 仓库根与项目根一致；裸模块名写法在 pnpm 12 全局隔离布局下无法被 commitizen 解析（背景详见 notes 的 cz/bug-with-pnpm12.md）。通过 `commitlint-config init` 复制模板的项目将获得新写法。
