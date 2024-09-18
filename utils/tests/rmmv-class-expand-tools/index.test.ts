import { type RmmvClass, type AttributePromptTool, rmmvClassExpandTools } from "@ruan-cat/utils";

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

declare class SimpleBaseClass extends RmmvClass {
	_value: number;
	constructor(...args: any[]);
	initialize: (...args: any[]) => void;
	getValue: () => number;
	handleData: () => void;
	IamSimpleBaseClass: () => void;
}

function ExpandClass1(this: ExpandClass1, ...args: any[]) {
	this.initialize.apply(this, args);
}

// @ts-ignore
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
ExpandClass1.prototype.IamSimpleExpandClass1 = function () {
	console.log(` 我是 ExpandClass1  `);
};

declare class ExpandClass1 extends SimpleBaseClass {
	expandClass1_value: string;
	constructor(...args: any[]);
	initialize: (...args: any[]) => void;
	showValue(): void;
	IamSimpleExpandClass1(): void;
	isExpandClass1(): true;
}

/** 用户代码类 全部属性的类型 */
type UserCodeClassAttributeType = {
	counter: number;
	drillCalendar: string[];
	sayFuck: () => void;
	isUserCodeClass(): true;
	getDrillCalendar(): string[];
};

type UserCodeClassPrompt = AttributePromptTool<ExpandClass1, UserCodeClassAttributeType>;

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

rmmvClassExpandTools({
	source: ExpandClass1,
	userCode: userCodeClass,
	config: {
		// initialize: "userCode-cover-source",
		// handleData: "userCode-first",
	},
});

const expandClass1 = new ExpandClass1();

expandClass1.IamSimpleBaseClass();

// TODO: 对原来就有的对象 做类型拓展 拓展其属性
// @ts-ignore
expandClass1.getDrillCalendar();
