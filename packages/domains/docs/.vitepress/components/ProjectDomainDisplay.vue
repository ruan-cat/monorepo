<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import { projectLikeDomainSet } from "../../../src/domains";
import { projects } from "../../../src/types";

const { params } = useData();

// console.log(params.value);

// 获取当前项目名称
const currentProject = computed(() => params.value.project as string);

// 获取当前项目的详细信息
const projectInfo = computed(() => {
	return projects.find((p) => p.name === currentProject.value);
});

// 获取当前项目的域名列表
const domains = computed(() => {
	const projectName = currentProject.value;
	return projectLikeDomainSet[projectName as keyof typeof projectLikeDomainSet] || [];
});

// 格式化完整域名
const formatFullDomain = (domain: { topLevelDomain: string; secondLevelDomain: string }) => {
	return `${domain.secondLevelDomain}.${domain.topLevelDomain}`;
};

// 生成完整的 URL
const formatFullUrl = (domain: { topLevelDomain: string; secondLevelDomain: string }) => {
	return `https://${formatFullDomain(domain)}`;
};

// 按 order 排序域名
const sortedDomains = computed(() => {
	return [...domains.value].sort((a, b) => a.order - b.order);
});
</script>

<template>
	<div class="project-domain-display">
		<!-- {{ params }} -->

		<!-- 项目标题和描述 -->
		<div class="project-header">
			<h1 class="project-title">{{ projectInfo?.name }}</h1>
			<p class="project-description" v-if="projectInfo?.description">
				{{ projectInfo.description }}
			</p>
		</div>

		<!-- 域名统计 -->
		<div class="domain-stats">
			<div class="stat-item">
				<span class="stat-number">{{ domains.length }}</span>
				<span class="stat-label">个域名</span>
			</div>
			<div class="stat-item">
				<span class="stat-number">{{ new Set(domains.map((d) => d.topLevelDomain)).size }}</span>
				<span class="stat-label">个顶级域名</span>
			</div>
		</div>

		<!-- 域名列表 -->
		<div class="domains-list">
			<h2>域名列表</h2>
			<div class="domains-grid">
				<div
					v-for="domain in sortedDomains"
					:key="`${domain.topLevelDomain}-${domain.secondLevelDomain}`"
					class="domain-card"
				>
					<!-- 域名主要信息 -->
					<div class="domain-main">
						<div class="domain-priority">
							<span class="priority-badge">{{ domain.order }}</span>
						</div>
						<div class="domain-info">
							<a :href="formatFullUrl(domain)" target="_blank" rel="noopener noreferrer" class="domain-link">
								{{ formatFullDomain(domain) }}
							</a>
							<div class="domain-parts">
								<span class="subdomain">{{ domain.secondLevelDomain }}</span>
								<span class="separator">.</span>
								<span class="tld">{{ domain.topLevelDomain }}</span>
							</div>
						</div>
					</div>

					<!-- 项目别名 -->
					<div v-if="domain.projectAlias" class="domain-alias">
						<span class="alias-label">别名:</span>
						<span class="alias-value">{{ domain.projectAlias }}</span>
					</div>

					<!-- 域名描述 -->
					<div v-if="domain.description" class="domain-description">
						<p>{{ domain.description }}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.project-domain-display {
	max-width: 1000px;
	margin: 0 auto;
	padding: 20px;
}

.project-header {
	text-align: center;
	margin-bottom: 40px;
	padding-bottom: 20px;
	border-bottom: 2px solid var(--vp-c-divider);
}

.project-title {
	font-size: 2.5em;
	color: var(--vp-c-brand-1);
	margin-bottom: 10px;
	font-weight: 700;
}

.project-description {
	font-size: 1.2em;
	color: var(--vp-c-text-2);
	margin: 0;
}

.domain-stats {
	display: flex;
	justify-content: center;
	gap: 40px;
	margin-bottom: 40px;
	padding: 20px;
	background: var(--vp-c-bg-soft);
	border-radius: 12px;
}

.stat-item {
	text-align: center;
}

.stat-number {
	display: block;
	font-size: 2.5em;
	font-weight: 700;
	color: var(--vp-c-brand-1);
	line-height: 1;
}

.stat-label {
	font-size: 0.9em;
	color: var(--vp-c-text-2);
	margin-top: 5px;
}

.domains-list h2 {
	color: var(--vp-c-text-1);
	margin-bottom: 20px;
	font-size: 1.5em;
}

.domains-grid {
	display: grid;
	gap: 20px;
	grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
}

.domain-card {
	border: 1px solid var(--vp-c-divider);
	border-radius: 12px;
	padding: 20px;
	background: var(--vp-c-bg-soft);
	transition: all 0.3s ease;
	position: relative;
}

.domain-card:hover {
	border-color: var(--vp-c-brand-1);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	transform: translateY(-2px);
}

.domain-main {
	display: flex;
	align-items: flex-start;
	gap: 15px;
	margin-bottom: 15px;
}

.domain-priority {
	flex-shrink: 0;
}

.priority-badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	background: var(--vp-c-brand-1);
	color: white;
	border-radius: 50%;
	font-weight: 700;
	font-size: 0.9em;
}

.domain-info {
	flex: 1;
}

.domain-link {
	font-size: 1.3em;
	font-weight: 600;
	color: var(--vp-c-brand-1);
	text-decoration: none;
	display: block;
	margin-bottom: 5px;
}

.domain-link:hover {
	text-decoration: underline;
}

.domain-parts {
	font-size: 0.9em;
	color: var(--vp-c-text-2);
}

.subdomain {
	color: var(--vp-c-brand-2);
	font-weight: 500;
}

.separator {
	margin: 0 2px;
}

.tld {
	color: var(--vp-c-text-3);
}

.domain-alias {
	margin-bottom: 10px;
	padding: 8px 12px;
	background: var(--vp-c-brand-soft);
	border-radius: 6px;
	font-size: 0.9em;
}

.alias-label {
	color: var(--vp-c-text-2);
	margin-right: 5px;
}

.alias-value {
	color: var(--vp-c-brand-1);
	font-weight: 500;
}

.domain-description {
	font-size: 0.9em;
	color: var(--vp-c-text-2);
	line-height: 1.5;
	background: var(--vp-c-bg);
	padding: 12px;
	border-radius: 6px;
	border-left: 3px solid var(--vp-c-brand-1);
}

.domain-description p {
	margin: 0;
	white-space: pre-line;
}

/* 响应式设计 */
@media (max-width: 768px) {
	.project-domain-display {
		padding: 15px;
	}

	.domains-grid {
		grid-template-columns: 1fr;
	}

	.domain-stats {
		flex-direction: column;
		gap: 20px;
	}

	.project-title {
		font-size: 2em;
	}
}
</style>
