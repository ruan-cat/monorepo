import AutoImport from "unplugin-auto-import/vite";

export default AutoImport({
	imports: [
		// useAxios-for-01s 类型
		{
			type: true,
			from: "@ruan-cat/utils/vueuse/useAxios-for-01s/index.ts",
			imports: [
				"ParamsPathKey",
				"ParamsQueryKey",
				"ParamsBodyKey",
				"HttpParamWay",
				"AxiosRequestConfigBaseKey",
				"UseAxiosOptionsJsonVO",
				"UseAxiosOptionsImmediate",
				"JsonVO",
				"PageDTO",
			],
		},

		// useAxios-for-01s 函数与变量
		{
			"@ruan-cat/utils/vueuse/useAxios-for-01s/index.ts": [
				"UpType",
				"HttpCode",
				"MapContentTypeUpType",
				"useRequestIn01s",
			],
		},
	],
});
