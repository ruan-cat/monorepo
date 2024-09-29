<!-- 
	在该组件中简单的定义了组件名、代理了一下v-model，并暴露出了一个方法focus。
-->

<template>
	<div class="gie-input">
		<input v-model="state" ref="inputRef" class="gie-input__control" type="text" :disabled="props.disabled" />
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { InputEmits, InputProps } from "./Input";

defineOptions({
	name: "GieInput",
});

const emit = defineEmits<InputEmits>();

const props = withDefaults(defineProps<InputProps>(), {
	modelValue: "",
	disabled: false,
});

const state = computed({
	get: () => props.modelValue,
	set: (val) => {
		emit("update:modelValue", val);
	},
});

const inputRef = ref<HTMLInputElement>();

function focus() {
	inputRef.value?.focus();
}

defineExpose({
	focus,
});
</script>

<!-- 有疑惑 不清楚这样写的语法对不对 -->
<style scoped lang="scss" src="./style/index.scss"></style>
