import Utils from "./Utils";
import { type countPieceCallBack } from "./Game";
export default class Board {
	// 棋盘行和列
	private row: number;
	private col: number;
	// 网页游戏区域宽高
	// 游戏区域
	private game: Element;
	private gameWidth: number;
	private gameHeight: number;
	// 棋盘网格中的单个元素宽高
	private oneGridWidth: number;
	private oneGridHeight: number;
	// 记录棋盘中的棋子数量
	public pieceCount: number;
	// Game传过来的函数，告诉game当前棋盘上的棋子数
	public emitGameCountPiece: countPieceCallBack;
	// 记录当前放置的棋子
	public crrentPiece: HTMLElement | undefined;
	constructor(emitGameCountPiece: countPieceCallBack) {
		this.row = 15;
		this.col = 15;
		this.game = document.querySelector("#game")!;
		this.gameWidth = this.game?.clientWidth!;
		this.gameHeight = this.game?.clientHeight!;
		this.oneGridWidth = this.gameWidth / this.row;
		this.oneGridHeight = this.gameHeight / this.col;
		this.pieceCount = 0;
		this.emitGameCountPiece = emitGameCountPiece;

		this.initBoard();
	}
	initBoard() {
		this.initGrid();
		this.addEventListenerSetPiece();
	}
	// 初始化棋盘网格
	initGrid() {
		let fragment = document.createDocumentFragment();
		for (let i = 0; i < this.col; i++) {
			for (let j = 0; j < this.row; j++) {
				// 添加网格
				let grid = document.createElement("div");
				grid.style.cssText = `
                    border:1px solid black;
                    width:${this.oneGridWidth}px;
                    height:${this.oneGridHeight}px;
                    user-select:none;
                    position:relative;
                `;
				grid.draggable = false;
				grid.dataset.x = j + "";
				grid.dataset.y = i + "";

				// 给每个网格监听放置棋子事件
				this.addEventListenerSetGrid(grid);
				// 给文档片段添加元素
				fragment.appendChild(grid);
			}
		}
		this.game.appendChild(fragment);
	}
	// 每一个网格都设置一个放置事件
	addEventListenerSetGrid(ele: Element) {
		let that = this;
		// 我们可以看到对于被拖拽元素，事件触发顺序是 dragstart->drag->dragend；
		// 对于目标元素，事件触发的顺序是 dragenter->dragover->drop/dropleave。
		ele.addEventListener("dragover", (e) => {
			// e.stopPropagation()
			e.preventDefault();
		});
		// 防止一个网格放置多个棋子
		const disableSecondDrop = function () {
			// 棋盘监听放子会加一，所以这里我们减一
			that.pieceCount--;
			// 告诉Game类型
			that.emitGameCountPiece(that.pieceCount, that.crrentPiece!);
			alert("此处已经放置元素");
			return false;
		};
		// 一个网格放置一个棋子
		const drop = function (e: Event) {
			let parent = ele as HTMLElement;
			let parentWidth = parent.style.width;
			let parentHeight = parent.style.height;
			let x = parent.dataset.x;
			let y = parent.dataset.y;
			if (e instanceof DragEvent) {
				console.log("棋子放置在棋盘上,得到ID");
				let pieceId = e.dataTransfer?.getData("ID");
				let pieceEle = document.getElementById(`${pieceId}`)!;
				// 克隆一个新的棋子
				let clonePiece = Utils.clone(pieceEle, {
					width: parentWidth,
					height: parentHeight,
					draggable: false,
					userSelect: "none",
					x: x,
					y: y,
				});
				// 添加到网格中
				parent.appendChild(clonePiece!);
				// 记录该棋子的坐标
				that.crrentPiece = clonePiece;
				// 禁止该网格放置多个元素
				parent.addEventListener("drop", disableSecondDrop);
				// 清除放置事件
				parent.removeEventListener("drop", drop);
			}
		};
		ele.addEventListener("drop", drop);
	}
	// 监听棋子放置事件
	addEventListenerSetPiece() {
		this.game.addEventListener("dragover", (e) => {
			e.preventDefault();
		});
		this.game.addEventListener("drop", () => {
			console.log("棋盘监听到棋子放下");
			this.pieceCount++;
			console.log("棋盘上的棋子数加一", this.pieceCount);
			// 告诉Game类 数量改变
			this.emitGameCountPiece(this.pieceCount, this.crrentPiece!);
		});
	}
	// 得到棋盘并且包括棋盘中的所有棋子
	getAllPiece() {
		let gameChild = this.game.children;
		return gameChild;
	}
}
