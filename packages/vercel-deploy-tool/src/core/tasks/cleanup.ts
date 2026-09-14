import { spawnSync } from "node:child_process";
import { consola } from "consola";
import type { VercelDeployConfig } from "../../config/schema";
import { createVercelSpawnOptions, getVercelScopeArg, getVercelTokenArg } from "../vercel";
import {
	parseDeploymentsJson,
	buildCleanupPlan,
	chunkUrls,
	type ListedDeployment,
	type LsJsonOutput,
} from "../cleanup-plan";

/** 列取部署时的最大翻页次数，防止后端游标回环导致死循环 */
const MAX_CLEANUP_PAGES = 10;

/**
 * 从 `vercel ls --format json` 的 stdout 顶层读取分页游标
 * @description
 * 防御式读取：JSON 语法错误（理论上已被 parseDeploymentsJson 抛错）或非对象结构一律回退为 undefined。
 * 游标缺失即视为末页，由调用方终止翻页。
 */
function extractCursor(raw: string): string | number | null | undefined {
	try {
		const parsed = JSON.parse(raw) as LsJsonOutput;

		if (parsed.pagination && typeof parsed.pagination === "object" && "cursor" in parsed.pagination) {
			const cursor = (parsed.pagination as { cursor?: string | number | null }).cursor;
			return cursor ?? undefined;
		}
	} catch {
		// 游标读取属于辅助逻辑，失败不应影响主流程，交由调用方按末页处理
	}

	return undefined;
}

/**
 * 列取项目下的全部部署（带翻页）
 * @description
 * 使用 `vercel ls <vercelProjectName> --format json` 列取，并跟随响应 `pagination.cursor`
 * 追加 `-N <cursor>` 继续翻页。最多 {@link MAX_CLEANUP_PAGES} 页；游标缺失或连续两页不前进即终止。
 *
 * 注意：列取命令的项目名以位置参数传入，这是只读操作；
 * 删除操作（见调用方）只允许显式 url 列表，**绝不以项目名作为 remove 参数**。
 *
 * @param config 部署配置（读取 vercelProjectName）
 * @param scope 已展开的 `--scope` 参数
 * @param token 已展开的 `--token` 参数
 * @throws 列取非零退出或 stdout 无法解析时抛出，由上层 try/catch 兜底（不阻塞部署）
 */
function listAllDeployments(config: VercelDeployConfig, scope: string[], token: string[]): ListedDeployment[] {
	const all: ListedDeployment[] = [];
	let page = 0;
	let cursor: string | number | null | undefined;
	let prevCursor: string | undefined;

	while (page < MAX_CLEANUP_PAGES) {
		const args = ["ls", config.vercelProjectName, "--format", "json", ...scope, ...token];

		if (cursor !== undefined) {
			args.push("-N", String(cursor));
		}

		const result = spawnSync(
			"vercel",
			args,
			createVercelSpawnOptions("pipe", { maxBuffer: 32 * 1024 * 1024, captureStderr: true }),
		);

		if (result.error) {
			throw new Error(`列取部署失败（第 ${page + 1} 页）: ${result.error.message}`);
		}

		if (result.status !== 0) {
			const stderr = result.stderr?.toString()?.trim() ?? "";
			throw new Error(`列取部署失败（第 ${page + 1} 页，退出码 ${result.status}）: ${stderr}`);
		}

		const raw = String(result.stdout ?? "");
		const deployments = parseDeploymentsJson(raw);

		all.push(...deployments);

		cursor = extractCursor(raw);
		page++;

		// 游标缺失 → 末页；游标不前进 → 防止后端回环导致的死循环
		if (cursor == null) break;
		if (prevCursor !== undefined && String(cursor) === prevCursor) break;
		prevCursor = String(cursor);
	}

	if (page >= MAX_CLEANUP_PAGES && cursor != null) {
		consola.warn(`已达到最大翻页上限 ${MAX_CLEANUP_PAGES}，后续部署未纳入清理范围`);
	}

	return all;
}

/**
 * 创建「部署后自动清理旧部署」任务
 * @description
 * 返回 `{ name, fn }` 形态，与 AfterBuild 等任务保持一致。
 *
 * 行为要点（详见 task-3-brief.md）：
 * - `deploymentCleanup.isEnable !== true` 时，fn 仅输出提示后 return，不做任何清理。
 * - 整个 fn 包裹在 try/catch 中：清理失败一律 `consola.warn` 后 return，**绝不影响部署结果**。
 * - 删除只允许显式 url 列表（`vercel remove <url...>`），禁止以项目名整删。
 * - 删除串行分批（spawnSync），不并发。
 * - BUILDING/QUEUED/INITIALIZING 由计划层（buildCleanupPlan）保证跳过。
 *
 * @param config Vercel 部署配置
 * @returns 任务描述对象，name 为任务名，fn 为可执行函数
 */
export function createCleanupTask(config: VercelDeployConfig): { name: string; fn: () => Promise<void> } {
	const name = "Cleanup: 清理旧部署";
	const cfg = config.deploymentCleanup;

	const fn = async (): Promise<void> => {
		// 未开启：与 AfterBuild 无任务同款形态，返回提示后退出
		if (cfg?.isEnable !== true) {
			consola.info("未开启部署后自动清理（deploymentCleanup.isEnable !== true），跳过");
			return;
		}

		try {
			const scope = getVercelScopeArg(config);
			const token = getVercelTokenArg(config);
			const keepProductionCount = cfg.keepProductionCount ?? 10;
			const keepPreviewCount = cfg.keepPreviewCount ?? 5;

			// 1. 列取全部部署（带翻页）
			const all = listAllDeployments(config, scope, token);

			// 2. 计算清理计划（BUILDING 等状态由计划层跳过）
			const plan = buildCleanupPlan(all, { keepProductionCount, keepPreviewCount });

			consola.info(
				`清理计划: 共 ${plan.summary.total} 个部署，` +
					`保留 production ${plan.summary.keepProduction} / preview ${plan.summary.keepPreview}，` +
					`待删除 ${plan.summary.deleteCount}（跳过 ${plan.summary.skipBuilding} 个 building 状态）`,
			);

			if (plan.summary.deleteCount === 0) {
				consola.info("没有需要删除的旧部署");
				return;
			}

			// 3. 输出计划明细（每条 DELETE 一行）
			for (const entry of plan.entries) {
				if (entry.action === "DELETE") {
					consola.info(`待删除: ${entry.url} | state=${entry.state} | target=${entry.target}`);
				}
			}

			// 4. 分批串行删除（只用显式 url 列表，禁止项目名整删）
			const urlsToDelete = plan.entries.filter((entry) => entry.action === "DELETE").map((entry) => entry.url);
			const batches = chunkUrls(urlsToDelete);
			const safeOpt = cfg.isKeepAliased !== false ? ["--safe"] : [];

			let failedBatches = 0;

			for (const batch of batches) {
				// 红线：remove 参数只能是 url 列表，绝不出现项目名
				const removeArgs = ["remove", ...batch, "--yes", ...safeOpt, ...scope, ...token];
				const removeResult = spawnSync(
					"vercel",
					removeArgs,
					createVercelSpawnOptions("pipe", { maxBuffer: 32 * 1024 * 1024, captureStderr: true }),
				);

				if (removeResult.error || removeResult.status !== 0) {
					failedBatches++;
					const reason = removeResult.stderr?.toString()?.trim() || removeResult.error?.message || "非零退出";
					consola.warn(`分批删除失败（${batch.length} 个 url）: ${reason}`);
					continue;
				}

				consola.success(`已删除 ${batch.length} 个旧部署`);
			}

			// 5. 汇总
			if (failedBatches > 0) {
				consola.warn(`清理完成，但有 ${failedBatches} 批删除失败（不影响部署结果）`);
			} else {
				consola.success("旧部署清理完成");
			}
		} catch (err) {
			// 红线：清理失败不得影响部署结果
			consola.warn("清理旧部署失败（不影响部署结果）", err);
			return;
		}
	};

	return { name, fn };
}
