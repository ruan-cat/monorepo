import { readFileSync, writeFileSync } from "node:fs";

import { consola } from "consola";
import { isUndefined } from "lodash-es";
import yaml from "js-yaml";

export interface WriteYaml2mdParams<T = Record<string, any>> {
	/** 目标md文件地址 */
	mdPath: string;

	/** 被插入到md头部的数据 */
	data: T;
}

/**
 * 将YAML数据写入到MD文件内
 */
export function writeYaml2md<T>(params: WriteYaml2mdParams<T>) {
	consola.info(` 当前运行的地址为： ${process.cwd()} `);
	const { mdPath, data } = params;

	if (isUndefined(mdPath)) {
		consola.error(" 请提供md文件的地址 ");
		process.exit(1);
	}

	// Check if file exists
	try {
		readFileSync(mdPath, "utf-8");
	} catch (error) {
		consola.error(` 文件 ${mdPath} 不存在 `);
		process.exit(1);
	}

	// Read the existing MD file
	const mdContent = readFileSync(mdPath, "utf-8");

	// Convert data to YAML
	const yamlContent = yaml.dump(data);

	// Combine YAML with MD content
	const newContent = `---\n${yamlContent}---\n\n${mdContent}`;

	// 警告 暂不考虑使用本函数内的prettier功能 避免打包体积太大
	// Format with prettier using project config
	// const formattedContent = await prettier.format(newContent, {
	// 	parser: "markdown",
	// 	...prettierConfig,
	// });

	// Write back to file
	// writeFileSync(mdPath, formattedContent, "utf-8");
	writeFileSync(mdPath, newContent, "utf-8");

	consola.success(` 已将YAML数据写入到 ${mdPath} `);
}
