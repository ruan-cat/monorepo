import type { OptionalKeysOf } from "type-fest";
import { isConditionsEvery, type Prettify } from "../src/index.ts";
import { forIn, hasIn, isFunction } from "lodash-es";

interface RmmvClass {
	// abstract
	initialize: (...args: any[]) => void;
}

export type FunctionKeys<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
}[keyof T];

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

const ExpandClass1 = function ExpandClass1(this: ExpandClass1, ...args: any[]) {
	this.initialize.apply(this, args);
} as unknown as new (...args: any[]) => ExpandClass1;

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

/**
 * 属性提示工具
 * @description
 * 对继承的类进行属性提示
 *
 * 对自己新增的属性和函数做属性提示
 *
 * 对全部涉及到的函数，其this全部做判定
 */
type AttributePromptTool<SourceCode extends RmmvClass, UserCode> = ThisType<SourceCode & UserCode> &
	Partial<SourceCode> &
	UserCode;

type UserCodeClassAttributeType = {
	counter: number;
	drillCalendar: string[];
	sayFuck: () => void;
	isUserCodeClass(): true;
	getDrillCalendar(): string[];
};

type UserCodeClassPrompt = AttributePromptTool<ExpandClass1, UserCodeClassAttributeType>;

type a1 = Prettify<UserCodeClassPrompt>;

const userCodeClass: UserCodeClassPrompt = {
	counter: 1,
	drillCalendar: ["上午写插件", "中午玩黑神话", "晚上玩魔兽", "午夜看萝莉番剧"],

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

	getDrillCalendar() {
		return this.drillCalendar;
	},

	IamSimpleBaseClass() {
		console.log(` 这里是 userCodeClass ，覆写了 IamSimpleBaseClass 函数 `);
		return true;
	},
};

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

function isSourceFirst(handleStrategy: HandleStrategy): handleStrategy is "source-first" {
	return handleStrategy === "source-first";
}

function isUserCodeCoverSource(handleStrategy: HandleStrategy): handleStrategy is "userCode-cover-source" {
	return handleStrategy === "userCode-cover-source";
}

function isUserCodeFirst(handleStrategy: HandleStrategy): handleStrategy is "userCode-first" {
	return handleStrategy === "userCode-first";
}

/**
 * 被默认执行默认处理策略的函数名
 * @description
 * 初始化函数默认使用固定的处理策略。
 */
export type defaultHandleStrategy_FuncationName = FunctionKeys<RmmvClass>;

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

/** rmmv类拓展工具函数配置 */
type RmmvClassExpandTools<SourceCode extends new (...args: any[]) => RmmvClass, UserCode extends object> = {
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

/**
 * rmmv类拓展工具函数
 * @description
 * 预期处理5种情况
 *
 * - 1. 用户代码覆盖掉rmmv源码
 * - 2. 默认处理策略
 * - 3. 先执行用户代码 再回调rmmv源码
 * - 4. 初始化函数默认使用固定的处理策略
 * - 5. 继承对象没有这个属性时 说明是新的函数 直接添加到原型链上
 */
function rmmvClassExpandTools<SourceCode extends new (...args: any[]) => RmmvClass, UserCode extends object = any>(
	params: RmmvClassExpandTools<SourceCode, UserCode>,
) {
	const { source, userCode, config } = params;
	const handleStrategyConfig = config;

	function getHandleStrategy(key: HandleStrategyConfigKeys<UserCode>): HandleStrategy {
		return handleStrategyConfig?.[key] ?? defaultHandleStrategy;
	}

	/** 源对象的原型链 */
	const sourcePrototype = source.prototype;

	/** 属性是否在源对象的原型链内？ */
	function isInSourcePrototype(key: string) {
		return hasIn(sourcePrototype, key);
	}

	/** 是不是初始化函数的名称？ */
	function isInitialize(key: string): key is defaultHandleStrategy_FuncationName {
		return key === "initialize";
	}

	forIn(userCode, function (value, key, object: Record<string, any>) {
		console.log(` value, key, object  `, value, key);

		// 继承对象有没有这个属性？
		if (isInSourcePrototype(key)) {
			if (isFunction(object[key])) {
				const handleStrategy = getHandleStrategy(key as HandleStrategyConfigKeys<UserCode>);

				// 1 用户代码覆盖掉rmmv源码
				if (isUserCodeCoverSource(handleStrategy)) {
					sourcePrototype[key] = value;
				}

				// 2 默认处理策略
				if (isUserCodeFirst(handleStrategy)) {
					sourcePrototype[key] = function () {
						value.apply(this, arguments);
						sourcePrototype[key].apply(this, arguments);
					};
				}

				// 3 先执行用户代码 再回调rmmv源码
				// 4 初始化函数默认使用固定的处理策略
				if (isSourceFirst(handleStrategy) || isInitialize(key)) {
					sourcePrototype[key] = function () {
						sourcePrototype[key].apply(this, arguments);
						value.apply(this, arguments);
					};
				}
			}
		} else {
			if (isFunction(object[key])) {
				/**
				 * 5 继承对象没有这个属性时 说明是新的函数
				 * 直接添加到原型链上
				 */
				sourcePrototype[key] = value;
			}
		}
	});
}

rmmvClassExpandTools({
	source: ExpandClass1,
	userCode: userCodeClass,
	config: {
		// initialize: "userCode-cover-source",
		// handleData: "userCode-first",
	},
});

const expandClass1 = new ExpandClass1();
