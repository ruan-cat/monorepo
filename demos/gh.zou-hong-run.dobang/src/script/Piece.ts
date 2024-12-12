export default class Piece {
	private piece: HTMLButtonElement;
	private firstWhite: boolean;
	public name: string;
	constructor(name: string, firstWhite: boolean) {
		this.name = name;
		this.firstWhite = firstWhite;
		this.piece = document.getElementById(`${name}`) as HTMLButtonElement;
		this.addEventListenerDrag();
		this.togglePiece();
	}
	// 修改当前棋子状态
	setFirstWhite(value: boolean) {
		this.firstWhite = value;
		this.togglePiece();
	}
	// 根据isBlack的值禁用左边或者右边棋盘
	togglePiece() {
		// 判断当前是黑棋还是白棋
		let isBlack = this.name === "black_piece";
		if (isBlack) {
			// 黑棋，白棋先手禁用黑棋
			this.firstWhite ? (this.piece.draggable = false) : (this.piece.draggable = true);
			this.firstWhite ? (this.piece.disabled = true) : (this.piece.disabled = false);
			this.firstWhite ? (this.piece.style.opacity = "0.5") : (this.piece.style.opacity = "1");
			console.log(
				"黑棋先手",
				"draggable:",
				this.piece.draggable,
				"disabled:",
				this.piece.disabled,
				this.piece.style.opacity,
			);
		} else {
			// 白棋 白棋先手 显示白棋
			this.firstWhite ? (this.piece.draggable = true) : (this.piece.draggable = false);
			this.firstWhite ? (this.piece.disabled = false) : (this.piece.disabled = true);
			this.firstWhite ? (this.piece.style.opacity = "1") : (this.piece.style.opacity = "0.5");
			console.log(
				"白棋先手",
				"draggable:",
				this.piece.draggable,
				"disabled:",
				this.piece.disabled,
				this.piece.style.opacity,
			);
		}
	}
	// 监听器棋子被拖拽
	addEventListenerDrag() {
		// 我们可以看到对于被拖拽元素，事件触发顺序是 dragstart->drag->dragend；
		// 对于目标元素，事件触发的顺序是 dragenter->dragover->drop/dropleave。
		this.piece.addEventListener("dragstart", (e) => {
			console.log("棋子开始被拖拽，设置ID");
			if (e instanceof DragEvent) {
				e.dataTransfer?.setData("ID", (e.target as Element).id);
			}
		});
		this.piece.addEventListener("drag", (e) => {
			// e.stopPropagation()
			e.preventDefault();
		});
		this.piece.addEventListener("dragend", (e) => {
			if (e instanceof DragEvent) {
				// console.log("棋子被放置");
			}
		});
	}
}
