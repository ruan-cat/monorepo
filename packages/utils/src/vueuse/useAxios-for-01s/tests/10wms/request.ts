// @ts-ignore
import { defineAxiosInstance } from "@ruan-cat/utils/vueuse/useAxios-for-01s/index.ts";
// @ts-ignore
import { axiosInstance } from "./createAxiosInstance.ts";

defineAxiosInstance(axiosInstance);

export {
	type ParamsPathKey,
	type ParamsQueryKey,
	type ParamsBodyKey,
	type HttpParamWay,
	type AxiosRequestConfigBaseKey,
	type UseAxiosOptionsJsonVO,
	type UseAxiosOptionsImmediate,
	type JsonVO,
	type PageDTO,
	UpType,
	HttpCode,
	MapContentTypeUpType,
	setHeaders,
	createDefaultUseAxiosOptions,
	setDefaultUseAxiosOptions,
	setDataByHttpParamWay,
	useRequestIn01s as useRequest,
	// @ts-ignore
} from "@ruan-cat/utils/vueuse/useAxios-for-01s/index.ts";
