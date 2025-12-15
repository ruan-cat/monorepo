import type { PnpmWorkspaceYamlSchema } from "pnpm-workspace-yaml";

/**
 * pnpm-workspace.yaml 文件的类型声明
 * @description
 * 现在是 pnpm-workspace-yaml 提供的 `PnpmWorkspaceYamlSchema` 类型
 *
 * @see https://github.com/antfu/pnpm-workspace-utils/blob/main/packages/pnpm-workspace-yaml/src/index.ts#L4
 */
export type PnpmWorkspace = PnpmWorkspaceYamlSchema;
