# 部署后自动清理旧部署

每次向 Vercel 推送部署都会占用 **Deployment Storage** 额度。长期累积的旧部署若不及时清理，额度会随部署次数单调增长，最终触发 Vercel 的存储上限告警甚至计费。`vercel-deploy-tool` 提供「部署后自动清理旧部署」能力，在每次部署成功后增量回收历史部署，把额度增长压在可控范围。

## 功能定位

- **增量维护**：每次部署成功后自动清理历史部署，按「生产 / 预览」分别保留最近若干个，防止 Deployment Storage 额度随部署次数无限增长。
- **与 `clean-vercel-deployment-storage` 技能的职责边界**：两者互补、不冲突。

| 维度     | 本功能（部署后自动清理）                 | `clean-vercel-deployment-storage` 技能          |
| -------- | ---------------------------------------- | ----------------------------------------------- |
| 触发方式 | 随每次 `vdt deploy` 自动执行（可开关）   | 手动触发，一次性执行                            |
| 适用场景 | 日常「细水长流」式维护，防止额度缓慢累积 | 额度已积压 / 已告警时的大清理，回收大量历史部署 |
| 清理粒度 | 按保留名额保留最近 N 个，其余删除        | 按条件批量清理历史部署                          |
| 依赖     | 包内置，配置即生效                       | 独立技能，需单独调用                            |

> 建议：首次接入或额度已告警时，先用 `clean-vercel-deployment-storage` 技能做一次大清理，再开启本功能进行日常维护。

## 配置

在 `vercel-deploy-tool.config.ts` 的 `defineConfig` 中增加 `deploymentCleanup` 字段：

```typescript
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	vercelProjectName: "my-awesome-project",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",

	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./packages/docs",
			url: ["docs.example.com"],
			userCommands: ["pnpm build:docs"],
			outputDirectory: "docs/.vitepress/dist",
		},
	],

	// 部署后自动清理旧部署（默认关闭，需显式开启）
	deploymentCleanup: {
		// 是否开启：必须显式置 true，否则完全不清理
		isEnable: true,
		// 保留最近 N 个生产部署
		keepProductionCount: 10,
		// 保留最近 N 个预览部署
		keepPreviewCount: 5,
		// 删除时是否保护带活跃 alias 的部署（--safe）
		isKeepAliased: true,
	},
});
```

### 默认值表

未配置 `deploymentCleanup` 时不进行任何清理。已配置但某字段缺省时，按以下默认值生效：

| 字段                  | 类型      | 默认值  | 说明                                               |
| --------------------- | --------- | ------- | -------------------------------------------------- |
| `isEnable`            | `boolean` | `false` | 是否开启；**必须显式置 `true` 才生效**             |
| `keepProductionCount` | `number`  | `10`    | 保留最近 N 个生产部署（`target === "production"`） |
| `keepPreviewCount`    | `number`  | `5`     | 保留最近 N 个预览部署（其余 `target` 均视为预览）  |
| `isKeepAliased`       | `boolean` | `true`  | 删除时附带 `--safe`，跳过带活跃 alias 的部署       |

## 行为说明

1. **保留策略**：生产（`target === "production"`）与预览（其余 `target`，含缺失）两组分别按 `createdAt` 降序排列，各自保留最近 `keepProductionCount` / `keepPreviewCount` 个，其余进入删除列表。
2. **跳过中间态**：处于 `BUILDING` / `QUEUED` / `INITIALIZING` 状态的部署，既不参与保留名额、也不会被删除，避免误删正在构建中的部署。
3. **`--safe` alias 保护**：删除命令默认附带 `--safe`，Vercel 会自动跳过仍绑定活跃自定义域名（alias）的部署。`isKeepAliased: false` 可关闭该保护（不推荐）。
4. **失败不阻塞部署**：整个清理流程包裹在 `try/catch` 中，任何异常（列取失败、删除失败等）一律仅 `consola.warn` 告警后 `return`，**绝不影响部署最终结果**。
5. **日志形态**：运行时按「列取 → 计划明细 → 分批删除 → 汇总」四个阶段输出，便于核对清理范围。

典型日志示例：

```plain
✔ 6. 清理旧部署
清理计划: 共 23 个部署，保留 production 10 / preview 5，待删除 8（跳过 1 个 building 状态）
待删除: notes-f28lutryb-ruancat-projects.vercel.app | state=READY | target=production
待删除: notes-g7h2m9k1-ruancat-projects.vercel.app | state=READY | target=preview
...
已删除 8 个旧部署
旧部署清理完成
```

若删除过程中某批次失败，会单独告警并继续后续批次，最终汇总失败批次数，例如：

```plain
分批删除失败（8 个 url）: ...
清理完成，但有 1 批删除失败（不影响部署结果）
```

底层纯函数（解析列表、`buildCleanupPlan`、分批切分）实现见 `src/core/cleanup-plan.ts`，任务封装与 CLI 调用见 `src/core/tasks/cleanup.ts`。

## 版本要求

- **vercel CLI ≥ 50.5.0**：清理依赖 `vercel ls <project-name> --format json`（结构化列取部署），该能力自 `50.5.0` 引入。低于该版本将因无法解析 JSON 列表而失败。
- 本包的 `peerDependencies` 已声明 `vercel: ">=50.5.0"`，请确保使用方项目安装满足该下限的 CLI。

`ls --format json` 能力下限的二分实证（在 npm 历史版本上逐一验证）：

| 二分区间          | 抽取验证版本 | `vercel deployment ls --format json` 是否可用 | 结论                  |
| ----------------- | ------------ | --------------------------------------------- | --------------------- |
| `< 50.0.0`        | `49.2.0`     | 否（不支持 `--format` / 输出非 JSON）         | 下限在 50.x           |
| `50.0.0 ~ 50.4.x` | `50.0.0`     | 否                                            | 下限 > 50.4           |
| `50.5.0`          | `50.5.0`     | 是                                            | **确认下限 = 50.5.0** |
| `>= 50.5.0`       | `51.0.0`     | 是                                            | 向后兼容              |

## 红线提示

> ⚠️ **删除操作只允许使用显式 url 列表形态：`vercel remove <url...> --yes [--safe]`。**
>
> **绝不使用 `vercel remove <project-name>` 的项目名整删形态** —— 该形态会删除整个项目的全部部署，存在一次性清空线上部署的重大事故风险。本项目名仅作为只读列取命令（`vercel ls <project-name> --format json`）的位置参数出现，绝不作为删除参数。
