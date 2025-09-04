import { projects } from "../../src/types";

export default {
	paths() {
		const result = projects.map((project) => ({
			params: {
				project: project.name,
			},
		}));

		// console.log(result);

		const test = [
			{ params: { project: "09oa" } },
			{ params: { project: "10wms" } },
			{ params: { project: "10wms-doc" } },
			{ params: { project: "11comm" } },
			{ params: { project: "11comm-doc" } },
			{ params: { project: "01s-doc" } },
			{ params: { project: "utils" } },
			{ params: { project: "vitepress-preset" } },
			{ params: { project: "domain" } },
			{ params: { project: "vercel-deploy-tool" } },
			{ params: { project: "ruan-cat-notes" } },
			{ params: { project: "rmmv-notes" } },
			{ params: { project: "drill-doc" } },
			{ params: { project: "rmmv-api-doc" } },
		];

		return test;
	},
};
