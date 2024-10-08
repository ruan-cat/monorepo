/**
 * Input.ts —
 * 用于定义类型文件，如Input的props类型，emit类型和instance类型等，
 *
 * 内容如下：
 *
 * InputInstance是用来干啥的？
 * 在写公共组件时，我们会使用defineExpose暴露一些方法。
 * 如在element-plus中，就会使用formRef.validate 来校验表单，
 * instance里就有暴露方法的类型签名。
 */
import Input from "./index.vue";

/**
 * 定义props类型
 */
export interface InputProps {
	modelValue: string;
	disabled?: boolean;
}

/**
 * 定义emit类型
 */
export type InputEmits = {
	"update:modelValue": [value: string];
};

/**
 * 定义instance类型
 */
export type InputInstance = InstanceType<typeof Input>;
