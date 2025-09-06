import { projects } from "../../src/types";

export default {
	paths() {
		const result = projects.map((project) => ({
			params: {
				project: project.name,
			},
		}));
		return result;
	},
};
