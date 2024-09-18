// canNew: new (a: number, ...args: any[]) => CanNew;
export declare class canNew {
	a: number;

	constructor(a: number);
	init: (a: number) => void;
	showValue: () => void;
}

function canNew(this: canNew, a: number) {
	this.init.apply(this, [a]);
}

canNew.prototype.init = function (this: canNew, a: number) {
	this.a = a ?? 1;
	this.showValue();
};

canNew.prototype.showValue = function (this: canNew) {
	this.a++;
	console.log(` a =  `, this.a);
};

const canNewInstance_1 = new canNew(30);
