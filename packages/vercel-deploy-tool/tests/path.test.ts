import { dirname, resolve } from "node:path";

import { deleteAsync } from "del";
import { mkdirpSync } from "mkdirp";
import cpy from "cpy";

const targetCWD = `./packages/docs-01-star`;

/** vercel文件api指定要求的文件目录 */
const vercelOutputStatic = <const>".vercel/output/static";

const outputDirectory = "docs/.vitepress/dist/**/*";

/** 路径拼接工具 */
function joinPaths(dirs: string[]) {
	const resPath = resolve(targetCWD, ...dirs);
	console.log(" in joinPath => ", resPath);
	return <`${string}${typeof targetCWD}/${(typeof dirs)[number]}`>resPath;
}

/** 路径拼接工具 */
function joinPath<T extends string>(dir: T) {
	const resPath = resolve(targetCWD, dir);
	console.log(" in joinPath => ", resPath);
	return <`${string}${typeof targetCWD}/${T}`>resPath;
}

const pathVercelOutputStatic = joinPath(vercelOutputStatic);
const pathOutputDirectory = joinPath(outputDirectory);

async function delVercelOutputStatic() {
	await deleteAsync(pathVercelOutputStatic);
}

async function createVercelOutputStatic() {
	await mkdirpSync(pathVercelOutputStatic);
}

async function cpyDistToVercelOutputStatic() {
	await cpy(pathOutputDirectory, pathVercelOutputStatic);
}

async function main() {
	await delVercelOutputStatic();
	await createVercelOutputStatic();
	await cpyDistToVercelOutputStatic();
}

main();
