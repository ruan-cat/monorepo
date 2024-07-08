// @ts-check
/** @type {import("prettier").Config} */
const config = {
	singleQuote: false,
	printWidth: 120,
	semi: true,
	jsxSingleQuote: true,
	useTabs: true,
	tabWidth: 2,
	endOfLine: "auto",
	overrides: [
		{
			files: "*.md",
			options: {
				parser: "markdown",
			},
		},
	],
};

export default config;
