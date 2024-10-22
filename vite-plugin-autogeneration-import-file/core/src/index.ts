import fg from "fast-glob";
import micromatch from "micromatch";
import * as fs from "fs";
import * as path from "path";
import { normalizePath } from "vite";

interface codeTemplate {
	key: string; //标识符
	template: string; //模板 codeTemplate.template里的{{name}}会被替换为name
	value?: string; //根据模板自动生成，不可传入
}

type DirOption = {
	/** 遍历路径 */
	dir: string;

	/** 写入目标文件地址 */
	toFile: string;

	/** 匹配规则 参考 fast-glob */
	pattern: fg.Pattern | fg.Pattern[];

	/** fast-glob 匹配参数 */
	options?: fg.Options;

	/** 名称 当为字符串时里面的{{name}}会被替换为格式化后的驼峰名称, */
	name?: string | ((fileName: string) => string);

	/** 自定义名称函数 */
	nameFunction?: (name: string) => string;

	/** 代码模板 */
	codeTemplates?: codeTemplate[];

	/**
	 * 文件模板
	 * @description
	 * 会递归循环codeTemplates把template里的codeTemplate.key替换为对应的codeTemplate.value
	 */
	template?: string;
};

type DirOptions = DirOption[];

/** path转驼峰变量名并剔除最后的index/Index */
export const getName = function (
	fileName: string,
	nameTemplate: string | ((name: string) => string) = "{{name}}",
): string {
	if (typeof nameTemplate == "function") {
		return nameTemplate(fileName);
	}
	const index = fileName.lastIndexOf(".");
	if (index > 0) {
		fileName = fileName.slice(0, index);
	}
	let fileNameArr = nameTemplate
		.replace(/\{\{name\}}/g, fileName.replace(/\\/g, "/"))
		.replace(/[\/-]/g, "_")
		.split("_");
	if (fileNameArr[fileNameArr.length - 1] == "index" || fileNameArr[fileNameArr.length - 1] == "Index") {
		fileNameArr.pop();
	}
	for (let i = 1, len = fileNameArr.length; i < len; i++) {
		fileNameArr[i] = fileNameArr[i].slice(0, 1).toUpperCase() + fileNameArr[i].slice(1);
	}
	return fileNameArr.join("");
};

/** 获取导入文件绝对地址 */
export const getFileImportPath = function (dir: string, fileName: string): string {
	fileName = path.resolve(dir, fileName);
	if (fileName.endsWith(".ts")) {
		fileName = fileName.slice(0, -3);
	}
	return fileName;
};

/** 获取导入文件代码 */
export const getCode = function (
	dir: string,
	fileName: string,
	toFile: string,
	name: string | ((name: string) => string) = undefined,
	codeTemplates: codeTemplate[] = [],
): codeTemplate[] {
	const filePath = getFileImportPath(dir, fileName);
	let relativePath = normalizePath(path.relative(path.dirname(path.resolve(toFile)), filePath));
	if (!relativePath.startsWith("../")) {
		relativePath = "./" + relativePath;
	}
	fileName = getName(fileName, name);
	let codeTemplate: codeTemplate[] = JSON.parse(JSON.stringify(codeTemplates));
	if (!codeTemplate.length) {
		codeTemplate.push({
			key: "//code",
			template: 'export { default as {{name}} } from "{{path}}"\n',
		});
	}
	codeTemplate.forEach((item) => {
		item.value = item.template.replace(/\{\{name\}\}/g, fileName).replace(new RegExp("{{path}}", "g"), relativePath);
	});
	return codeTemplate;
};

export function readFileSync(
	...args: Parameters<typeof fs.readFileSync>
): ReturnType<typeof fs.readFileSync> | undefined {
	try {
		return fs.readFileSync(...args);
	} catch {
		return undefined;
	}
}

export const createPlugin = () => {
	let isServer = false;
	let loadFiles: { fileName: string; name: string; dir: string }[][] = [];
	let tmpRemovePaths: string[] = [];
	const toFileContents: Map<string, string> = new Map();

	const loadPath = async function (
		optionIndex: number,
		dir: string,
		toFile: string,
		pattern: fg.Pattern | fg.Pattern[],
		options: fg.Options,
		name: string | ((name: string) => string) = undefined,
		template: string = "",
		codeTemplates: codeTemplate[] = [],
	) {
		const entries = await fg(pattern, Object.assign({ cwd: dir, dot: true }, options));
		let str = template ? template : "//当前文件由vite-plugin-autogeneration-import-file自动生成\n//code";
		entries.forEach((fileName) => {
			getCode(dir, fileName, toFile, name, codeTemplates).forEach((item) => {
				str = str.replace(item.key, item.value + item.key);
			});

			loadFiles[optionIndex].push({
				fileName,
				name: getName(fileName, name),
				dir,
			});
		});

		console.log(" 完成 loadFiles 准备 \n ", loadFiles);

		str && fs.writeFileSync(toFile, str);
		console.log(`mk ${toFile} success\n`);
	};

	// 可由unplugin-vue-components使用
	function resolver(componentInclude: number[], directiveInclude: number[] = []): any[] {
		let result = [];
		if (componentInclude.length) {
			result.push({
				type: "component",
				resolve: async (componentName: string) => {
					// console.log(" 看看外面已经被扫描到的组件名称有哪些？ ", componentName);
					for (const index of componentInclude) {
						let componentInfo = loadFiles[index].find(({ name }) => name == componentName);
						if (componentInfo) {
							// console.log(" 那些文件被注册了？ \n ", componentName, componentInfo);
							return normalizePath(path.resolve(componentInfo.dir, componentInfo.fileName));
						}
					}
				},
			});
		}

		if (directiveInclude.length) {
			result.push({
				type: "directive",
				resolve: async (directiveName: string) => {
					for (const index of directiveInclude) {
						let directiveInfo = loadFiles[index].find(
							({ name }) => name == directiveName || name == "V" + directiveName,
						);
						if (directiveInfo) {
							return normalizePath(path.resolve(directiveInfo.dir, directiveInfo.fileName));
						}
					}
				},
			});
		}

		return result;
	}

	function loadPathsPlugin(dirOptions: DirOptions) {
		return {
			name: "load-path-ts",

			configureServer() {
				//服务器启动时被调用
				dirOptions.forEach((dirOption, index) => {
					isServer = true;
					fs.watch(dirOption.dir, { recursive: true }, function (eventType: fs.WatchEventType, fileName: string) {
						fileName = normalizePath(fileName);
						if (eventType === "rename") {
							let str = <string>readFileSync(dirOption.toFile, "utf8") || "";
							let filePath = path.resolve(dirOption.dir, fileName);
							if (fs.existsSync(filePath)) {
								//存在
								let stat = fs.lstatSync(filePath);
								let changeFiles: string[] = [];
								let prefix = "";
								if (stat.isFile()) {
									if (micromatch.isMatch(fileName, dirOption.pattern)) {
										changeFiles = [fileName];
									}
								} else if (tmpRemovePaths.length && fs.existsSync(path.resolve(filePath, tmpRemovePaths[0]))) {
									//如果是重命名文件夹
									changeFiles = tmpRemovePaths;
									prefix = fileName + "/";
								}
								changeFiles.forEach((fileName) => {
									const code = getCode(
										dirOption.dir,
										prefix + fileName,
										dirOption.toFile,
										dirOption.name,
										dirOption.codeTemplates,
									);
									code.forEach((codeItem) => {
										str = str.replace(codeItem.key, codeItem.value + codeItem.key);
									});
									loadFiles[index].push({
										fileName: prefix + fileName,
										name: getName(prefix + fileName, dirOption.name),
										dir: dirOption.dir,
									});
								});
								if (changeFiles.length) {
									toFileContents.set(dirOption.toFile, str);
									fs.writeFileSync(dirOption.toFile, str);
									console.log(dirOption.toFile + " add code");
								}
								tmpRemovePaths = [];
							} else {
								//不存在文件
								let changeFiles: string[] = [];
								let delNumber = 0;
								loadFiles[index].slice(0).forEach((val, k) => {
									if (val.fileName.startsWith(fileName + "/") || val.fileName == fileName) {
										const code = getCode(
											dirOption.dir,
											val.fileName,
											dirOption.toFile,
											dirOption.name,
											dirOption.codeTemplates,
										);
										code.forEach((codeItem) => {
											str = str.replace(codeItem.value, "");
										});
										loadFiles[index].splice(k - delNumber, 1);
										delNumber++;
										changeFiles.push(val.fileName);
									}
								});
								if (changeFiles.length) {
									toFileContents.set(dirOption.toFile, str);
									fs.writeFileSync(dirOption.toFile, str);
									if (changeFiles[0] !== fileName) {
										//代表是文件夹改变
										tmpRemovePaths = changeFiles.map((name) => name.slice(fileName.length + 1));
									} else {
										tmpRemovePaths = [];
									}
									console.log(dirOption.toFile + " remove code");
								}
							}
						}
					});
				});
			},

			async buildStart() {
				let proArr: Promise<unknown>[] = [];
				dirOptions.forEach((dirOption, index) => {
					loadFiles[index] = [];
					proArr.push(
						loadPath(
							index,
							dirOption.dir,
							dirOption.toFile,
							dirOption.pattern,
							dirOption.options || {},
							dirOption.name,
							dirOption.template,
							dirOption.codeTemplates,
						),
					);
				});

				await Promise.allSettled(proArr);
				if (isServer) {
					dirOptions.forEach((dirOption) => {
						toFileContents.set(dirOption.toFile, readFileSync(dirOption.toFile, "utf8") as string);
						fs.watch(dirOption.toFile, {}, function (eventType: fs.WatchEventType, fileName: string) {
							const content = toFileContents.get(dirOption.toFile);
							if (content !== undefined && content !== readFileSync(dirOption.toFile, "utf8")) {
								fs.writeFileSync(dirOption.toFile, content);
							}
						});
					});
				}
			},
		};
	}

	return { autoImport: loadPathsPlugin, resolver };
};
