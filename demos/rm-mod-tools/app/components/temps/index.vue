<script setup lang="ts">
// 不是page目录 故不需要使用
// definePageMeta({
// 	layout: "home",
// });

const online = useOnline();
</script>

<template>
	<div>
		<Logos mb-6 />
		<ClientOnly>
			<Suspense>
				<PageView v-if="online" />
				<div v-else text-gray:80>You're offline</div>
				<template #fallback>
					<div italic op50>
						<span animate-pulse>Loading...</span>
					</div>
				</template>
			</Suspense>
			<template #fallback>
				<div op50>
					<span animate-pulse>...</span>
				</div>
			</template>
		</ClientOnly>
		<InputEntry />
	</div>
</template>
