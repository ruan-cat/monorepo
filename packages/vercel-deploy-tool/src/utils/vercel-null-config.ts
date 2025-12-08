/**
 * Vercel 的空配置
 * @description
 * 设计理由：
 *
 * 用于驱动vercel构建简单的目录结构，不需要额外的配置
 *
 * 该配置会被写入到 `vercel.null.def.json` 文件中
 *
 * @see https://github.com/amondnet/vercel-action#method-1---via-vercel-interface
 */
export const VERCEL_NULL_CONFIG = {
	framework: null,
	buildCommand: null,
	installCommand: null,
	outputDirectory: null,
	devCommand: null,
	public: false,
	/**
	 * 部署后提供干净的链接
	 * @see https://vercel.com/docs/projects/project-configuration#cleanurls
	 *
	 * @description
	 * 暂无效果
	 *
	 * 目前在 build-output-api 中，实现cleanUrls需要手动地写入配置文件
	 *
	 * 成本较大，目前不做投入。
	 */
	cleanUrls: true,
	git: {
		deploymentEnabled: {
			main: false,
		},
	},
} as const;

/**
 * 空配置文件的路径
 * @description
 * 生成空配置文件。这样用户在其他项目内，就不需要自己提供vercel配置文件了。
 */
export const VERCEL_NULL_CONFIG_PATH = "./vercel.null.def.json";

/** Vercel文件api指定要求的文件目录 */
export const VERCEL_OUTPUT_STATIC = ".vercel/output/static";
