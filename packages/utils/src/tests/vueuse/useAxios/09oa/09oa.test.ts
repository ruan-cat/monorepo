import type { PartialPick } from "type-plus";
import type { UseAxiosOptions } from "@vueuse/integrations/useAxios";

import type { JsonVO } from "./JsonVO";
import type {
	KeyAxiosRequestConfig,
	CreateAxiosRequestConfig,
	UseAxiosWrapperParams,
	KeyHelper,
	RemoveUrl,
} from "@ruan-cat/utils/vueuse";
import { useAxiosWrapper } from "@ruan-cat/utils/vueuse";

/**
 * 对 UseAxiosWrapperParams 做一层业务性质的封装
 * - 预设必填url参数
 * - 不必填instance实例
 * - 不必填选项配置
 */
export interface UseAxiosOAParams<T = any, K extends KeyAxiosRequestConfig<D> = "url", D = any>
	extends PartialPick<UseAxiosWrapperParams<T, K, UseAxiosOptions<JsonVO<T>>, D>, "instance" | "options"> {}

/**
 * 被测试的包装函数
 */
function useAxiosTest<T = any, K extends KeyAxiosRequestConfig = "url", D = any>(
	params: UseAxiosOAParams<T, "url", D>,
) {
	const {
		config,
		options = {
			immediate: false,
		},
		instance = axiosInstance,
	} = params;

	// setDefaultUseAxiosOptions(options);

	return useAxiosWrapper<JsonVO<T>, RemoveUrl<K>, D>({
		config,
		instance,
		options,
	});
}
