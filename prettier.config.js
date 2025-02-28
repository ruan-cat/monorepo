// @ts-check
/** @type {import("prettier").Config} */
const config = {
	// FIXME: 该配置导致md文件格式化时收到干扰 配置不是热更新的 而且忽略配置是失效的
	// plugins: ["prettier-plugin-lint-md"],
	singleQuote: false,
	printWidth: 120,
	semi: true,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "auto",
	// "space-around-alphabet": true,
	// "space-around-number": true,
	// "no-empty-code-lang": false,
	// "no-empty-code": false,
};

export default config;
