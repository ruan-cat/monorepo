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
	config?: Partial<Record<FunctionKeys<UserCode>, HandleStrategy>>;
};

function rmmvClassExpandTools<SourceCode extends RmmvClass, UserCode = any>(
	params: RmmvClassExpandTools<SourceCode, UserCode>,
) {}

rmmvClassExpandTools({
	source: SimpleBaseClass as unknown as SimpleBaseClass,
	userCode: SimpleExpandClass,
	config: {
		handleData: "userCode-first",
	},
});

// satisfies RmmvClass

//  DrillUpClass

// function DrillUpClass() {
// 	this.initialize.apply(this, arguments);
// }

// Stage
// function Scene_Base() {
// 	//调用 初始化
// 	this.initialize.apply(this, arguments);
// }

// //设置原形
// Scene_Base.prototype = Object.create(Stage.prototype);

// //设置创造者
// Scene_Base.prototype.constructor = Scene_Base;

// //初始化
// Scene_Base.prototype.initialize = function () {
// 	//舞台 初始化 呼叫(this)
// 	Stage.prototype.initialize.call(this);
// 	//活动标志 关闭
// 	this._active = false;
// 	//设置 淡入记号
// 	this._fadeSign = 0;
// 	//设置 淡入持续时间
// 	this._fadeDuration = 0;
// 	//设置 淡入精灵
// 	this._fadeSprite = null;
// };
