import { readFileSync, writeFileSync } from "fs";

import { program } from "commander";
import { consola } from "consola";
import { isUndefined } from "lodash-es";
import yaml from "js-yaml";
import prettier from "prettier";

import prettierConfig from "../prettier.config.js";

program
	.name("yaml-in-md")
	// 环境变量的地址
	.option("--md <path>", "目标md文件的地址，目前仅考虑单个文件")
	.parse();

const options = program.opts();
consola.info(" 查看命令行提供的参数 ", options);
consola.info(` 当前运行的地址为： ${process.cwd()} `);

/** md文件的地址 */
const defMdPath: string = options?.md;

if (isUndefined(defMdPath)) {
	consola.error(" 请提供md文件的地址 ");
	process.exit(1);
}

interface Params {
	mdPath?: string;
	data: Record<string, unknown>;
}

export async function writeYaml2md(params: Params) {
	const { mdPath = defMdPath, data } = params;

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

	// Format with prettier using project config
	const formattedContent = await prettier.format(newContent, {
		parser: "markdown",
		...prettierConfig,
	});

	// Write back to file
	writeFileSync(mdPath, formattedContent, "utf-8");

	consola.success(` 已将YAML数据写入到 ${mdPath} `);
}
