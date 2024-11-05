<script setup lang="ts">
import { Toaster, toast } from "vue-sonner";

import TestResolve from "./resovleComponents/resolve.vue";
</script>

<template>
	<section>
		<div>
			<input v-focus />
			<a href="https://vitejs.dev" target="_blank">
				<img src="/vite.svg" class="logo" alt="Vite logo" />
			</a>
			<a href="https://vuejs.org/" target="_blank">
				<img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
			</a>
		</div>

		<!-- 已经被注册成功 -->
		<TestResolve></TestResolve>
		<ComponentHelloWorld msg="看看自定义的 ComponentHelloWorld 显示？"></ComponentHelloWorld>
		<MyComponentTestDir></MyComponentTestDir>

		<!-- 
			https://github.com/xiaoluoboding/vue-sonner 
			效果很差，在源码仓库的测试项目内，无论是nuxt还是普通的vite项目，其表现结果都很正常
			到了我们这里，就不正常了。
			本测试项目，和其他的业务用项目，都不正常。通知组件都糊在一起。

			考虑废弃，换其他的组件实现。
		-->
		<Toaster
			:toastOptions="{
				actionButtonStyle: { backgroundColor: 'rgb(219, 239, 255)' },
				cancelButtonStyle: { backgroundColor: 'rgb(254, 226, 226)' },
			}"
			:expand="true"
			:richColors="true"
			:closeButton="true"
			:visibleToasts="5"
			:position="'bottom-right'"
			:gap="30"
			:dir="'auto'"
		></Toaster>
	</section>
</template>

<style scoped>
.logo {
	height: 6em;
	padding: 1.5em;
	will-change: filter;
}
.logo:hover {
	filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
	filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
