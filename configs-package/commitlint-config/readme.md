# commitlint.config.cjs 配置

commitlint.config.cjs 的配置，是 cjs 的包。

## 安装

```bash
pnpm i -D commitizen cz-git @ruan-cat/commitlint-config
```

本库应当作为开发环境依赖。其中，commitizen 和 cz-git 为本依赖包的对等依赖。

## 使用方式

```js
// commitlint.config.cjs
module.exports = require("@ruan-cat/commitlint-config").default;
```
