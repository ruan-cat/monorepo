<template>
	<div>
		<!-- FIXME: 实现volar提供的组件类型声明 -->
		<!-- <gie-input v-model="state" ref="inputRef" /> -->
		<GieInput v-model="state" ref="inputRef" />
		{{ state }}
		<button @click="onFocus">focus</button>
	</div>
</template>

<script setup lang="ts">
import type { InputInstance } from "@giegie/components";
import { ref } from "vue";

const state = ref("");
const inputRef = ref<InputInstance>();

function onFocus() {
	inputRef.value?.focus();
}
</script>
