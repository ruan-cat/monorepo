import { type ProjectName } from "./types";
import { projectLikeDomainSet } from "./domains";

/** 根据项目名称获取域名数组 */
export function getDomains(projectName: ProjectName) {
	return projectLikeDomainSet[projectName].map((projectLikeDomain) => {
		const { secondLevelDomain, topLevelDomain } = projectLikeDomain;
		return `${secondLevelDomain}.${topLevelDomain}`;
	});
}
