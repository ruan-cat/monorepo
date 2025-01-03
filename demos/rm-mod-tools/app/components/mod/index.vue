<script lang="ts" setup>
// import { spawn } from "node:child_process";

const message = ref("MOD管理器");
const isSidebarExpanded = ref(false);
const menuItems = ref(["首页", "设置", "关于", "帮助"]);
const activeDeleteIndex = ref(null);
const listData = ref([]);
const isModalOpen = ref(false);
const newCard = ref({
	name: "",
	img: "",
	cmd: "",
});

onMounted(() => {
	loadCards("C:\\Users\\QwQ\\Documents\\插件测试", app);
	loadCards("E:\\RPGMV\\【已整理】\\莉可的不可思议差事\\莉可的不可思议差事 Ver 1.41", app);
	loadCards("E:\\RPGMV\\【已整理】\\Mary↑GO→LAND!!\\Mary↑GO→LAND!! Ver1.10\\www", app);
	loadCards("E:\\RPGMV\\【已整理】\\Memories Story～囚われの者たち～\\Memories Story～囚われの者たち～ Ver1.01", app);
	loadCards("E:\\RPGMV\\【已整理】\\あの夏の島\\あの夏の島_Ver1.01", app);
	loadCards("E:\\RPGMV\\【未处理】\\240302\\www", app);
	window.addEventListener("keydown", handleF5);
});

onBeforeUnmount(() => {
	window.removeEventListener("keydown", handleF5);
});

function updateMessage() {
	message.value = "消息已更新！";
}

function expandSidebar() {
	isSidebarExpanded.value = true;
}

function collapseSidebar() {
	isSidebarExpanded.value = false;
}

function showCardName(cardName) {
	console.log(`卡片名称: ${cardName}`);
}

function handleCardClick(card, index) {
	console.log(`卡片点击: ${card.name}, 索引: ${index}`);
}

const showDeleteButton = (card, index) => {
	if (activeDeleteIndex.value !== index) {
		activeDeleteIndex.value = index;
		listData.value.forEach((card, i) => {
			card.showDelete = i === index;
		});
	} else {
		activeDeleteIndex.value = null;
		card.showDelete = false;
	}
};

const deleteCard = (index) => {
	listData.value.splice(index, 1);
	activeDeleteIndex.value = null;
};

// 提交卡片数据并关闭弹窗
const submitCard = () => {
	listData.value.push(newCard.value);
	isModalOpen.value = false; // 关闭弹窗
	console.log("新卡片已添加:", newCard.value);
};

// 关闭弹窗
const closeModal = () => {
	isModalOpen.value = false;
};

// Trigger File Input
const triggerFileInput = () => {
	const input = document.createElement("input");
	input.type = "file";
	input.nwdirectory = true;
	input.onchange = (event) => {
		if (event.target.files) {
			console.log("path", event.target.files[0].path);
			setCards(event.target.files[0].path, app); // 使用 setCards
		}
	};
	input.click();
};

const getImageUrl = (card) => {
	if (card.key) {
		if (card.engine == "RMMV") {
			return Decrypter.decryptImg(card.img);
		}
	} else return card.img;
};

const handleF5 = (event) => {
	if (event.key === "F5") {
		event.preventDefault();
		location.reload();
	}
};

// Modal 控制方法
const openModal = () => {
	isModalOpen.value = true;
};

const closeModal = () => {
	isModalOpen.value = false;
	// 重置新卡片数据
	newCard.value = { name: "", img: "", cmd: "" };
};

const addCard = () => {
	// 将新的卡片数据添加到 listData
	listData.value.push({ ...newCard.value, showDelete: false });
	closeModal();
};

const handleImageUpload = (event) => {
	const file = event.target.files[0];
	if (file) {
		const reader = new FileReader();
		// 读取文件并转换为数据 URL
		reader.onload = (e) => {
			newCard.value.img = e.target.result; // 更新 img 路径为 Data URL
		};
		reader.readAsDataURL(file); // 将图片读取为数据URL
	}
};

// TODO: 用库重构成合适的文件读取
const handleCardDblClick = (card, index) => {
	// const { spawn } = require("child_process");
	// const exec = require("child_process").exec;
	// const path = require("path");
	// var nwjsPath = "E:\\RM_RPG\\【道果】\\nw\\nw.exe";
	// var cmdPath = "E:\\RM_RPG\\【道果】\\nw\\app";
	// var appPath = cmdPath + "\\app副本";
	// var jsPath = cmdPath + "\\PC\\www\\js\\";
	// console.log("启动项目:", card.cmd);
	// var project = spawn(nwjsPath, ["."], {
	// 	cwd: appPath,
	// 	detached: true,
	// 	env: { Project_Path: card.cmd, jsPath: jsPath },
	// });
};

// 以下为工具函数
// ——————————————————————————————

const fs = require("fs");
const path = require("path");

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
		listData.value.push(newCard);

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
	/* Modal 样式 */
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

	/* Modal 内容样式 */
	.modal-content {
		background: white;
		padding: 20px;
		border-radius: 15px; /* 圆角 */
		width: 700px; /* 模态框宽度 */
		height: 500px; /* 模态框高度 */
		display: flex;
		flex-direction: column; /* 垂直布局 */
		gap: 15px; /* 子元素之间的间距 */
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* 阴影效果 */
		overflow-y: auto; /* 内容超出时显示垂直滚动条 */
		max-height: 90vh; /* 最大高度，防止超出视口 */
		padding-right: 12px; /* 微调右内边距，防止滚动条遮挡内容 */
	}

	/* Modal 内容布局 */
	.modal-body {
		display: flex;
		gap: 20px; /* 子元素之间的间距 */
	}

	/* 左侧面板: 图片预览 */
	.left-panel {
		flex: 1; /* 占据一部分宽度 */
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* 右侧面板: 表单 */
	.right-panel {
		flex: 1.5; /* 占据较大部分 */
		display: flex;
		flex-direction: column;
		gap: 15px; /* 子元素之间的间距 */
	}

	/* 表单组: 标签和输入框 */
	.modal-content .input-group {
		display: flex;
		justify-content: space-between; /* 标签和输入框两端对齐 */
		align-items: center; /* 垂直居中 */
		gap: 10px; /* 标签和输入框之间的间距 */
	}

	/* 表单标签样式 */
	.modal-content label {
		font-size: 14px;
		color: #333;
		width: 30%; /* 标签的宽度 */
	}

	/* 输入框样式 */
	.modal-content input[type="text"],
	.modal-content input[type="file"] {
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 8px; /* 圆角 */
		font-size: 14px;
		width: 65%; /* 输入框的宽度 */
	}

	/* 按钮样式 */
	.modal-content button {
		padding: 10px;
		background-color: #4caf50;
		color: white;
		border: none;
		border-radius: 8px; /* 圆角 */
		cursor: pointer;
		font-size: 16px;
		transition: background-color 0.3s;
	}

	.modal-content button:hover {
		background-color: #45a049;
	}

	/* 取消按钮 */
	.modal-content button:nth-child(2) {
		background-color: #f44336;
	}

	.modal-content button:nth-child(2):hover {
		background-color: #e53935;
	}

	/* 自定义滚动条样式 */
	.modal-content::-webkit-scrollbar {
		width: 8px; /* 滚动条宽度 */
	}

	/* 滚动条滑块 (Thumb) */
	.modal-content::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.3); /* 滑块颜色 */
		border-radius: 10px; /* 滑块圆角 */
	}

	/* 恢复默认滚动条轨道样式 (去除自定义) */
	.modal-content::-webkit-scrollbar-track {
		background: none; /* 恢复默认背景 */
	}

	/* 调整滚动条滑块高度 */
	.modal-content::-webkit-scrollbar-thumb {
		height: 30px; /* 滑块高度，防止滚动条过长 */
	}

	/* Modal 按钮布局 */
	.modal-actions {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}

	// ______________

	/* style.css */

	/* 全局样式 */
	body {
		font-family: "Arial", sans-serif;
		margin: 0;
		padding: 0;
		display: flex;
		height: 100vh;
		background-color: #f4f7fc;
		overflow: hidden; /* 禁止整个页面的滚动条 */
	}

	/* 侧边栏样式 */
	.sidebar {
		background-color: #f39c12; /* 设置背景颜色为橙色 */
		color: white;
		height: 100%; /* 设置高度为100% */
		width: 60px; /* 默认宽度 */
		transition: width 0.3s ease; /* 设置宽度的过渡动画效果 */
		position: fixed;
		top: 0;
		left: 0;
		padding-top: 20px;
		overflow: hidden;
		z-index: 100;
	}

	/* 侧边栏展开时 */
	.sidebar.expanded {
		width: 250px; /* 展开时宽度 */
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
		background-color: #e67e22; /* 鼠标悬停时背景颜色 */
	}

	/* 主内容区域 */
	.main-content {
		flex-grow: 1;
		background-color: #f4f7fc;
		padding: 20px;
		transition: margin-left 0.3s ease;
		margin-left: 60px; /* 默认左边距，匹配侧边栏宽度 */
		overflow: hidden; /* 防止溢出 */
	}

	.sidebar.expanded + .main-content {
		margin-left: 250px; /* 展开侧边栏时主内容区域的左边距 */
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

	/* 卡片容器样式 */
	.cards-container {
		display: flex;
		flex-wrap: wrap;
		gap: 20px; /* 卡片之间的间距 */
		justify-content: flex-start; /* 确保卡片从左边开始排列 */
		overflow-y: auto; /* 显示垂直滚动条 */
		max-height: 80vh; /* 最大高度，确保卡片容器不会超出视口 */
		padding: 10px;
	}

	.card {
		background-color: white;
		border-radius: 8px;
		box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
		width: 250px; /* 每张卡片的宽度 */
		height: 220px; /* 修改为220px的卡片高度 */
		position: relative; /* 用于定位图片 */
		overflow: hidden; /* 防止图片溢出卡片 */
		transition:
			transform 0.3s ease,
			border 0.3s ease;
		border: 2px solid transparent; /* 默认透明边框 */
	}

	/* 卡片悬停时的边框 */
	.card:hover {
		transform: translateY(-5px); /* 鼠标悬停时的浮动效果 */
		border: 2px solid #f39c12; /* 鼠标悬停时边框颜色 */
	}

	/* 卡片图片容器 */
	.card-image-container {
		position: relative;
		width: 100%;
		height: 60%; /* 图片容器只占据卡片的上半部分 */
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
		object-fit: cover; /* 确保图片的宽高比不变且填满容器 */
	}

	/* 标题样式 */
	.card h3 {
		color: #333;
		font-size: 16px; /* 略微调小标题字体 */
		margin: 5px 6px; /* 调整标题的上下边距 */
		text-align: left;
	}

	/* 文本样式 */
	.card p {
		color: #555;
		font-size: 13px; /* 修改为13px的文本字体 */
		text-align: left;
		margin: 5px 6px; /* 调整文本的上下边距 */
		padding: 0; /* 去除文本的内边距 */
	}

	/* 分割线样式 */
	.card .divider {
		height: 1px;
		background-color: rgba(0, 0, 0, 0.1); /* 半透明的黑色分割线 */
		margin: 5px 10px; /* 调整分割线的上下边距 */
	}

	/* 删除按钮样式 */
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

	/* 齿轮按钮样式 */
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

	/* 鼠标悬停时显示齿轮按钮 */
	.card:hover .gear-button {
		display: flex;
	}

	/* 圆形加号按钮样式 */
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
