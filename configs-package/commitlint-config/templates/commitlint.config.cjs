// commitlint.config.cjs
/** @type {import('cz-git').UserConfig} */
module.exports = require("@ruan-cat/commitlint-config").getUserConfig({
	config: {
		// 推荐不打印提交范围
		isPrintScopes: false,
	},
});
