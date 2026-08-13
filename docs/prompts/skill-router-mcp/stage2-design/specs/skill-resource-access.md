# Spec: Skill Resource Access

> Frozen values and safety policy: [`../implementation-contract.md`](../implementation-contract.md)

## 1. ADDED — `list_skill_resources`

系统 MUST 允许调用方列出一个已注册 Skill 根目录内的资源。

### Input

```ts
{
  skillId: string;
  sourceCommitSha?: string;
  prefix?: string;
  cursor?: string;
  limit?: number;
}
```

冻结值：default limit 50，max limit 200。

### Output

```ts
{
  skillId: string;
  plugin: string;
  name: string;
  sourceCommitSha: string;
  prefix?: string;
  resources: Array<{
    path: string;
    uri: string;
    kind: "skill" | "reference" | "script" | "asset" | "other";
    resourceType: "file" | "symlink" | "submodule";
    mimeType: string;
    size?: number;
    textReadable: boolean;
  }>;
  total: number;
  nextCursor?: string;
}
```

### Requirements

1. MUST 从 Registry v1 entry 推导 Skill root。
2. MUST 只枚举选中 Skill 的 Git subtree。
3. MUST deterministic sort。
4. MUST 支持 prefix filter。
5. MUST 支持 pagination。
6. cursor MUST 固定首次请求解析出的 source snapshot。
7. upstream enumeration 不完整时 MUST 使用完整性 fallback。
8. every response MUST return resolved `sourceCommitSha`。

### Scenario — snapshot pagination

Given page 1 resolves source A and source ref later advances to B, When page 2 uses page 1 cursor, Then page 2 still belongs to A。

---

## 2. ADDED — `load_skill_resource`

系统 MUST 允许调用方读取选中 Skill 内的一个资源。

### Input

```ts
{
  skillId: string;
  path: string;
  sourceCommitSha?: string;
  startLine?: number;
  endLine?: number;
  maxBytes?: number;
  binaryMode?: "metadata" | "base64";
}
```

### Requirements

1. Text default inline budget MUST be 256 KiB。
2. Text source hard cap MUST be 1 MiB。
3. Binary default MUST be metadata-only。
4. Binary base64 raw hard cap MUST be 64 KiB。
5. Size over effective limit MUST return `RESOURCE_TOO_LARGE`。
6. Range MUST use 1-based inclusive lines and invalid range MUST return `RESOURCE_RANGE_INVALID`。
7. MUST NOT silently truncate returned content。
8. MUST locate the resource in the same pinned Skill inventory before reading the exact regular Git object。
9. Unsupported Git object type MUST return `RESOURCE_TYPE_UNSUPPORTED`。
10. every response MUST return resolved `sourceCommitSha`。

---

## 3. ADDED — Snapshot Consistency

The Stage 2 resource Tools MUST preserve the一期 exact-SHA model:

```text
discovery @ A
  -> load_skill @ A
  -> load_skill_resource @ A
```

A mutable source ref moving after discovery MUST NOT change pinned reads.

Malformed source pin continues using一期 `SOURCE_COMMIT_INVALID`。

---

## 4. ADDED — Resource Isolation

All resource requests MUST be constrained to the selected Skill root and to entries present in the same pinned Skill inventory.

Canonical path validation and unsupported object-type policy are defined by `implementation-contract.md` and MUST be shared by both Tools and MCP Resources compatibility code.

---

## 5. ADDED — Resource Kind and MIME

Kind classification:

```text
SKILL.md       -> skill
references/**  -> reference
scripts/**     -> script
assets/**      -> asset
other          -> other
```

MIME MUST use a deterministic extension map. Unknown types MUST fall back to `application/octet-stream`.

Actual text decoding failure MUST return `RESOURCE_ENCODING_UNSUPPORTED`.

---

## 6. ADDED — Error Model

一期 errors remain compatible. Stage 2 adds:

```text
RESOURCE_NOT_FOUND
INVALID_RESOURCE_PATH
RESOURCE_TYPE_UNSUPPORTED
RESOURCE_TOO_LARGE
RESOURCE_RANGE_INVALID
RESOURCE_CURSOR_INVALID
RESOURCE_ENCODING_UNSUPPORTED
```

The detailed mapping is frozen in `implementation-contract.md`.

---

## 7. ADDED — Immutable MCP Resource URI

Canonical resource URI:

```text
skill://<plugin>/<sourceCommitSha>/<skill-name>/<relative-path>
```

The URI MUST identify one immutable source snapshot. Stage 2 does not define a mutable latest alias.

---

## 8. MODIFIED — `load_skill`

Stage 2 MVP MUST preserve the current public output structure and keep `content` equal to the selected `SKILL.md` content.

Resource hints are deferred and are not an MVP requirement.

---

## 9. MCP Resources Compatibility

The same ResourceResolver SHOULD support MCP `resources/read` and share source snapshot, URI, MIME, size and isolation logic with the model-callable Tools.

`skill://index.json` is not a Stage 2 MVP gate.
