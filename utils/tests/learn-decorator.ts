/**
 * TODO: 学习一下 装饰器的设计模式
 * https://segmentfault.com/a/1190000022886186#item-3-9
 * https://cloud.tencent.com/developer/article/1753397
 */

// 抽象构件
abstract class Component {
	public abstract operate(): void;
}

// 具体构件
class ConcreteComponent extends Component {
	public operate(): void {
		console.log("do something");
	}
}

// 装饰角色
abstract class Decorator extends Component {
	// @ts-ignore
	private component: Component = null;
	constructor(component: Component) {
		super();
		this.component = component;
	}

	public operate(): void {
		this.component.operate();
	}
}

// 具体装饰者
class ConcreteDecoratorA extends Decorator {
	constructor(component: Component) {
		super(component);
	}

	// 定义自己的修饰方法
	private methodA(): void {
		console.log("methodA修饰");
	}

	// 重写父类方法
	public operate(): void {
		this.methodA();
		super.operate();
	}
}

class ConcreteDecoratorB extends Decorator {
	constructor(component: Component) {
		super(component);
	}

	// 定义自己的修饰方法
	private methodB(): void {
		console.log("methodB修饰");
	}

	// 重写父类方法
	public operate(): void {
		this.methodB();
		super.operate();
	}
}

function main() {
	let component: Component = new ConcreteComponent();
	// 第一次装饰
	component = new ConcreteDecoratorA(component);
	// 第二次装饰
	component = new ConcreteDecoratorB(component);
	// 装饰后运行
	component.operate();
}

main();
