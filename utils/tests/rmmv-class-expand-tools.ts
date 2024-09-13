interface RmmvClass {
	initialize: (...args: any[]) => void;
}

type FunctionKeys<T> = {
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

interface SimpleBaseClass extends RmmvClass {
	initialize: (...args: any[]) => void;
	_value: number;
	getValue: () => number;
	handleData: () => void;
}

const SimpleExpandClass = {
	counter: 1,

	initialize(counter: number) {
		this.counter = counter;
	},

	// getValue() {
	// 	return this._value;
	// },

	handleData() {
		this.counter++;
	},
};

// 获取 SimpleExpandClass 的全部函数名
// type SimpleExpandClassFunctionKeys = FunctionKeys<typeof SimpleExpandClass>;

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
type defaultHandleStrategy_FuncationName = FunctionKeys<RmmvClass>;

/** 没有初始化函数的全部函数名 */
type FunctionKeysWithoutInitialize<T> = Exclude<FunctionKeys<T>, defaultHandleStrategy_FuncationName>;

/** 全部有意义函数的 处理策略配置 */
type HandleStrategyConfig<T> = Record<FunctionKeysWithoutInitialize<T>, HandleStrategy>;

/** rmmv类拓展工具函数配置 */
type RmmvClassExpandTools<SourceCode extends RmmvClass, UserCode> = {
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
function rmmvClassExpandTools<SourceCode extends RmmvClass, UserCode = any>(
	params: RmmvClassExpandTools<SourceCode, UserCode>,
) {
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
	source: SimpleBaseClass as unknown as SimpleBaseClass,
	userCode: SimpleExpandClass,
	config: {
		handleData: "userCode-first",
	},
});
