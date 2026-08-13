/** Generated at build time; runtime never reads Git or process.env. */
export const BUILD_GIT_SHA = "2ec3cefcd1e2f68a5ce719731bf68007ce1e43af";

export interface BuildInfo {
	buildGitSha: string;
}

export const buildInfo: BuildInfo = { buildGitSha: BUILD_GIT_SHA };
