/**
 * 清理旧部署的纯函数层
 *
 * 该模块只负责"解析部署列表 → 计算保留/删除计划 → 分批切分"三件纯函数工作，
 * 不依赖 Vercel CLI、不触碰文件系统、不感知 alias 保护（alias 保护由 CLI 侧
 * `--safe` 兜底）。所有语义约定以 task-2-brief.md 的「语义约定」段为唯一事实来源。
 */

/** ls --format json 的部署条目（防御式子集，其余字段忽略） */
export interface ListedDeployment {
	url: string;
	name?: string;
	state?: string;
	target?: string;
	createdAt?: number;
}

/** ls --format json 整体输出（兼容 50.5.0 ~ 58.x 差异） */
export interface LsJsonOutput {
	deployments?: ListedDeployment[];
	pagination?: { cursor?: string | number | null } | unknown;
}

/** 清理动作 */
export type CleanupAction = "KEEP" | "DELETE" | "SKIP-BUILDING";

export interface CleanupEntry {
	url: string;
	state: string;
	target: string;
	createdAt: number;
	action: CleanupAction;
}

export interface CleanupSummary {
	total: number;
	keepProduction: number;
	keepPreview: number;
	deleteCount: number;
	skipBuilding: number;
}

/** 强制跳过清理的部署状态：处于这些状态的部署既不被保留也不被删除 */
export const SKIP_BUILDING_STATES = ["BUILDING", "QUEUED", "INITIALIZING"];

/** 每批 remove 的最大 url 数（控制单命令长度） */
export const REMOVE_BATCH_SIZE = 20;

/**
 * 解析 `vercel deployment ls --format json` 的输出文本
 *
 * 语义约定：
 * - 优先取对象 `.deployments`；
 * - 若 raw 本身是裸数组则直接使用；
 * - `deployments` 缺失或非数组 → 返回 `[]`；
 * - 无 `url` 字段的条目丢弃；
 * - JSON 语法错误抛 `Error`。
 *
 * @param raw `vercel deployment ls --format json` 的 stdout 原始文本
 */
export function parseDeploymentsJson(raw: string): ListedDeployment[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(`无法解析部署列表 JSON：${(error as Error).message}`);
	}

	let candidate: unknown;

	if (Array.isArray(parsed)) {
		candidate = parsed;
	} else if (parsed && typeof parsed === "object" && "deployments" in parsed) {
		candidate = (parsed as LsJsonOutput).deployments;
	} else {
		return [];
	}

	if (!Array.isArray(candidate)) {
		return [];
	}

	return candidate.filter(
		(item): item is ListedDeployment =>
			!!item && typeof item === "object" && typeof (item as ListedDeployment).url === "string",
	);
}

/**
 * 根据保留名额计算清理计划
 *
 * 语义约定：
 * - production = `target === "production"`；其余（含 target 缺失）视为预览；
 * - 两组分别按 `createdAt` 降序保留前 N（`createdAt` 缺失按 0 处理）；
 * - `state ∈ SKIP_BUILDING_STATES` 强制 `SKIP-BUILDING`（不占保留名额也不删）；
 * - alias 保护在 CLI 侧 `--safe` 兜底，计划层不感知。
 *
 * @param deployments 解析后的部署列表
 * @param options.keepProductionCount production 组保留数量
 * @param options.keepPreviewCount preview 组保留数量
 */
export function buildCleanupPlan(
	deployments: ListedDeployment[],
	options: { keepProductionCount: number; keepPreviewCount: number },
): { summary: CleanupSummary; entries: CleanupEntry[] } {
	const productionKeep = Math.max(0, options.keepProductionCount);
	const previewKeep = Math.max(0, options.keepPreviewCount);

	// 收集两条分组内的条目（保留原始引用，便于回填）
	const productionItems: ListedDeployment[] = [];
	const previewItems: ListedDeployment[] = [];

	for (const deployment of deployments) {
		if (deployment.target === "production") {
			productionItems.push(deployment);
		} else {
			previewItems.push(deployment);
		}
	}

	const actionByUrl = new Map<string, CleanupAction>();

	// 在单组内部按 createdAt 降序决定 KEEP / DELETE，SKIP 状态强制跳过且不占位
	const resolveGroup = (items: ListedDeployment[], keepCount: number): void => {
		// 先标记所有 SKIP 状态（不占名额、不删除）
		const pending: ListedDeployment[] = [];

		for (const item of items) {
			if (item.state && SKIP_BUILDING_STATES.includes(item.state)) {
				actionByUrl.set(item.url, "SKIP-BUILDING");
			} else {
				pending.push(item);
			}
		}

		const sorted = [...pending].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

		sorted.forEach((item, index) => {
			actionByUrl.set(item.url, index < keepCount ? "KEEP" : "DELETE");
		});
	};

	resolveGroup(productionItems, productionKeep);
	resolveGroup(previewItems, previewKeep);

	// 按原始输入顺序回填 entries
	const entries: CleanupEntry[] = deployments.map((deployment) => ({
		url: deployment.url,
		state: deployment.state ?? "",
		target: deployment.target ?? "",
		createdAt: deployment.createdAt ?? 0,
		action: actionByUrl.get(deployment.url) ?? "DELETE",
	}));

	const summary: CleanupSummary = {
		total: entries.length,
		keepProduction: entries.filter((entry) => entry.action === "KEEP" && entry.target === "production").length,
		keepPreview: entries.filter((entry) => entry.action === "KEEP" && entry.target !== "production").length,
		deleteCount: entries.filter((entry) => entry.action === "DELETE").length,
		skipBuilding: entries.filter((entry) => entry.action === "SKIP-BUILDING").length,
	};

	return { summary, entries };
}

/**
 * 将 url 列表按批次大小切分
 *
 * 语义约定：默认每批 20；空数组 → `[]`。
 *
 * @param urls 待切分的 url 列表
 * @param size 每批最大数量，默认 {@link REMOVE_BATCH_SIZE}
 */
export function chunkUrls(urls: string[], size: number = REMOVE_BATCH_SIZE): string[][] {
	if (urls.length === 0) {
		return [];
	}

	const batchSize = Math.max(1, size);
	const chunks: string[][] = [];

	for (let index = 0; index < urls.length; index += batchSize) {
		chunks.push(urls.slice(index, index + batchSize));
	}

	return chunks;
}
