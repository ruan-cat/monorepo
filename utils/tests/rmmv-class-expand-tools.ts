import type { OptionalKeysOf } from "type-fest";
import { isConditionsEvery, type Prettify } from "../src/index.ts";

interface RmmvClass {
	// abstract
	initialize: (...args: any[]) => void;
}

export type FunctionKeys<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

// type UndefineAbleFunction = undefined | ((...args: any[]) => any);
// type IsUndefineAbleFunction<T> = T extends UndefineAbleFunction ? true : false;
// type UndefineAbleFunctionKeys<T> = {
// 	[K in keyof T]: T[K] extends IsUndefineAbleFunction<T> ? K : never;
// }[keyof T];

function SimpleBaseClass() {
	// @ts-ignore
	this.initialize.apply(this, arguments);
}

SimpleBaseClass.prototype.initialize = function () {
	this._value = 0;
};

SimpleBaseClass.prototype.getValue = function () {
	return this._value;
};

SimpleBaseClass.prototype.handleData = function () {
	this._value++;
};

SimpleBaseClass.prototype.IamSimpleBaseClass = function () {
	console.log(` 我是IamSimpleBaseClass `);
};

interface SimpleBaseClass extends RmmvClass {
	initialize: (...args: any[]) => void;
	_value: number;
	getValue: () => number;
	handleData: () => void;
	IamSimpleBaseClass: () => void;
}

function ExpandClass1() {
	// @ts-ignore
	this.initialize.apply(this, arguments);
}
ExpandClass1.prototype = Object.create(SimpleBaseClass.prototype);
ExpandClass1.prototype.constructor = ExpandClass1;
ExpandClass1.prototype.initialize = function () {
	SimpleBaseClass.prototype.initialize.call(this);
	this.expandClass1_value = "expandClass1_value";
};
ExpandClass1.prototype.showValue = function () {
	console.log(` expandClass1_value `, this.expandClass1_value);
};
ExpandClass1.prototype.isExpandClass1 = function () {
	return true;
};

interface ExpandClass1 extends SimpleBaseClass {
	initialize: (...args: any[]) => void;
	expandClass1_value: string;
	showValue(): void;
	isExpandClass1(): true;
}

/** 属性提示工具 */
type AttributePromptTool<SourceCode extends RmmvClass, UserCode> = Partial<SourceCode> & UserCode;

type UserCodeClassAttributeType = {
	counter: number;
	sayFuck: () => void;
	isUserCodeClass(): true;
};

type UserCodeClassPrompt = AttributePromptTool<ExpandClass1, UserCodeClassAttributeType>;

const userCodeClass: UserCodeClassPrompt = {
	counter: 1,

	initialize(counter: number) {
		this.counter = counter;
	},

	handleData() {
		this.counter++;
	},

	sayFuck() {
		console.log(` SimpleExpandClass fuck `);
	},

	isUserCodeClass() {
		return true;
	},
};

// type UserCodeClass = UserCodeClassPrompt;

/**
 * 默认处理策略
 * @description
 * 先回调rmmv源码 再加上用户代码
 */
const defaultHandleStrategy = <const>"source-first";

/**
 * 处理策略
 * @description
 * 用户代码相对于rmmv源码的处理策略
 */
const handleStrategy = <const>[
	/** 用户代码覆盖掉rmmv源码 */
	"userCode-cover-source",

	defaultHandleStrategy,

	/** 先执行用户代码 再回调rmmv源码 */
	"userCode-first",
];

/**
 * 处理策略
 * @description
 * 用户代码相对于rmmv源码的处理策略
 */
type HandleStrategy = (typeof handleStrategy)[number];

/**
 * 被默认执行默认处理策略的函数名
 * @description
 * 初始化函数默认使用固定的处理策略。
 */
export type defaultHandleStrategy_FuncationName = FunctionKeys<RmmvClass>;

// type FunctionKeys_noInit<T>  =

/** 全部可选字段组成的对象 且该对象的全部字段必填 */
type AllOptionalFieldObj<T extends object> = Required<Pick<T, OptionalKeysOf<T>>>;

/** 给一个对象排除 init 字段 */
type NoInit<T> = Omit<T, defaultHandleStrategy_FuncationName>;

type AllOptionalFieldObj_noInit<T extends object> = NoInit<AllOptionalFieldObj<T>>;

/** 处理策略配置的 全部有意义的配置键名 */
type HandleStrategyConfigKeys<T extends object> = FunctionKeys<AllOptionalFieldObj_noInit<T>>;

/**
 * 全部有意义函数的 处理策略配置
 * @description
 * 只有可能去覆盖，拓展的函数名，才值得去配置
 */
type HandleStrategyConfig<T extends object> = Record<HandleStrategyConfigKeys<T>, HandleStrategy>;

// 通过测试
// type a1 = Prettify<UserCodeClassPrompt>;
// type a1 = Prettify<UserCodeClass>;
// type a2 = Prettify<HandleStrategyConfig<a1>>;

/** rmmv类拓展工具函数配置 */
type RmmvClassExpandTools<SourceCode extends RmmvClass, UserCode extends object> = {
	/** 源码 一般是被拓展的类，往往是rmmv的源码类 */
	source: SourceCode;

	/** 用户代码 插件开发者编写的一个内部完备的对象 */
	userCode: UserCode;

	/**
	 * 拓展配置 按照要求拓展
	 * @description
	 * 用户可以不提供配置 就默认按照标准的方式处理
	 */
	config?: Partial<HandleStrategyConfig<UserCode>>;
};

/** rmmv类拓展工具函数 */
function rmmvClassExpandTools<SourceCode extends RmmvClass, UserCode extends object = any>(
	params: RmmvClassExpandTools<SourceCode, UserCode>,
) {
	const { source, userCode, config } = params;
	const handleStrategyConfig = config;
	const userCodeKeys = Object.keys(userCode as object) as FunctionKeys_NoInit_UndefineAble<UserCode>[];

	function getHandleStrategy(key: FunctionKeys_NoInit_UndefineAble<UserCode>): HandleStrategy {
		return handleStrategyConfig?.[key] ?? defaultHandleStrategy;
	}

	// TODO: 遍历userCode的全部键名，根据不同的情况，做出处理

	// userCodeKeys.forEach((key) => {
	// 	const handleStrategy = getHandleStrategy(key);
	// 	if (
	// 		isConditionsEvery([
	// 			() => handleStrategy === "source-first",
	// 			// () => Object.getOwnPropertyNames
	// 		])
	// 	) {
	// 	}
	// });

	// const { source, userCode, config } = params;
	// const handleStrategyConfig = {
	// 	...config,
	// };
	// const userCodeKeys = Object.keys(userCode) as FunctionKeysWithoutInitialize<UserCode>[];
	// for (const key of userCodeKeys) {
	// 	const handleData = handleStrategyConfig[key] ?? defaultHandleStrategy;
	// 	const sourceFunction = source[key];
	// 	const userCodeFunction = userCode[key];
	// 	switch (handleData) {
	// 		case "userCode-cover-source":
	// 			source[key] = userCodeFunction;
	// 			break;
	// 		case "userCode-first":
	// 			source[key] = function () {
	// 				userCodeFunction.apply(this, arguments);
	// 				sourceFunction.apply(this, arguments);
	// 			};
	// 			break;
	// 		default:
	// 			source[key] = function () {
	// 				sourceFunction.apply(this, arguments);
	// 				userCodeFunction.apply(this, arguments);
	// 			};
	// 			break;
	// 	}
	// }
}

rmmvClassExpandTools({
	source: ExpandClass1 as unknown as ExpandClass1,
	userCode: userCodeClass,
	config: {
		// initialize: "userCode-cover-source",
		// handleData: "userCode-first",
	},
});
