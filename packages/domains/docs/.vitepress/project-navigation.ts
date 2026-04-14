import { projects } from "../../src/types";

type ProjectItem = (typeof projects)[number];

function hasOrder(project: ProjectItem): project is ProjectItem & { order: number } {
	return typeof project.order === "number";
}

export function getSortedProjects(): ProjectItem[] {
	return projects
		.map((project, index) => ({ project, index }))
		.toSorted((left, right) => {
			const leftHasOrder = hasOrder(left.project);
			const rightHasOrder = hasOrder(right.project);

			if (leftHasOrder && rightHasOrder) {
				return left.project.order - right.project.order;
			}

			if (leftHasOrder) {
				return -1;
			}

			if (rightHasOrder) {
				return 1;
			}

			return left.index - right.index;
		})
		.map(({ project }) => project);
}

export function getProjectSidebarItems() {
	return getSortedProjects().map((project) => ({
		text: project.name,
		link: `/domain/${project.name}`,
	}));
}

export function getProjectRoutePaths() {
	return getSortedProjects().map((project) => ({
		params: {
			project: project.name,
		},
	}));
}
