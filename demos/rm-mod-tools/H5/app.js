const { createApp } = Vue;

const app = createApp({
	data() {
		return {
			message: "MOD管理器",
			isSidebarExpanded: false,
			menuItems: ["首页", "设置", "关于", "帮助"],
			listData: [],
			isModalOpen: false, // 控制 Modal 显示与否
			newCard: {
				name: "",
				img: "",
				cmd: "",
			},
		};
	},
	mounted() {
		loadCards("C:\\Users\\QwQ\\Documents\\插件测试", this);
		loadCards("E:\\RPGMV\\【已整理】\\莉可的不可思议差事\\莉可的不可思议差事 Ver 1.41", this);
		loadCards("E:\\RPGMV\\【已整理】\\Mary↑GO→LAND!!\\Mary↑GO→LAND!! Ver1.10\\www", this);
		loadCards(
			"E:\\RPGMV\\【已整理】\\Memories Story～囚われの者たち～\\Memories Story～囚われの者たち～ Ver1.01",
			this,
		);
		loadCards("E:\\RPGMV\\【已整理】\\あの夏の島\\あの夏の島_Ver1.01", this);
		loadCards("E:\\RPGMV\\【未处理】\\240302\\www", this);

		window.addEventListener("keydown", this.handleF5);
	},
	methods: {
		updateMessage() {
			this.message = "消息已更新！";
		},
		expandSidebar() {
			this.isSidebarExpanded = true;
		},
		collapseSidebar() {
			this.isSidebarExpanded = false;
		},
		showCardName(cardName) {
			console.log(`卡片名称: ${cardName}`);
		},
		handleCardClick(card, index) {
			console.log(`卡片点击: ${card.name}, 索引: ${index}`);
		},
		handleCardDblClick(card, index) {
			const { spawn } = require("child_process");
			const exec = require("child_process").exec;
			const path = require("path");
			var nwjsPath = "E:\\RM_RPG\\【道果】\\nw\\nw.exe";
			var cmdPath = "E:\\RM_RPG\\【道果】\\nw\\app";
			var appPath = cmdPath + "\\app副本";
			var jsPath = cmdPath + "\\PC\\www\\js\\";
			console.log("启动项目:", card.cmd);
			var project = spawn(nwjsPath, ["."], {
				cwd: appPath,
				detached: true,
				env: { Project_Path: card.cmd, jsPath: jsPath },
			});
		},
		showDeleteButton(card, index) {
			if (this.activeDeleteIndex !== index) {
				this.activeDeleteIndex = index;
				this.listData.forEach((card, i) => {
					card.showDelete = i === index;
				});
			} else {
				this.activeDeleteIndex = null;
				card.showDelete = false;
			}
		},
		deleteCard(index) {
			this.listData.splice(index, 1);
			this.activeDeleteIndex = null;
		},
		// 提交卡片数据并关闭弹窗
		submitCard() {
			this.listData.push(this.newCard);
			this.isModalOpen = false; // 关闭弹窗
			console.log("新卡片已添加:", this.newCard);
		},
		// 关闭弹窗
		closeModal() {
			this.isModalOpen = false;
		},
		// Trigger File Input
		triggerFileInput() {
			const input = document.createElement("input");
			input.type = "file";
			input.nwdirectory = true;
			input.onchange = (event) => {
				if (event.target.files) {
					console.log("path", event.target.files[0].path);
					setCards(event.target.files[0].path, this); // 使用 setCards
				}
			};
			input.click();
		},
		getImageUrl(card) {
			if (card.key) {
				if (card.engine == "RMMV") {
					return Decrypter.decryptImg(card.img);
				}
			} else return card.img;
		},
		handleF5(event) {
			if (event.key === "F5") {
				event.preventDefault();
				location.reload();
			}
		},

		// Modal 控制方法
		openModal() {
			this.isModalOpen = true;
		},
		closeModal() {
			this.isModalOpen = false;
			// 重置新卡片数据
			this.newCard = { name: "", img: "", cmd: "" };
		},
		addCard() {
			// 将新的卡片数据添加到 listData
			this.listData.push({ ...this.newCard, showDelete: false });
			this.closeModal();
		},
		handleImageUpload(event) {
			const file = event.target.files[0];
			if (file) {
				const reader = new FileReader();
				// 读取文件并转换为数据 URL
				reader.onload = (e) => {
					this.newCard.img = e.target.result; // 更新 img 路径为 Data URL
				};
				reader.readAsDataURL(file); // 将图片读取为数据URL
			}
		},
	},
	beforeUnmount() {
		window.removeEventListener("keydown", this.handleF5);
	},
});

app.mount("#app");
