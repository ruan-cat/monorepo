function SimpleBaseClass() {
	this.initialize.apply(this, arguments);
}

SimpleBaseClass.prototype.initialize = function () {
	this._value = 0;
};

SimpleBaseClass.prototype.getValue = function () {
	return this._value;
};

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
