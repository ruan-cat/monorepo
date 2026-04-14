# 遗留根包发版工具预检

## 问题概述

项目已切换到 `relizy + bumpp + changelogen` 组合发版后，若仓库中仍保留旧的根包发版工具，会造成职责重叠、脚本混乱或错误沿用旧链路。

本技能关注的不是「旧工具内部 API 兼容性」，而是**接入前先确认仓库里是否还有旧的根包发版链路残留**。

## 影响范围

常见遗留工具包括：

- `commit-and-tag-version`
- `conventional-changelog-cli`
- `standard-version`
- `release-it`

## 预检命令

```bash
pnpm why commit-and-tag-version
pnpm why conventional-changelog-cli
pnpm why standard-version
pnpm why release-it
```

若任一命令返回依赖来源，说明仓库内仍保留旧的根包发版工具。

## 修复方案

### 方案 A：删除旧工具（推荐）

```bash
pnpm remove commit-and-tag-version -w
pnpm remove conventional-changelog-cli -w
pnpm remove standard-version -w
pnpm remove release-it -w
```

### 方案 B：确认隔离边界

若仓库必须短期保留旧工具，则至少要明确：

- 旧工具不再参与根包正式发版流程
- `package.json` scripts 不再调用旧链路
- `bump.config.ts` 和 `.github/workflows/release.yaml` 只服务于 `bumpp + changelogen`

## 阻断条件

若预检命中任一遗留根包发版工具，**必须先确认删除还是隔离**，再继续接入本技能模板。
