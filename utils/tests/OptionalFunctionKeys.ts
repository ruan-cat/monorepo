import { type Prettify } from "../src/index.ts";
import { type defaultHandleStrategy_FuncationName } from "./rmmv-class-expand-tools.ts";
import type { PartialPick, OptionalKeys, PickOptional } from "type-plus";
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
type Result3 = OptionalKeysOf<Test>;
type Result4 = Exclude<OptionalKeys<Test>, defaultHandleStrategy_FuncationName>;

type CanBeConfigObj = Required<Pick<Test, OptionalKeys<Test>>>;
