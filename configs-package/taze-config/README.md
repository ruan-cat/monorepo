# taze.config.ts 配置

阮喵喵自用的 taze.config.ts 的配置。目的是用预设的 taze 配置，实现依赖升级。

本依赖包仅仅是对外单纯地导出一个 ts 配置文件。

## 安装

```bash
pnpm i -D taze @ruan-cat/@ruan-cat/taze-config
```

taze 作为对等依赖，必须要安装。

## 使用方式

### 配置文件

在项目根目录内新建 `taze.config.ts` 文件。

```ts
// taze.config.ts
import { defineConfig } from "taze";
import { defaultConfig } from "@ruan-cat/taze-config";
export default defineConfig(defaultConfig);
```

### 准备运行命令

## 被封装的配置文件

如下所示：

<details>

<summary>
被封装的配置文件
</summary>

<!-- prettier-ignore-start -->
<!-- automd:file src="./src/taze.config.ts" code -->


<!-- /automd -->
<!-- prettier-ignore-end -->

</details>
