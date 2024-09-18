interface CanNewSimple {
	a: number;
	init: (...args: any[]) => void;
	showValue(): void;
}
type CanNewThis = ThisType<CanNewSimple>;
type CanNew = CanNewSimple & CanNewThis;

type CanNewConstructor = new (...args: any[]) => CanNew;
type CanNewInstance = InstanceType<CanNewConstructor>;

const canNew = function (this: CanNew, ...args: any[]) {
	this.init.apply(this, args);
} as unknown as CanNewConstructor;

canNew.prototype.init = function (this: CanNew, a: number) {
	this.a = a ?? 1;
	this.showValue();
};

canNew.prototype.showValue = function (this: CanNew) {
	this.a++;
	console.log(` a =  `, this.a);
};

const canNewInstance_1 = new canNew(20);

console.log(` canNew_1 =  `, canNewInstance_1);
canNewInstance_1.showValue();
