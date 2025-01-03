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
