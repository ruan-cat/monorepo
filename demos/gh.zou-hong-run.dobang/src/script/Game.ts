import Board from "./Board";
import Piece from "./Piece";

export type countPieceCallBack = (count: number, currentPiece: HTMLElement) => void;
type plainArr = (
	| {
			posX: number;
			posY: number;
			name: string;
	  }
	| {
			posX: number;
			posY: number;
			name: null;
	  }
)[];

export default class Game {
	// 标题元素
	public titleEle: HTMLElement;
	// 白字优先
	public firstWhite: boolean;
	// 棋盘对象
	public board: Board;
	// 黑子对象
	public blackPiece: Piece;
	// 白子对象
	public whitePiece: Piece;

	// 当前棋盘棋子数量
	public pieceCount: number;
	// 当前落子
	public currentPiece: HTMLElement | undefined;
	constructor() {
		this.titleEle = document.querySelector("#title")!;
		this.firstWhite = true; // 白子优先
		this.board = new Board(this.countPieceCallBack.bind(this)); // 初始化棋盘
		// 初始化白棋子
		this.blackPiece = new Piece("black_piece", this.firstWhite);
		// 初始化黑棋子
		this.whitePiece = new Piece("white_piece", this.firstWhite);
		// 刚开始为零
		this.pieceCount = 0;
	}
	// 传给Board触发的回调函数
	countPieceCallBack(count: number, currentPiece: HTMLElement) {
		// board告诉game棋子数量变化了
		console.log("board计数", count);
		// 实时记录最新棋子数量
		this.pieceCount = count;
		// 交换顺序
		this.firstWhite = !this.firstWhite;
		// 通知棋子修改显示状态
		this.blackPiece.setFirstWhite(this.firstWhite);
		this.whitePiece.setFirstWhite(this.firstWhite);
		// 记录当前棋子
		this.currentPiece = currentPiece;
		// 当前棋子是什么名字
		let currentPieceName = this.currentPiece?.id;
		// 改变标题
		this.changeTitle(currentPieceName); // 判断胜负
		if (this.isWin()) {
			if (currentPieceName === "black_piece") {
				alert("黑子获胜!!!");
				this.changeBackGround(currentPieceName);
			} else {
				alert("白子获胜!!!");
				this.changeBackGround(currentPieceName);
			}
			this.addRestartPage();
		}
	}
	addRestartPage() {
		(document.querySelector("#restart") as HTMLDivElement).classList.remove("none");
		(document.querySelector("#restart button") as HTMLButtonElement).addEventListener("click", () => {
			window.location.reload();
		});
	}
	changeBackGround(currentPieceName: string) {
		let bodycontainer_center = document.querySelector("#container_center") as HTMLDivElement;
		if (currentPieceName === "black_piece") {
			bodycontainer_center.style.background = `url("../imgs/blackWin.png")`;
		} else {
			bodycontainer_center.style.background = `url("../imgs/whiteWin.png")`;
		}
	}
	changeTitle(currentPieceName: string) {
		this.titleEle.innerText =
			(currentPieceName === "white_piece" ? "(等待黑子落子)-" : "(等待白子落子)-") + "总步数：" + this.pieceCount;
	}
	// 判断胜负
	isWin(): boolean {
		// 两种判断，一种全盘判断，一种判断当前落子及其周围是否连成五子
		// 这里判断当前落子地方及其周围是否连成五子即可
		if (this.pieceCount >= 8) {
			let allPiece = this.board.getAllPiece();
			let dataset = this.currentPiece?.dataset;
			let { x, y } = dataset!;
			let currentPieceName = this.currentPiece?.id;
			let currentPieceposX = parseInt(x!);
			let currentPieceposY = parseInt(y!);
			// 提纯allPiece
			let plainArr = Array.from(allPiece).map((item) => {
				let children = item.children[0] as HTMLButtonElement;
				if (children) {
					let name = children.id;
					let { x, y } = children.dataset;
					return {
						posX: parseInt(x!),
						posY: parseInt(y!),
						name,
					};
				}
				return {
					posX: parseInt(x!),
					posY: parseInt(y!),
					name: null,
				};
			});
			// 当前落子的位置
			let currentPiecePos = {
				X: currentPieceposX,
				Y: currentPieceposY,
				name: currentPieceName!,
			};
			// 判断是否五子
			// 竖直方向
			if (this.isPieceFullFive(currentPiecePos, plainArr, 0, 1)) {
				return true;
			}
			// 横向
			if (this.isPieceFullFive(currentPiecePos, plainArr, 1, 0)) {
				return true;
			}
			// 45度向
			if (this.isPieceFullFive(currentPiecePos, plainArr, 1, 1)) {
				return true;
			}
			// 135度向
			if (this.isPieceFullFive(currentPiecePos, plainArr, -1, 1)) {
				return true;
			}
		}
		if (this.pieceCount == 255) {
			alert("平局");
			return true;
		}
		return false;
	}
	// 检查从当前位置的竖向，横向，45度向，135度向，的棋子数量是否大于五
	isPieceFullFive(
		currentPiecePos: { X: number; Y: number; name: string },
		plainArr: plainArr,
		directX: number,
		directY: number,
	): boolean {
		let { X, Y, name } = currentPiecePos;
		let tempPos = {
			x: 0,
			y: 0,
		};
		let count = 0;
		// 从落点位置分为 正方向和反方向
		// 反方向
		for (let i = 1; i < 5; i++) {
			tempPos.x = X - directX * i;
			tempPos.y = Y - directY * i;
			if (!plainArr.find((item) => item.name === name && item.posX === tempPos.x && item.posY === tempPos.y)) {
				break;
			}
			count++;
		}
		// 正方向
		for (let i = 1; i < 5; i++) {
			tempPos.x = X + directX * i;
			tempPos.y = Y + directY * i;
			if (!plainArr.find((item) => item.name === name && item.posX === tempPos.x && item.posY === tempPos.y)) {
				break;
			}
			count++;
		}
		//
		if (count >= 4) {
			// 当前棋子+count=5 游戏胜利
			return true;
		}
		return false;
	}
}
