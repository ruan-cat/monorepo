export default class Utils {
	static clone(
		target: HTMLElement,
		options: Partial<{
			width: string;
			height: string;
			draggable: boolean;
			userSelect: string;
			x: string;
			y: string;
		}>,
	): HTMLElement {
		let { width, height, draggable, userSelect, x, y } = options;
		let cloneNode = target.cloneNode(true) as HTMLButtonElement;
		if (width) {
			cloneNode.style.cssText += `
                width:${width};
            `;
		}
		if (height) {
			cloneNode.style.cssText += `
                height:${height};
            `;
		}
		cloneNode.draggable = draggable as boolean;
		// 根据父元素的坐标记录该元素的坐标
		cloneNode.dataset.x = x;
		cloneNode.dataset.y = y;
		if (userSelect) {
			cloneNode.style.cssText += `
                user-select:${userSelect};
            `;
		}
		return cloneNode;
	}
}
