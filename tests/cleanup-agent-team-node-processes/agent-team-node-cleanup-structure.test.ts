// 结构回归契约：锁定入口脚本、私有模块边界、函数归属与加载顺序，防止拆分后出现重复定义或隐式跨模块执行。
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../..");
const skillRoot = resolve(repoRoot, "ai-plugins/common-tools/skills/cleanup-agent-team-node-processes");
const scriptsRoot = resolve(skillRoot, "scripts");
const entryPath = resolve(scriptsRoot, "agent-team-node-cleanup.ps1");
const libRoot = resolve(scriptsRoot, "lib");
const powershellTest = process.platform === "win32" ? test : test.skip;

const expectedLibFiles = [
	"common.ps1",
	"process-observation.ps1",
	"process-topology.ps1",
	"workbuddy-analysis.ps1",
	"safety-guards.ps1",
	"candidate-analysis.ps1",
	"cleanup-execution.ps1",
	"workflow.ps1",
] as const;

const existingFunctionNames = [
	"Assert-RegexList",
	"Convert-CimDate",
	"Get-RegexMatches",
	"Get-WorkingDirectoryHint",
	"Protect-SensitiveCommandLine",
	"ConvertTo-ProcessMap",
	"Read-ProcessObservation",
	"Get-ProcessMap",
	"Normalize-ProcessNames",
	"Get-TargetProcesses",
	"Get-ProcessFamily",
	"Get-ProcessNameCounts",
	"Get-AgentBrowserEvidenceMatches",
	"Get-ParentPidSet",
	"Get-DescendantRecords",
	"Get-WorkBuddyPoolId",
	"Get-DirectChildProcesses",
	"Get-WorkBuddyTopologyInference",
	"Build-WorkBuddyGrouping",
	"Get-ListeningPortObservation",
	"Get-ListeningPorts",
	"Get-ProcessExists",
	"Get-ProcessCpuSeconds",
	"Get-ProcessCpuSamples",
	"Normalize-ApplyScopePattern",
	"Assert-ApplyScope",
	"Assert-OneShotCommandScope",
	"Assert-TemporaryOutputPath",
	"Test-LiveProcessIdentity",
] as const;

const workflowFunctionNames = [
	"New-CleanupAuditEntries",
	"New-CleanupLedger",
	"Invoke-WorkBuddyCleanupPlan",
	"Invoke-GeneralCleanupPlan",
	"Complete-CleanupVerification",
	"Invoke-AgentTeamNodeCleanup",
] as const;

const expectedFunctionsByModule: Record<(typeof expectedLibFiles)[number], readonly string[]> = {
	"common.ps1": [
		"Assert-RegexList",
		"Convert-CimDate",
		"Get-RegexMatches",
		"Get-WorkingDirectoryHint",
		"Protect-SensitiveCommandLine",
		"ConvertTo-ProcessMap",
		"Normalize-ProcessNames",
	],
	"process-observation.ps1": [
		"Read-ProcessObservation",
		"Get-ProcessMap",
		"Get-TargetProcesses",
		"Get-ProcessNameCounts",
		"Get-ListeningPortObservation",
		"Get-ListeningPorts",
		"Get-ProcessExists",
		"Get-ProcessCpuSeconds",
		"Get-ProcessCpuSamples",
		"Test-LiveProcessIdentity",
	],
	"process-topology.ps1": [
		"Get-ProcessFamily",
		"Get-AgentBrowserEvidenceMatches",
		"Get-ParentPidSet",
		"Get-DescendantRecords",
		"Get-DirectChildProcesses",
	],
	"workbuddy-analysis.ps1": ["Get-WorkBuddyPoolId", "Get-WorkBuddyTopologyInference", "Build-WorkBuddyGrouping"],
	"safety-guards.ps1": [
		"Normalize-ApplyScopePattern",
		"Assert-ApplyScope",
		"Assert-OneShotCommandScope",
		"Assert-TemporaryOutputPath",
	],
	"candidate-analysis.ps1": ["New-CleanupAuditEntries", "New-CleanupLedger"],
	"cleanup-execution.ps1": ["Invoke-WorkBuddyCleanupPlan", "Invoke-GeneralCleanupPlan", "Complete-CleanupVerification"],
	"workflow.ps1": ["Invoke-AgentTeamNodeCleanup"],
};

interface PowerShellResult {
	status: number | null;
	stdout: string;
	stderr: string;
}

interface FunctionInspection {
	Name: string;
	Lines: number;
}

interface FileInspection {
	Path: string;
	ParseErrors: string[];
	Functions: FunctionInspection[];
	DotSources: string[];
	StringLiterals: string[];
	TopLevelKinds: string[];
}

function physicalLineCount(path: string) {
	return readFileSync(path, "utf8").replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n").length;
}

function parseJson<T>(stdout: string): T {
	return JSON.parse(stdout.trim().replace(/^\uFEFF/, "")) as T;
}

// AST 探针通过编码命令运行，并用环境变量传递待检路径，避免测试脚本拼接路径时引入转义或命令注入噪音。
function runPowerShell(script: string, cwd: string, env: Record<string, string> = {}): PowerShellResult {
	const encodedCommand = Buffer.from(script, "utf16le").toString("base64");
	const result = spawnSync(
		"powershell.exe",
		["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", encodedCommand],
		{
			cwd,
			encoding: "utf8",
			env: { ...process.env, ...env },
			maxBuffer: 10 * 1024 * 1024,
		},
	);

	return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

// 解析真实 PowerShell AST，而不是依赖文本匹配，才能同时约束函数归属、dot-source 和顶层语句类型。
function inspectPowerShellFiles(paths: string[]): FileInspection[] {
	if (paths.length === 0) return [];

	const result = runPowerShell(
		String.raw`
$ErrorActionPreference = "Stop"
$decodedPaths = ConvertFrom-Json $env:STRUCTURE_TEST_PATHS
$paths = @($decodedPaths | ForEach-Object { [string]$_ })
$inspections = foreach ($path in $paths) {
	$tokens = $null
	$parseErrors = $null
	$ast = [System.Management.Automation.Language.Parser]::ParseFile($path, [ref]$tokens, [ref]$parseErrors)
	$functions = @($ast.FindAll({
		param($node)
		$node -is [System.Management.Automation.Language.FunctionDefinitionAst]
	}, $true) | ForEach-Object {
		[pscustomobject]@{
			Name = $_.Name
			Lines = $_.Extent.EndLineNumber - $_.Extent.StartLineNumber + 1
		}
	})
	$dotSources = @($ast.FindAll({
		param($node)
		$node -is [System.Management.Automation.Language.CommandAst] -and
			$node.InvocationOperator -eq [System.Management.Automation.Language.TokenKind]::Dot
	}, $true) | ForEach-Object { $_.Extent.Text })
	$stringLiterals = @($ast.FindAll({
		param($node)
		$node -is [System.Management.Automation.Language.StringConstantExpressionAst]
	}, $true) | ForEach-Object { $_.Value })

	[pscustomobject]@{
		Path = $path
		ParseErrors = @($parseErrors | ForEach-Object { $_.Message })
		Functions = $functions
		DotSources = $dotSources
		StringLiterals = $stringLiterals
		TopLevelKinds = @($ast.EndBlock.Statements | ForEach-Object { $_.GetType().Name })
	}
}

[Console]::Out.Write((ConvertTo-Json -InputObject @($inspections) -Depth 6 -Compress))
`,
		repoRoot,
		{ STRUCTURE_TEST_PATHS: JSON.stringify(paths) },
	);

	expect(result.status, result.stderr).toBe(0);
	return parseJson<FileInspection[]>(result.stdout);
}

function existingPowerShellPaths() {
	return [entryPath, ...expectedLibFiles.map((file) => resolve(libRoot, file))].filter(existsSync);
}

describe("cleanup-agent-team-node-processes modular structure", () => {
	// 文件集合与体积门禁控制模块化改造的边界，避免职责再次回流到入口或生成未批准的私有模块。
	test("keeps the entrypoint and exact private module set within the approved file size gates", () => {
		const actualLibFiles = existsSync(libRoot)
			? readdirSync(libRoot)
					.filter((file) => file.endsWith(".ps1"))
					.sort()
			: [];

		expect.soft(actualLibFiles).toEqual([...expectedLibFiles].sort());
		expect.soft(physicalLineCount(entryPath)).toBeLessThanOrEqual(220);

		for (const file of expectedLibFiles) {
			const path = resolve(libRoot, file);
			if (existsSync(path)) expect.soft(physicalLineCount(path), file).toBeLessThanOrEqual(400);
		}
	});

	powershellTest("assigns the 29 existing functions and 6 workflow functions to one approved module each", () => {
		const inspections = inspectPowerShellFiles(existingPowerShellPaths());
		const functions = inspections.flatMap((inspection) => inspection.Functions);
		const expectedNames = [...existingFunctionNames, ...workflowFunctionNames].sort();
		const counts = new Map<string, number>();

		for (const definition of functions) counts.set(definition.Name, (counts.get(definition.Name) ?? 0) + 1);

		expect.soft(functions).toHaveLength(35);
		expect.soft([...counts.keys()].sort()).toEqual(expectedNames);
		for (const name of expectedNames) expect.soft(counts.get(name), name).toBe(1);

		for (const file of expectedLibFiles) {
			const inspection = inspections.find((candidate) => candidate.Path === resolve(libRoot, file));
			if (!inspection) continue;

			expect
				.soft(inspection.Functions.map((definition) => definition.Name).sort(), file)
				.toEqual([...expectedFunctionsByModule[file]].sort());
			for (const definition of inspection.Functions) {
				expect.soft(definition.Lines, `${definition.Name} in ${file}`).toBeLessThanOrEqual(280);
			}
		}
	});

	// 加载顺序是模块间依赖契约；测试锁定入口声明的八个模块、PSScriptRoot 相对解析，以及私有模块无级联加载或顶层副作用。
	powershellTest("parses all scripts and loads only the eight private modules from PSScriptRoot lib in order", () => {
		const entrySource = readFileSync(entryPath, "utf8");
		const inspections = inspectPowerShellFiles(existingPowerShellPaths());
		const entryInspection = inspections.find((inspection) => inspection.Path === entryPath);
		expect(entryInspection).toBeDefined();
		if (!entryInspection) return;
		const declaredModules = entryInspection.StringLiterals.filter((value) => value.endsWith(".ps1"));

		for (const inspection of inspections) {
			expect.soft(inspection.ParseErrors, inspection.Path).toEqual([]);
		}
		expect.soft(declaredModules).toEqual(expectedLibFiles);
		expect.soft(/\$PSScriptRoot/i.test(entrySource), "entry uses PSScriptRoot").toBe(true);
		expect
			.soft(
				/Join-Path[\s\S]{0,120}\$PSScriptRoot[\s\S]{0,120}["']lib["']/i.test(entrySource),
				"entry resolves its private lib directory below PSScriptRoot",
			)
			.toBe(true);
		expect.soft(entryInspection.DotSources.length).toBeGreaterThan(0);
		for (const dotSource of entryInspection.DotSources) {
			expect.soft(dotSource).not.toMatch(/[A-Za-z]:\\|\.\.|~/);
		}

		for (const inspection of inspections.filter((candidate) => candidate.Path !== entryPath)) {
			expect.soft(inspection.DotSources, inspection.Path).toEqual([]);
			expect.soft(inspection.TopLevelKinds.length, inspection.Path).toBeGreaterThan(0);
			expect
				.soft(
					inspection.TopLevelKinds.every((kind) => kind === "FunctionDefinitionAst"),
					inspection.Path,
				)
				.toBe(true);
		}
	});
});
