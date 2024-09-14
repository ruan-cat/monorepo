import { type Prettify } from "../src/index.ts";
import { type PartialPick, type OptionalKeys } from "type-plus";
import { type OptionalKeysOf } from "type-fest";

type OptionalFunctionKeys<T> = {
	[K in keyof T]: T[K] extends undefined | ((...args: any[]) => any) ? K : never;
}[keyof T];

export type Test = {
	a: 1;
	b: number;
	c?: string;
	init?: undefined | (() => void);
	isBase?: undefined | (() => boolean);
	isE1?: undefined | (() => boolean);
	someFunc1: () => void;
	someFunc2(): void;
	someFunc3?: () => void;
	someFunc4: undefined | (() => boolean);
	fuck: () => string;
	isFuck: () => true;
};

// 期望得到 init isBase isE1 someFunc3 someFunc4
type Result = OptionalFunctionKeys<Test>;
type Result2 = Prettify<PartialPick<Test, "a">>;
type Result3 = OptionalKeysOf<Test>;
type Result4 = OptionalKeys<Test>;
