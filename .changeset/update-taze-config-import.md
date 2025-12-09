---
"@ruan-cat/taze-config": patch
---

**修复：更新 `isMonorepoProject` 导入路径以适配 `@ruan-cat/utils` 的变更**

## 变更说明

为了适配 `@ruan-cat/utils` 包的重构（`isMonorepoProject` 函数不再从主入口导出），更新了导入路径。

## 具体修改

```typescript
// 修改前
import { isMonorepoProject } from "@ruan-cat/utils";

// 修改后
import { isMonorepoProject } from "@ruan-cat/utils/node-esm";
```

## 影响范围

此变更仅影响内部实现，不影响包的对外 API 和功能。用户无需做任何调整。
