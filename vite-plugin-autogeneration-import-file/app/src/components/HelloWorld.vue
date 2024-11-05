<script setup lang="ts">
import { ref } from "vue";
import { toast as vueSonnerToast } from "vue-sonner";
import { toast as vue3Toastify } from "vue3-toastify";

defineProps<{ msg: string }>();

const count = ref(0);

function showVueSonnerToast() {
	vueSonnerToast.warning("你已取消刚才的新建栏目", {
		duration: Infinity,
	});
	vueSonnerToast.warning("你已取消刚才的新建栏目", {
		duration: Infinity,
	});
	vueSonnerToast.warning("你已取消刚才的新建栏目", {
		duration: Infinity,
	});
}

function showVue3Toastify() {
	const resolvePromise = new Promise((resolve) => setTimeout(resolve, 1000));

	/**
	 * 注意到该库的自定义按钮 并不方便。暂时留着不使用。
	 */
	vue3Toastify.promise(resolvePromise, {
		pending: "Promise is pending",
		success: "Promise resolved 👌",
		error: "Promise rejected 🤯",
	});
}
</script>

<template>
	<h1 @click="showVue3Toastify">{{ msg }}</h1>

	<div class="card">
		<button type="button" @click="count++">count is {{ count }}</button>
		<p>
			Edit
			<code>components/HelloWorld.vue</code> to test HMR
		</p>
	</div>

	<p>
		Check out
		<a href="https://vuejs.org/guide/quick-start.html#local" target="_blank">create-vue</a>, the official Vue + Vite
		starter
	</p>
	<p>
		Install
		<a href="https://github.com/johnsoncodehk/volar" target="_blank">Volar</a>
		in your IDE for a better DX
	</p>
	<p class="read-the-docs">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
.read-the-docs {
	color: #888;
}
</style>
