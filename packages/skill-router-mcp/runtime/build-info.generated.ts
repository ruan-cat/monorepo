/** Generated at build time; runtime never reads Git or process.env. */
export const BUILD_GIT_SHA = "047587cd136d546506cebd9af02f4ce4c5eb5172";

export interface BuildInfo {
	buildGitSha: string;
}

export const buildInfo: BuildInfo = { buildGitSha: BUILD_GIT_SHA };
