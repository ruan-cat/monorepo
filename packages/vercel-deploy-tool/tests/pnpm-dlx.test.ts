import { execa } from "execa";
import { consola } from "consola";
import { generateSimpleAsyncTask } from "@ruan-cat/vercel-deploy-tool/src/utils/simple-promise-tools.ts";
import { executePromiseTasks } from "@ruan-cat/vercel-deploy-tool/src/utils/define-promise-tasks";

/**
 * 生成简单的 execa 函数
 * @description
 * 对 execa 做简单的包装
 */
function generateExeca(execaSimpleParams: { command: string; parameters: string[] }) {
	const { command, parameters } = execaSimpleParams;
	return generateSimpleAsyncTask(() => execa(command, parameters, { shell: true }));
}

const copyDistTasks = (<const>[
	"pnpm -C=./ pnpm dlx rimraf .vercel/output/static",
	"pnpm -C=./ pnpm dlx mkdirp .vercel/output/static",
]).map((command) => {
	return generateSimpleAsyncTask(async function () {
		const commandFunction = generateExeca({
			command,
			parameters: [],
		});
		const { code, stdout } = await commandFunction();
		console.info(` 执行了命令： `, command);
		console.log(stdout);
	});
});

executePromiseTasks({
	type: "queue",
	tasks: copyDistTasks,
});
