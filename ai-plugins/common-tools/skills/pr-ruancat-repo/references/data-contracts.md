> **何时读**：阶段 2β「归纳转换规则」与阶段 3a 生成 pr-transform.json 时；输入/输出/scopeAnalysis/转换规则四类契约以本文件为唯一真值。

## 数据契约

### 输入契约

```json
{
	"repo": "owner/name",
	"prTitle": "string",
	"prBody": "string",
	"commitMessage": "string",
	"sourceBranch": "string"
}
```

### 输出契约

```json
{
	"repo": "owner/name",
	"localPath": "string | null",
	"executionMode": "remote-api|local-git|hybrid|script-auto",
	"complexity": "low|medium|high",
	"targetBranch": "dev|main|master|unknown",
	"status": "success|failed",
	"prUrl": "string | null",
	"reason": "string | null"
}
```

### 范围探索契约（scopeAnalysis）

```json
{
	"scopeAnalysis": {
		"repos": [
			{
				"repo": "owner/name",
				"localPath": "absolute/path",
				"status": "in-scope|excluded",
				"excludeReason": "string | null",
				"affectedFiles": ["path/to/file.yml"],
				"fileCount": 3,
				"observations": ["特殊模式说明"],
				"currentValues": ["22.14.0"]
			}
		],
		"excludedRepos": [
			{
				"repo": "owner/name",
				"reason": "未克隆 / 无目标文件 / 权限不足"
			}
		],
		"totalFiles": 22,
		"totalOccurrences": 23,
		"specialPatterns": ["release 工作流需保留 registry-url"],
		"transformations": [
			{
				"description": "描述转换目的",
				"glob": ".github/workflows/*.{yml,yaml}",
				"search": "搜索正则",
				"replace": "替换字符串"
			}
		]
	}
}
```

### 转换规则契约（pr-transform.json）

```json
{
	"transformations": [
		{
			"description": "人类可读的描述",
			"glob": "匹配文件的 glob 模式",
			"search": "搜索正则（不含 / 定界符）",
			"replace": "替换字符串（支持 $1 捕获组引用）"
		}
	]
}
```
