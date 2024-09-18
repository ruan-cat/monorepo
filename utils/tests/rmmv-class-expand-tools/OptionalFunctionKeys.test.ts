import { type Prettify } from "../../src/index.ts";
import { type defaultHandleStrategy_FuncationName, type FunctionKeys } from "../rmmv-class-expand-tools.test.ts";
import type { PartialPick, OptionalKeys } from "type-plus";
import type { OptionalKeysOf } from "type-fest";

type OptionalFunctionKeys<T> = {
	[K in keyof T]: T[K] extends undefined | ((...args: any[]) => any) ? K : never;
}[keyof T];

export type Test = {
	a: 1;
	b: number;
	c?: string;
	initialize?: undefined | (() => void);
	isBase?: undefined | (() => boolean);
	isE1?: undefined | (() => boolean);
	someFunc1: () => void;
	someFunc2(): void;
	someFunc3?: () => void;
	someFunc4: undefined | (() => boolean);
	fuck: () => string;
	isFuck: () => true;
};

type Result = OptionalFunctionKeys<Test>;
type Result2 = Prettify<PartialPick<Test, "a">>;
/** OptionalKeysOf 的 类型约束更加简单易用 */
type Result3 = OptionalKeysOf<Test>;
type Result4 = Exclude<OptionalKeys<Test>, defaultHandleStrategy_FuncationName>;

/** 全部可选字段组成的对象 且该对象的全部字段必填 */
type AllOptionalFieldObj<T extends object> = Required<Pick<T, OptionalKeysOf<T>>>;

/** 给一个对象排除 init 字段 */
type NoInit<T> = Omit<T, defaultHandleStrategy_FuncationName>;

type AllOptionalFieldObj_noInit<T extends object> = NoInit<AllOptionalFieldObj<T>>;

// type FunctionKeys_noInit<T> = FunctionKeys<T>

type Test_1_FunctionKeys_noInit = FunctionKeys<AllOptionalFieldObj_noInit<Test>>;
