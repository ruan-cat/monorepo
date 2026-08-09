// 行为回归契约：覆盖清理入口的审计输出、安全门禁与 WorkBuddy 进程拓扑判定，避免维护时把保守策略误改成激进终止。
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const skillPath = resolve(repoRoot, "ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/SKILL.md");
const scriptPath = resolve(
	repoRoot,
	"ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/scripts/agent-team-node-cleanup.ps1",
);
const cleanupExecutionPath = resolve(
	repoRoot,
	"ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/scripts/lib/cleanup-execution.ps1",
);
const snapshotPath = resolve(testDir, "fixtures/workbuddy-process-snapshots.json");
const powershellTest = process.platform === "win32" ? test : test.skip;

interface ScriptResult {
	status: number | null;
	stdout: string;
	stderr: string;
}

interface SnapshotFixture {
	ListenerObservation: { Status: "known" | "unknown"; Reason: string | null };
	Processes: Array<Record<string, unknown>>;
	RevalidationProcesses?: Array<Record<string, unknown>>;
	ResampledProcesses?: Array<Record<string, unknown>>;
}

// 所有脚本调用都注入确定性快照；测试只观察 PowerShell 子进程结果，不依赖开发机当前进程状态。
function runScript(args: string[] = [], cwd = repoRoot, fixturePath = snapshotPath): ScriptResult {
	const result = spawnSync(
		"powershell.exe",
		["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", scriptPath, "-ProcessSnapshotPath", fixturePath, ...args],
		{
			cwd,
			encoding: "utf8",
			maxBuffer: 10 * 1024 * 1024,
		},
	);

	return {
		status: result.status,
		stdout: result.stdout,
		stderr: result.stderr,
	};
}

// Windows PowerShell 可能在 JSON 前写入 BOM，去除它才能让测试聚焦账本结构而非宿主编码差异。
function parseLedger(stdout: string) {
	return JSON.parse(stdout.trim().replace(/^\uFEFF/, ""));
}

function loadFixture(): SnapshotFixture {
	return JSON.parse(readFileSync(snapshotPath, "utf8")) as SnapshotFixture;
}

// 变体 fixture 写入独立临时目录，确保监听器异常、PID 复用和 respawn 场景不会污染共享基线数据。
function writeFixture(fixture: SnapshotFixture) {
	const fixtureDir = mkdtempSync(resolve(tmpdir(), "cleanup-agent-team-fixture-"));
	const fixturePath = resolve(fixtureDir, "snapshot.json");
	writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`, "utf8");
	return { fixtureDir, fixturePath };
}

// Apply 场景固定搭配临时 OutputPath；配合 -WhatIf 验证完整决策链，同时隔离真实终止与仓库落盘副作用。
function withTemporaryLedger(args: string[], fixturePath = snapshotPath) {
	const outputPath = resolve(tmpdir(), `agent-process-ledger-${crypto.randomUUID()}.json`);
	const result = runScript([...args, "-OutputPath", outputPath], repoRoot, fixturePath);
	return { outputPath, result };
}

describe("cleanup-agent-team-node-processes WorkBuddy hardening", () => {
	// 先锁定分发入口与默认 dry-run 契约，防止文档可发现性或无副作用审计能力在重构中退化。
	test("keeps a discoverable bilingual description and distributable relative script entry", () => {
		const skill = readFileSync(skillPath, "utf8");
		const description = skill.match(/^description:\s*\|-\s*\n([\s\S]*?)\nmetadata:/m)?.[1] ?? "";

		expect(description.trimStart()).toMatch(/^Use when/);
		expect(description).toContain("WorkBuddy prewarm pools");
		expect(description).toContain("当 Windows 或 PowerShell");
		expect(description.length).toBeGreaterThan(400);
		expect(skill).not.toMatch(
			/[A-Za-z]:\\|ai-plugins\/common-tools\/skills\/cleanup-agent-team-node-processes\/scripts/,
		);
		expect(existsSync(scriptPath)).toBe(true);
	});

	powershellTest("default dry-run audits WorkBuddy families without leaving a workspace ledger", () => {
		const cwd = mkdtempSync(resolve(tmpdir(), "cleanup-agent-team-dry-run-"));
		try {
			const result = runScript([], cwd);
			expect(result.status, result.stderr).toBe(0);

			const ledger = parseLedger(result.stdout);
			expect(ledger.ProcessName).toEqual(
				expect.arrayContaining(["workbuddy.exe", "agent-browser-win32-x64.exe", "bash.exe"]),
			);
			expect(ledger.ListenerObservation).toEqual({ Status: "known", Reason: null });
			expect(ledger.WorkBuddyGrouping).toBeTruthy();
			expect(readdirSync(cwd).filter((name) => name.startsWith("agent-process-ledger"))).toEqual([]);
		} finally {
			rmSync(cwd, { recursive: true, force: true });
		}
	});

	powershellTest("rejects dry-run OutputPath without creating a ledger", () => {
		const outputPath = resolve(tmpdir(), `agent-process-ledger-dry-run-${crypto.randomUUID()}.json`);
		try {
			const result = runScript(["-OutputPath", outputPath]);
			expect(result.status).not.toBe(0);
			expect(`${result.stdout}\n${result.stderr}`).toMatch(/OutputPath.*Apply|Apply.*OutputPath/i);
			expect(existsSync(outputPath)).toBe(false);
		} finally {
			rmSync(outputPath, { force: true });
		}
	});

	powershellTest("keeps the general cleanup path frozen under Apply WhatIf", () => {
		const processId = 88001;
		const fixture: SnapshotFixture = {
			ListenerObservation: { Status: "known", Reason: null },
			Processes: [
				{
					ProcessId: processId,
					ParentProcessId: 99001,
					Name: "node.exe",
					CommandLine: "node C:\\workspace\\general-fixture-token\\task.js",
					ExecutablePath: "C:\\Program Files\\nodejs\\node.exe",
					CreationDate: "2020-01-01T00:00:00Z",
				},
			],
		};
		const temporary = writeFixture(fixture);
		const applied = withTemporaryLedger(
			["-Apply", "-WhatIf", "-IncludePattern", "general-fixture-token"],
			temporary.fixturePath,
		);

		try {
			expect(applied.result.status, applied.result.stderr).toBe(0);
			const ledger = parseLedger(applied.result.stdout);
			expect(ledger.Summary.CandidateCount).toBe(1);
			expect(ledger.StopResults).toEqual([
				expect.objectContaining({ Pid: processId, Status: "what-if", Decision: "candidate" }),
			]);
			expect(ledger.Verification.RemainingCandidatePids).toEqual([processId]);
			expect(existsSync(applied.outputPath)).toBe(true);
		} finally {
			rmSync(applied.outputPath, { force: true });
			rmSync(temporary.fixtureDir, { recursive: true, force: true });
		}
	});

	test("revalidates general Apply PID identity before requesting a stop", () => {
		const executionSource = readFileSync(cleanupExecutionPath, "utf8");
		const generalCleanupSource = executionSource.match(
			/function Invoke-GeneralCleanupPlan[\s\S]*?(?=\nfunction Complete-CleanupVerification)/,
		)?.[0];

		expect(generalCleanupSource).toBeTruthy();
		expect(generalCleanupSource).toMatch(/Test-LiveProcessIdentity/);
		expect(generalCleanupSource).toMatch(/ExpectedName\s+\(\[string\]\$entry\.Name\)/);
		expect(generalCleanupSource).toMatch(/ExpectedCreationTime\s+\(\[string\]\$entry\.CreationTime\)/);
		expect(generalCleanupSource).toContain('Status                     = "skipped-pid-reused"');
	});

	powershellTest("skips a reused general PID without invoking Stop-Process", () => {
		const command = [
			"$ErrorActionPreference = 'Stop'",
			". $env:CLEANUP_PROCESS_OBSERVATION_PATH",
			". $env:CLEANUP_EXECUTION_PATH",
			"$map = @{ 12345 = [pscustomobject]@{ ProcessId = 12345; Name = 'other.exe'; CreationDate = '2020-01-01T00:00:00Z' } }",
			"$entry = [pscustomobject]@{ Pid = 12345; Name = 'node.exe'; CreationTime = '2020-01-01T00:00:00Z'; Decision = 'candidate' }",
			"$result = Invoke-GeneralCleanupPlan -CandidateEntries @($entry) -Force:$false -ProcessMap $map -CommandContext $null -WhatIfPreferenceValue:$false",
			"[Console]::Out.Write(($result.StopResults | ConvertTo-Json -Compress))",
		].join("; ");
		const encodedCommand = Buffer.from(command, "utf16le").toString("base64");
		const result = spawnSync(
			"powershell.exe",
			["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedCommand],
			{
				cwd: repoRoot,
				encoding: "utf8",
				env: {
					...process.env,
					CLEANUP_PROCESS_OBSERVATION_PATH: resolve(
						repoRoot,
						"ai-plugins/common-tools/skills/cleanup-agent-team-node-processes/scripts/lib/process-observation.ps1",
					),
					CLEANUP_EXECUTION_PATH: cleanupExecutionPath,
				},
			},
		);

		expect(result.status, result.stderr).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({ Pid: 12345, Status: "skipped-pid-reused" });
	});

	// WorkBuddy 拓扑测试保护显式与推断池的边界：只能收拢确切后代，且必须保留受保护角色、监听端口和敏感参数门禁。
	powershellTest("groups exact descendants, infers a conservative topology pool, and redacts credentials", () => {
		const result = runScript();
		expect(result.status, result.stderr).toBe(0);
		const ledger = parseLedger(result.stdout);
		const grouping = ledger.WorkBuddyGrouping;

		expect(grouping.CoreProcesses.map((entry: { Role: string }) => entry.Role)).toEqual(
			expect.arrayContaining(["daemon", "sidecar", "mcp-server"]),
		);
		const safePool = grouping.PrewarmPools.find((pool: { PoolId: string }) => pool.PoolId === "wb-pool-safe");
		expect(safePool.DescendantPids).toEqual([310, 320, 330]);
		expect(safePool.DescendantPids).not.toContain(410);
		expect(safePool.DescendantPids).not.toContain(700);
		expect(safePool.Decision).toBe("needs-confirmation");

		const inferredPool = grouping.PrewarmPools.find((pool: { Pid: number }) => pool.Pid === 1030);
		expect(inferredPool).toMatchObject({
			PoolId: null,
			Confidence: "medium",
			RecognitionMethod: "topology-inferred",
			Decision: "needs-confirmation",
		});
		expect(inferredPool.IdentificationEvidence).toEqual(
			expect.arrayContaining([expect.stringMatching(/daemon=1000/), expect.stringMatching(/sidecar=1010/)]),
		);
		expect(grouping.PrewarmPools.map((pool: { Pid: number }) => pool.Pid)).not.toContain(991);
		expect(grouping.CoreProcesses).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ Pid: 1000, Role: "daemon", RecognitionMethod: "topology-inferred" }),
				expect.objectContaining({ Pid: 1010, Role: "sidecar", RecognitionMethod: "topology-inferred" }),
				expect.objectContaining({ Pid: 1020, Role: "mcp-server", RecognitionMethod: "topology-inferred" }),
			]),
		);
		expect(grouping.UnresolvedProcesses.map((entry: { Pid: number }) => entry.Pid)).not.toEqual(
			expect.arrayContaining([1000, 1010, 1020, 1030]),
		);
		expect(JSON.stringify(ledger)).not.toContain("candidate-zombie");
		expect(grouping.UnresolvedProcesses.map((entry: { Pid: number }) => entry.Pid)).toContain(120);

		const shellEntries = ledger.Processes.filter((entry: { Name: string }) => entry.Name === "bash.exe");
		expect(shellEntries.map((entry: { Decision: string }) => entry.Decision)).toEqual(["audit-only", "audit-only"]);
		expect(JSON.stringify(ledger)).not.toContain("fixture-secret-token");
		expect(JSON.stringify(ledger)).not.toContain("nested-secret");
		expect(JSON.stringify(ledger)).toContain("<redacted>");
	});

	powershellTest("keeps idle and not-current confirmations independent and orders successful WhatIf results", () => {
		const idleOnly = parseLedger(runScript(["-WorkBuddyPoolId", "wb-pool-safe", "-ConfirmWorkBuddyPoolIdle"]).stdout);
		const idleOnlyPool = idleOnly.WorkBuddyGrouping.PrewarmPools.find(
			(pool: { PoolId: string }) => pool.PoolId === "wb-pool-safe",
		);
		expect(idleOnlyPool.SessionState).toBe("unknown");
		expect(idleOnlyPool.Decision).toBe("needs-confirmation");

		const notCurrentOnly = parseLedger(
			runScript(["-WorkBuddyPoolId", "wb-pool-safe", "-ConfirmWorkBuddyPoolNotCurrent"]).stdout,
		);
		const notCurrentOnlyPool = notCurrentOnly.WorkBuddyGrouping.PrewarmPools.find(
			(pool: { PoolId: string }) => pool.PoolId === "wb-pool-safe",
		);
		expect(notCurrentOnlyPool.SessionState).toBe("not-current");
		expect(notCurrentOnlyPool.Decision).toBe("needs-confirmation");

		const { outputPath, result } = withTemporaryLedger([
			"-WorkBuddyPoolId",
			"wb-pool-safe",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
			"-Apply",
			"-WhatIf",
		]);
		try {
			expect(result.status, result.stderr).toBe(0);
			const ledger = parseLedger(result.stdout);
			const safePool = ledger.WorkBuddyGrouping.PrewarmPools.find(
				(pool: { PoolId: string }) => pool.PoolId === "wb-pool-safe",
			);

			expect(safePool).toMatchObject({
				Decision: "candidate-workbuddy-pool-explicit",
				SessionState: "not-current",
				ExplicitNotCurrentConfirmed: true,
				ExplicitIdleConfirmed: true,
			});
			expect(safePool.ProtectionReasons).toEqual([]);
			expect(safePool.StopPlan.map((entry: { Pid: number }) => entry.Pid)).toEqual([300, 330, 320, 310]);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).toEqual([300, 330, 320, 310]);
			expect(ledger.StopResults.map((entry: { Status: string }) => entry.Status)).toEqual([
				"what-if",
				"what-if",
				"what-if",
				"what-if",
			]);
		} finally {
			rmSync(outputPath, { force: true });
		}
	});

	powershellTest("blocks listener observation failures instead of treating them as zero listeners", () => {
		const fixture = loadFixture();
		fixture.ListenerObservation = { Status: "unknown", Reason: "query-failed" };
		const temporary = writeFixture(fixture);
		try {
			const dryRun = runScript(
				["-WorkBuddyPoolId", "wb-pool-safe", "-ConfirmWorkBuddyPoolNotCurrent", "-ConfirmWorkBuddyPoolIdle"],
				repoRoot,
				temporary.fixturePath,
			);
			expect(dryRun.status, dryRun.stderr).toBe(0);
			const ledger = parseLedger(dryRun.stdout);
			const pool = ledger.WorkBuddyGrouping.PrewarmPools.find(
				(entry: { PoolId: string }) => entry.PoolId === "wb-pool-safe",
			);
			expect(ledger.ListenerObservation).toEqual({ Status: "unknown", Reason: "query-failed" });
			expect(pool.Decision).toBe("blocked");
			expect(pool.ProtectionReasons).toContain("listener-observation-unknown");

			const applied = withTemporaryLedger(
				[
					"-WorkBuddyPoolId",
					"wb-pool-safe",
					"-ConfirmWorkBuddyPoolNotCurrent",
					"-ConfirmWorkBuddyPoolIdle",
					"-Apply",
					"-WhatIf",
				],
				temporary.fixturePath,
			);
			try {
				expect(applied.result.status).not.toBe(0);
				expect(`${applied.result.stdout}\n${applied.result.stderr}`).toMatch(/listener-observation-unknown/i);
			} finally {
				rmSync(applied.outputPath, { force: true });
			}
		} finally {
			rmSync(temporary.fixtureDir, { recursive: true, force: true });
		}
	});

	powershellTest("permanently blocks protected WorkBuddy roles anywhere in a pool subtree", () => {
		const result = runScript([
			"-WorkBuddyPoolId",
			"wb-pool-subtree-protected",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
		]);
		expect(result.status, result.stderr).toBe(0);
		const ledger = parseLedger(result.stdout);
		const pool = ledger.WorkBuddyGrouping.PrewarmPools.find(
			(entry: { PoolId: string }) => entry.PoolId === "wb-pool-subtree-protected",
		);
		expect(pool.Decision).toBe("blocked");
		expect(pool.StopPlan).toEqual([]);
		expect(pool.ProtectionReasons).toEqual(
			expect.arrayContaining([
				"subtree-protected-workbuddy-role:1810:daemon",
				"subtree-protected-workbuddy-role:1820:unknown",
				"subtree-protected-workbuddy-role:1830:ui",
				"subtree-protected-workbuddy-role:1840:renderer",
				"subtree-protected-workbuddy-role:1850:prewarm-pool",
			]),
		);
	});

	powershellTest("allows a medium topology pool only through an exact PID and frozen WhatIf plan", () => {
		const applied = withTemporaryLedger([
			"-WorkBuddyPoolPid",
			"1030",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
			"-Apply",
			"-WhatIf",
		]);
		try {
			expect(applied.result.status, applied.result.stderr).toBe(0);
			const ledger = parseLedger(applied.result.stdout);
			const pool = ledger.WorkBuddyGrouping.PrewarmPools.find((entry: { Pid: number }) => entry.Pid === 1030);
			expect(pool).toMatchObject({
				PoolId: null,
				Confidence: "medium",
				RecognitionMethod: "topology-inferred",
				SelectedBy: "pid",
				Decision: "candidate-workbuddy-pool-explicit",
			});
			expect(pool.StopPlan.map((entry: { Pid: number }) => entry.Pid)).toEqual([1030, 1031]);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).toEqual([1030, 1031]);
			expect(ledger.StopResults.map((entry: { Status: string }) => entry.Status)).toEqual(["what-if", "what-if"]);
		} finally {
			rmSync(applied.outputPath, { force: true });
		}
	});

	powershellTest("blocks listening and protected Apply requests", () => {
		const listening = runScript([
			"-WorkBuddyPoolId",
			"wb-pool-listening",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
		]);
		expect(listening.status, listening.stderr).toBe(0);
		const listeningLedger = parseLedger(listening.stdout);
		const listeningPool = listeningLedger.WorkBuddyGrouping.PrewarmPools.find(
			(pool: { PoolId: string }) => pool.PoolId === "wb-pool-listening",
		);
		expect(listeningPool.Decision).toBe("blocked");
		expect(listeningPool.ProtectionReasons).toContain("subtree-listening-port");

		for (const testCase of [
			{
				args: ["-WorkBuddyPoolPid", "800", "-ConfirmWorkBuddyPoolNotCurrent", "-ConfirmWorkBuddyPoolIdle"],
				error: /confidence|eligible/i,
			},
			{
				args: [
					"-WorkBuddyPoolId",
					"wb-pool-protected",
					"-ConfirmWorkBuddyPoolNotCurrent",
					"-ConfirmWorkBuddyPoolIdle",
					"-ProtectedProcessId",
					"910",
				],
				error: /protected|current session/i,
			},
			{
				args: [
					"-WorkBuddyPoolPid",
					"1030",
					"-ConfirmWorkBuddyPoolNotCurrent",
					"-ConfirmWorkBuddyPoolIdle",
					"-ProtectedProcessId",
					"1031",
				],
				error: /protected|current session/i,
			},
		]) {
			const applied = withTemporaryLedger([...testCase.args, "-Apply", "-WhatIf"]);
			try {
				expect(applied.result.status).not.toBe(0);
				expect(`${applied.result.stdout}\n${applied.result.stderr}`).toMatch(testCase.error);
			} finally {
				rmSync(applied.outputPath, { force: true });
			}
		}
	});

	powershellTest("rejects duplicate pool IDs while an exact PID selector remains unique", () => {
		const duplicateId = runScript([
			"-WorkBuddyPoolId",
			"wb-pool-duplicate",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
		]);
		expect(duplicateId.status).not.toBe(0);
		expect(`${duplicateId.stdout}\n${duplicateId.stderr}`).toMatch(/uniquely match|matched 2/i);

		const exactPid = runScript([
			"-WorkBuddyPoolPid",
			"1600",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
		]);
		expect(exactPid.status, exactPid.stderr).toBe(0);
		const ledger = parseLedger(exactPid.stdout);
		const pool = ledger.WorkBuddyGrouping.PrewarmPools.find((entry: { Pid: number }) => entry.Pid === 1600);
		expect(pool.Decision).toBe("candidate-workbuddy-pool-explicit");
	});

	// 执行后验证必须区分 PID 身份变化与新生进程；冻结的 StopResults 不能吸收复用 PID 或 respawn 后代。
	powershellTest("revalidates PID name and CreationDate before a simulated stop", () => {
		const fixture = loadFixture();
		fixture.RevalidationProcesses = structuredClone(fixture.Processes);
		const reused = fixture.RevalidationProcesses.find((entry) => entry.ProcessId === 300);
		if (!reused) throw new Error("fixture PID 300 is missing");
		reused.CreationDate = "2026-08-09T12:00:00Z";
		const temporary = writeFixture(fixture);
		const applied = withTemporaryLedger(
			[
				"-WorkBuddyPoolId",
				"wb-pool-safe",
				"-ConfirmWorkBuddyPoolNotCurrent",
				"-ConfirmWorkBuddyPoolIdle",
				"-Apply",
				"-WhatIf",
			],
			temporary.fixturePath,
		);
		try {
			expect(applied.result.status, applied.result.stderr).toBe(0);
			const ledger = parseLedger(applied.result.stdout);
			expect(ledger.StopResults).toEqual([expect.objectContaining({ Pid: 300, Status: "skipped-pid-reused" })]);
		} finally {
			rmSync(applied.outputPath, { force: true });
			rmSync(temporary.fixtureDir, { recursive: true, force: true });
		}
	});

	powershellTest("reports respawns separately and never adds them to the frozen StopResults", () => {
		const fixture = loadFixture();
		fixture.RevalidationProcesses = structuredClone(fixture.Processes);
		fixture.ResampledProcesses = [
			...structuredClone(fixture.Processes),
			{
				ProcessId: 305,
				ParentProcessId: 100,
				Name: "WorkBuddy.exe",
				CommandLine: "WorkBuddy.exe codebuddy --prewarm --prewarm-id wb-pool-safe",
				ExecutablePath: "C:\\Program Files\\WorkBuddy\\WorkBuddy.exe",
				CreationDate: "2026-08-09T12:00:00Z",
			},
			{
				ProcessId: 306,
				ParentProcessId: 305,
				Name: "node.exe",
				CommandLine: "node respawned-worker.js",
				ExecutablePath: "C:\\Runtime\\node.exe",
				CreationDate: "2026-08-09T12:00:00Z",
			},
		];
		const temporary = writeFixture(fixture);
		const applied = withTemporaryLedger(
			[
				"-WorkBuddyPoolId",
				"wb-pool-safe",
				"-ConfirmWorkBuddyPoolNotCurrent",
				"-ConfirmWorkBuddyPoolIdle",
				"-Apply",
				"-WhatIf",
			],
			temporary.fixturePath,
		);
		try {
			expect(applied.result.status, applied.result.stderr).toBe(0);
			const ledger = parseLedger(applied.result.stdout);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).toEqual([300, 330, 320, 310]);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).not.toEqual(
				expect.arrayContaining([305, 306]),
			);
			expect(ledger.Verification.RespawnedProcessPids).toEqual(expect.arrayContaining([305, 306]));
		} finally {
			rmSync(applied.outputPath, { force: true });
			rmSync(temporary.fixtureDir, { recursive: true, force: true });
		}
	});

	powershellTest("reports a topology-inferred medium pool respawn without a PoolId", () => {
		const fixture = loadFixture();
		fixture.RevalidationProcesses = structuredClone(fixture.Processes);
		fixture.ResampledProcesses = [
			...structuredClone(fixture.Processes).filter((entry) => entry.ProcessId !== 1030 && entry.ProcessId !== 1031),
			{
				ProcessId: 1040,
				ParentProcessId: 1000,
				Name: "WorkBuddy.exe",
				CommandLine: null,
				ExecutablePath: null,
				CreationDate: "2026-08-09T11:00:00Z",
			},
			{
				ProcessId: 1041,
				ParentProcessId: 1040,
				Name: "node.exe",
				CommandLine: "node topology-pool-worker.js",
				ExecutablePath: "C:\\Runtime\\node.exe",
				CreationDate: "2026-08-09T11:01:00Z",
			},
		];
		const temporary = writeFixture(fixture);
		const applied = withTemporaryLedger(
			[
				"-WorkBuddyPoolPid",
				"1030",
				"-ConfirmWorkBuddyPoolNotCurrent",
				"-ConfirmWorkBuddyPoolIdle",
				"-Apply",
				"-WhatIf",
			],
			temporary.fixturePath,
		);
		try {
			expect(applied.result.status, applied.result.stderr).toBe(0);
			const ledger = parseLedger(applied.result.stdout);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).toEqual([1030, 1031]);
			expect(ledger.StopResults.map((entry: { Pid: number }) => entry.Pid)).not.toEqual(
				expect.arrayContaining([1040, 1041]),
			);
			expect(ledger.Verification.RespawnedProcessPids).toEqual(expect.arrayContaining([1040, 1041]));
		} finally {
			rmSync(applied.outputPath, { force: true });
			rmSync(temporary.fixtureDir, { recursive: true, force: true });
		}
	});

	powershellTest("rejects WorkBuddy Apply without both confirmations and rejects non-temp ledgers", () => {
		for (const args of [["-ConfirmWorkBuddyPoolIdle"], ["-ConfirmWorkBuddyPoolNotCurrent"]]) {
			const applied = withTemporaryLedger(["-WorkBuddyPoolId", "wb-pool-safe", ...args, "-Apply", "-WhatIf"]);
			try {
				expect(applied.result.status).not.toBe(0);
				expect(`${applied.result.stdout}\n${applied.result.stderr}`).toMatch(/ConfirmWorkBuddyPool/i);
			} finally {
				rmSync(applied.outputPath, { force: true });
			}
		}

		const missingSelector = withTemporaryLedger([
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
			"-Apply",
			"-WhatIf",
		]);
		try {
			expect(missingSelector.result.status).not.toBe(0);
			expect(`${missingSelector.result.stdout}\n${missingSelector.result.stderr}`).toMatch(
				/pool.*selector|WorkBuddyPool/i,
			);
		} finally {
			rmSync(missingSelector.outputPath, { force: true });
		}

		const nonTempPath = resolve(repoRoot, "agent-process-ledger.should-not-exist.json");
		const nonTemp = runScript([
			"-WorkBuddyPoolId",
			"wb-pool-safe",
			"-ConfirmWorkBuddyPoolNotCurrent",
			"-ConfirmWorkBuddyPoolIdle",
			"-Apply",
			"-WhatIf",
			"-OutputPath",
			nonTempPath,
		]);
		expect(nonTemp.status).not.toBe(0);
		expect(`${nonTemp.stdout}\n${nonTemp.stderr}`).toMatch(/temporary|temp/i);
		expect(() => readFileSync(nonTempPath)).toThrow();
	});
});
