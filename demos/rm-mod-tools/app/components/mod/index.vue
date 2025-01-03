<script lang="ts" setup>
const app = {
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
};

const fs = require("fs");
const path = require("path");
let listData = [];

// 工具函数：异步读取文件
const readFileAsync = (filePath) =>
	new Promise((resolve, reject) => fs.readFile(filePath, "utf8", (err, data) => (err ? reject(err) : resolve(data))));

// 工具函数：解析 JSON 文件
const parseJsonFile = async (filePath) => {
	const content = await readFileAsync(filePath);
	return JSON.parse(content);
};

// 工具函数：提取插件脚本中的 JSON 数据
const extractPluginsFromScript = async (filePath) => {
	const content = await readFileAsync(filePath);
	const match = content.match(/\$plugins\s*=\s*(\[\s*{.*}\s*]);/s);
	if (match && match[1]) {
		return JSON.parse(match[1]);
	}
	throw new Error("插件脚本中未找到有效的 $plugins 数据");
};

// 工具函数：生成图片路径
const getImagePath = (folderPath, titleName) => `${folderPath}/img/titles1/${titleName}.png`;

// 根据 JSON 数据创建卡片
const createCard = (folderPath, jsonData) => {
	const { title1Name, encryptionKey, advanced } = jsonData;
	return {
		name: jsonData.gameTitle || path.basename(folderPath),
		cmd: folderPath,
		txt: "",
		engine: advanced ? "RMMZ" : "RMMV",
		img: getImagePath(folderPath, title1Name),
		key: encryptionKey || null,
	};
};

// 更新卡片图片路径（若插件启用了 MOG_TitleLayers）
// 遍历插件列表并调用相应的处理逻辑（倒序 for 循环）
const updateCardWithPlugins = (card, plugins, folderPath) => {
	for (let i = plugins.length; i > 0; i--) {
		const plugin = plugins[i];
		if (!plugin) continue;
		const handler = pluginHandlers[plugin.name];
		if (handler && plugin.status) {
			handler(card, plugin, folderPath);
			break;
		}
	}
};

var pluginHandlers = {};
pluginHandlers["MOG_TitleLayers"] = (card, plugin, folderPath) => {
	const parameters = plugin.parameters;
	for (let i = 1; i < 11; i++) {
		const layerVisible = parameters[`L${i} Visible`];
		if (layerVisible && layerVisible === "true") {
			const layerName = parameters[`L${i} File Name`];
			var imgPath = getImagePath(folderPath, layerName); //考虑图片格式
			if (fs.existsSync(imgPath)) {
				card.img = imgPath;
				if (!card.imgs) card.imgs = [];
				card.imgs.push(imgPath);
			}
			//break;
		}
	}
	console.log("图层组", card.imgs);
};

// 主函数：添加卡片
const addCardFromFolder = async (folderPath, app) => {
	try {
		const systemJsonPath = path.join(folderPath, "data", "System.json");
		const pluginsJsPath = path.join(folderPath, "js", "plugins.js");

		// 读取并解析 System.json 和插件脚本
		const [jsonData, plugins] = await Promise.all([
			parseJsonFile(systemJsonPath),
			extractPluginsFromScript(pluginsJsPath),
		]);

		// 创建新卡片并更新图片路径
		const newCard = createCard(folderPath, jsonData);
		updateCardWithPlugins(newCard, plugins, folderPath);

		// 添加到列表并更新应用数据
		listData.push(newCard);
		app.listData = [...listData];

		console.log("已添加新卡:", newCard);
	} catch (err) {
		console.error("操作失败:", err.message);
	}
};
// 对外暴露的函数
const loadCards = (folderPath, app) => {
	addCardFromFolder(folderPath, app);
};
// 新增 setCards 函数
const setCards = async (folderPath, app) => {
	try {
		const systemJsonPath = path.join(folderPath, "data", "System.json");
		const pluginsJsPath = path.join(folderPath, "js", "plugins.js");

		// 读取并解析 System.json 和插件脚本
		const [jsonData, plugins] = await Promise.all([
			parseJsonFile(systemJsonPath),
			extractPluginsFromScript(pluginsJsPath),
		]);

		// 创建新卡片
		const newCard = createCard(folderPath, jsonData);
		updateCardWithPlugins(newCard, plugins, folderPath);

		// 打开弹窗并填充数据
		app.newCard = newCard; // 将卡片数据传递给弹窗
		app.isModalOpen = true; // 显示弹窗

		console.log("卡片数据已加载，等待用户确认修改");
	} catch (err) {
		console.error("加载卡片数据失败:", err.message);
	}
};

// 新增处理弹窗提交的函数
const submitCard = (app) => {
	// 添加卡片到 listData
	app.listData.push(app.newCard);
	app.isModalOpen = false; // 关闭弹窗
	console.log("新卡片已添加:", app.newCard);
};
</script>

<template>
	<section class="index-root">
		<div
			class="sidebar"
			:class="['sidebar', { expanded: isSidebarExpanded }]"
			@mouseenter="expandSidebar"
			@mouseleave="collapseSidebar"
		>
			<ul>
				<li v-for="(item, index) in menuItems" :key="index">{{ item }}</li>
			</ul>
		</div>

		<div class="main-content">
			<h1>{{ message }}</h1>
			<button @click="updateMessage">点击更新消息</button>

			<!-- 卡片滚动容器 -->
			<div class="cards-container">
				<div
					class="card"
					v-for="(card, index) in listData"
					:key="index"
					@click="handleCardClick(card, index)"
					@dblclick="handleCardDblClick(card, index)"
					@contextmenu.prevent="showDeleteButton(card, index)"
				>
					<!-- 这个容器会显示卡片的图片 -->
					<div class="card-image-container">
						<template v-if="card.imgs && card.imgs.length">
							<div
								v-for="(img, imgIndex) in card.imgs"
								:key="imgIndex"
								class="card-image-layer"
								:style="{ zIndex: imgIndex + 1, transform: 'translateZ(' + imgIndex * -10 + 'px)' }"
							>
								<img :src="getImageUrl({ img: img })" alt="Card Image" class="card-image" />
							</div>
						</template>
						<template v-else>
							<img :src="getImageUrl(card)" alt="Card Image" class="card-image" />
						</template>
					</div>
					<h3>{{ card.name }}</h3>
					<div class="divider"></div>
					<p>{{ card.txt }}</p>

					<!-- 齿轮按钮 -->
					<div class="gear-button" @click="showCardName(card.name)">⚙️</div>

					<!-- 删除按钮 (显示控制) -->
					<div v-if="card.showDelete" class="delete-button" @click="deleteCard(index)">删除</div>
				</div>
			</div>
		</div>

		<!-- 圆形加号按钮 -->
		<div class="fab-button" @click="triggerFileInput">+</div>

		<div v-if="isModalOpen" class="modal">
			<div class="modal-content">
				<h2>添加新卡片</h2>

				<!-- 名称输入框 -->
				<div class="input-group">
					<label for="name">名称:</label>
					<input type="text" id="name" v-model="newCard.name" />
				</div>

				<!-- 背景图路径输入框 -->
				<div class="input-group">
					<label for="img">背景图路径:</label>
					<input type="text" id="img" v-model="newCard.img" placeholder="手动输入背景图路径" />
					<!-- 上传按钮 -->
					<input type="file" @change="handleImageUpload" style="margin-left: 10px" />
				</div>

				<!-- 绘制背景图的 Canvas -->
				<div class="canvas-container">
					<!--<canvas id="canvas" width="300" height="200" style="border: 1px solid #ccc;"></canvas>-->
					<img id="canvas" :src="newCard.img" width="300" height="200" alt="Card Image" class="card-image" />
				</div>

				<!-- 启动路径输入框 -->
				<div class="input-group">
					<label for="cmd">启动路径:</label>
					<input type="text" id="cmd" v-model="newCard.cmd" />
				</div>

				<!-- 确定和取消按钮 -->
				<div class="modal-actions">
					<button @click="submitCard">确定</button>
					<button @click="closeModal">取消</button>
				</div>
			</div>
		</div>
	</section>
</template>

<style lang="scss" scoped>
.index-root {
	/* Modal ��ʽ */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	/* Modal ��ʽ */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	/* Modal ��ʽ */
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1000;
	}

	/* Modal �������� */
	.modal-content {
		background: white;
		padding: 20px;
		border-radius: 15px; /* Բ�� */
		width: 700px; /* ���ӿ��� */
		height: 500px; /* ���Ӹ߶� */
		display: flex;
		flex-direction: column; /* ���в��� */
		gap: 15px; /* ����֮��ļ�� */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* ������Ӱ */
		overflow-y: auto; /* ������ݳ�������ʾ��ֱ������ */
		max-height: 90vh; /* �������߶ȣ����ⴰ�ڹ��� */
		padding-right: 12px; /* ΢���Ҳ��ڱ߾࣬�������������̫�� */
	}

	/* Modal �������ݣ����Ҳ��� */
	.modal-body {
		display: flex;
		gap: 20px; /* ����������֮��ļ�� */
	}

	/* �������: ͼƬ���� */
	.left-panel {
		flex: 1; /* ռ��һ���ֿ��� */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* �Ҳ�����: ����� */
	.right-panel {
		flex: 1.5; /* ռ�ݸ������ */
		display: flex;
		flex-direction: column;
		gap: 15px; /* �����֮��ļ�� */
	}

	/* �����ͱ�ǩ������ */
	.modal-content .input-group {
		display: flex;
		justify-content: space-between; /* ��ǩ�������ֿ����� */
		align-items: center; /* ��ֱ���� */
		gap: 10px; /* ��ǩ�������֮��ļ�� */
	}

	/* �����ͱ�ǩ����ʽ */
	.modal-content label {
		font-size: 14px;
		color: #333;
		width: 30%; /* ��ǩ�Ŀ��� */
	}

	/* ����� */
	.modal-content input[type="text"],
	.modal-content input[type="file"] {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 8px; /* Բ�� */
		font-size: 14px;
		width: 65%; /* �����Ŀ��� */
	}

	/* ��ť��ʽ */
	.modal-content button {
		padding: 10px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 8px; /* Բ�� */
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.3s;
	}

	.modal-content button:hover {
		background-color: #45a049;
	}

	/* ȡ����ť */
	.modal-content button:nth-child(2) {
		background-color: #f44336;
	}

	.modal-content button:nth-child(2):hover {
		background-color: #e53935;
	}

	/* �Զ����������ʽ */
	.modal-content::-webkit-scrollbar {
		width: 8px; /* ���ù��������� */
	}

	/* ���������� (Thumb) */
	.modal-content::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.3); /* ��������ɫ */
		border-radius: 10px; /* ������Բ�� */
	}

	/* �ָ�Ĭ�Ϲ����������ʽ (ȥ���Զ�����) */
	.modal-content::-webkit-scrollbar-track {
		background: none; /* �ָ�Ĭ�ϱ��� */
	}

	/* ���̹������ܳ��� */
	.modal-content::-webkit-scrollbar-thumb {
		height: 30px; /* ���û���ĸ߶ȣ����ٹ��������ܳ��� */
	}

	/* Modal ��ť���� */
	.modal-actions {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	// ______________

	/* style.css */

	/* ȫ����ʽ */
	body {
		font-family: "Arial", sans-serif;
		margin: 0;
		padding: 0;
		display: flex;
		height: 100vh;
		background-color: #f4f7fc;
		overflow: hidden; /* ��������ҳ��Ĺ����� */
	}

	/* �������ʽ */
	.sidebar {
		background-color: #f39c12; /* ���û�ɫ����ɫ */
		color: white;
		height: 100%; /* ������߶�����Ϊ100% */
		width: 60px; /* Ĭ��������� */
		transition: width 0.3s ease; /* ���ÿ��ȵĻ�������Ч�� */
		position: fixed;
		top: 0;
		left: 0;
		padding-top: 20px;
		overflow: hidden;
		z-index: 100;
	}

	/* �����չ��ʱ */
	.sidebar.expanded {
		width: 250px; /* չ��ʱ���� */
	}

	.sidebar ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.sidebar ul li {
		padding: 15px;
		text-align: left;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	.sidebar ul li:hover {
		background-color: #e67e22; /* �����ͣʱ����ɫ */
	}

	/* �������� */
	.main-content {
		flex-grow: 1;
		background-color: #f4f7fc;
		padding: 20px;
		transition: margin-left 0.3s ease;
		margin-left: 60px; /* Ĭ��������տ��ȣ�ƥ���������� */
		overflow: hidden; /* ��ֹ��� */
	}

	.sidebar.expanded + .main-content {
		margin-left: 250px; /* չ�������ʱ�������������� */
	}

	h1 {
		color: #333;
		font-size: 24px;
		margin-bottom: 20px;
		text-align: center;
	}

	button {
		padding: 10px 20px;
		font-size: 16px;
		color: #fff;
		background-color: #4caf50;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}

	button:hover {
		background-color: #45a049;
	}

	/* ��Ƭ������ʽ */
	.cards-container {
		display: flex;
		flex-wrap: wrap;
		gap: 20px; /* ��Ƭ֮��ļ�϶ */
		justify-content: flex-start; /* ȷ����Ƭ����߿�ʼ���� */
		overflow-y: auto; /* ������ֱ���� */
		max-height: 80vh; /* ���߶ȣ�ȷ����Ƭ�������������� */
		padding: 10px;
	}

	.card {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		width: 250px; /* ÿ����Ƭ�Ŀ��� */
		height: 220px; /* �޸�Ϊ220px�Ŀ�Ƭ�߶� */
		position: relative; /* ���ڶ�λͼƬ */
		overflow: hidden; /* ��ֹͼƬ������Ƭ */
		transition:
			transform 0.3s ease,
			border 0.3s ease;
		border: 2px solid transparent; /* Ĭ��͸���߿� */
	}

	/* ��Ƭ��ͣʱ�����߿� */
	.card:hover {
		transform: translateY(-5px); /* �����ͣʱ�ĸ���Ч�� */
		border: 2px solid #f39c12; /* �����ͣʱ�߿���� */
	}

	/* ��ƬͼƬ���� */
	.card-image-container {
		position: relative;
		width: 100%;
		height: 60%; /* ͼƬ����ֻռ�ݿ�Ƭ���ϰ벿�� */
		overflow: hidden;
		perspective: 800px;
	}

	.card-image-layer {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 1;
		transition: transform 0.3s ease;
	}

	.card-image {
		width: 100%;
		height: 100%;
		object-fit: cover; /* ����ͼƬ�Ŀ��߱��������г������� */
	}

	/* ������ʽ */
	.card h3 {
		color: #333;
		font-size: 16px; /* ��΢���ٱ�����ֺ� */
		margin: 5px 6px; /* ���ٱ�������±߾� */
		text-align: left;
	}

	/* �ı���ʽ */
	.card p {
		color: #555;
		font-size: 13px; /* �޸�Ϊ13px�ļ���ֺ� */
		text-align: left;
		margin: 5px 6px; /* ���ټ�鲿�ֵ���߾� */
		padding: 0; /* ȥ����鲿�ֵ��ڱ߾� */
	}

	/* �ָ�����ʽ */
	.card .divider {
		height: 1px;
		background-color: rgba(0, 0, 0, 0.1); /* ��͸���ĺ�ɫ�ָ��� */
		margin: 5px 10px; /* ���ٷָ��ߵ����±߾� */
	}

	/* ɾ����ť��ʽ */
	.delete-button {
		position: absolute;
		top: 10px;
		left: 10px;
		background-color: red;
		color: white;
		padding: 5px 10px;
		border: none;
		border-radius: 5px;
		font-size: 14px;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.delete-button:hover {
		background-color: darkred;
	}

	/* ���ְ�ť��ʽ */
	.card .gear-button {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 30px;
		height: 30px;
		display: none;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		font-size: 18px;
		color: #333;
	}

	/* �����ͣʱ��ʾ���ְ�ť */
	.card:hover .gear-button {
		display: flex;
	}

	/* Բ�μӺŰ�ť��ʽ */
	.fab-button {
		position: fixed;
		right: 20px;
		bottom: 20px;
		width: 60px;
		height: 60px;
		background-color: #f39c12;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
		cursor: pointer;
		transition:
			background-color 0.3s ease,
			transform 0.3s ease;
		z-index: 200;
	}

	.fab-button:hover {
		background-color: #e67e22;
		transform: translateY(-3px);
	}

	.fab-button:active {
		transform: translateY(2px);
	}
}
</style>
