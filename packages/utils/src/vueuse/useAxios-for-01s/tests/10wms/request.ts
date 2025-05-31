import { defineAxiosInstance } from "@ruan-cat/utils/vueuse/useAxios-for-01s/index";
import { axiosInstance } from "./createAxiosInstance";

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
} from "@ruan-cat/utils/vueuse/useAxios-for-01s/index";
