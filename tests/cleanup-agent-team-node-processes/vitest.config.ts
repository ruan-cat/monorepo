import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		name: "cleanup-agent-team-node-processes",
		environment: "node",
		include: ["agent-team-node-cleanup.test.ts", "agent-team-node-cleanup-structure.test.ts"],
		testTimeout: 15_000,
	},
});
