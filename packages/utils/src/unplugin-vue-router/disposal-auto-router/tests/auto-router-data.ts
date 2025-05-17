/**
 * 自动化路由直接生成的路由数据
 *
 * @description
 * 来自于以下对象
 * import { routes } from "vue-router/auto-routes";
 *
 * 该测试数据来自于标号为 10wms 项目的数据。
 */
export const autoRouterData = [
	{
		path: "/",
		name: "Login",
		meta: {
			layout: "login",
			menuType: "ignore",
		},
		alias: [],
	},
	{
		path: "/base-config",
		children: [
			{
				path: "",
				name: "base-config",
				meta: {
					menuType: "folder",
					text: "基础配置",
					icon: {
						name: "Box",
						__name: "box",
					},
				},
				alias: [],
			},
			{
				path: "auto-coding",
				children: [
					{
						path: "",
						name: "base-config-auto-coding",
						meta: {
							menuType: "page",
							text: "自动编码",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "encoding-type",
				children: [
					{
						path: "",
						name: "base-config-encoding-type",
						meta: {
							menuType: "page",
							text: "编码类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "flat-type",
				children: [
					{
						path: "",
						name: "base-config-flat-type",
						meta: {
							menuType: "page",
							text: "单位类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "measuring-unit",
				children: [
					{
						path: "",
						name: "base-config-measuring-unit",
						meta: {
							menuType: "page",
							text: "计量单位",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "parameter-type",
				children: [
					{
						path: "",
						name: "base-config-parameter-type",
						meta: {
							menuType: "page",
							text: "参数类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "product-attribute",
				children: [
					{
						path: "",
						name: "base-config-product-attribute",
						meta: {
							menuType: "page",
							text: "产品属性",
							icon: {
								name: "InfoFilled",
								__name: "info-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "product-category",
				children: [
					{
						path: "",
						name: "base-config-product-category",
						meta: {
							menuType: "page",
							text: "商品类目",
							icon: {
								name: "Goods",
								__name: "goods",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "quality-code",
				children: [
					{
						path: "",
						name: "base-config-quality-code",
						meta: {
							menuType: "page",
							text: "品质代码",
							icon: {
								name: "Medal",
								__name: "medal",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "quality-inspection-status",
				children: [
					{
						path: "",
						name: "base-config-quality-inspection-status",
						meta: {
							menuType: "page",
							text: "品检状态",
							icon: {
								name: "CircleCheck",
								__name: "circle-check",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "system-parameter",
				children: [
					{
						path: "",
						name: "base-config-system-parameter",
						meta: {
							menuType: "page",
							text: "系统参数",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/base-data",
		children: [
			{
				path: "",
				name: "base-data",
				meta: {
					menuType: "folder",
					text: "基础资料",
					icon: "WarningFilled",
					order: 10,
				},
				alias: [],
			},
			{
				path: "commodity",
				children: [
					{
						path: "",
						name: "base-data-commodity",
						meta: {
							menuType: "page",
							text: "商品",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "commodity-detail",
				children: [
					{
						path: "",
						name: "base-data-commodity-detail",
						meta: {
							menuType: "page",
							text: "商品明细",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "customer",
				children: [
					{
						path: "",
						name: "base-data-customer",
						meta: {
							menuType: "page",
							text: "客户",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "RFID",
				children: [
					{
						path: "",
						name: "base-data-RFID",
						meta: {
							menuType: "page",
							text: "RFID",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "supplier",
				children: [
					{
						path: "",
						name: "base-data-supplier",
						meta: {
							menuType: "page",
							text: "供应商",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "third-customer",
				children: [
					{
						path: "",
						name: "base-data-third-customer",
						meta: {
							menuType: "page",
							text: "第三方客户",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/billing-configuration",
		children: [
			{
				path: "",
				name: "billing-configuration",
				meta: {
					menuType: "folder",
					text: "计费配置",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "billing-commodity-category",
				children: [
					{
						path: "",
						name: "billing-configuration-billing-commodity-category",
						meta: {
							menuType: "page",
							text: "计费商品类",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "billing-date",
				children: [
					{
						path: "",
						name: "billing-configuration-billing-date",
						meta: {
							menuType: "page",
							text: "计费日期",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "billing-mode",
				children: [
					{
						path: "",
						name: "billing-configuration-billing-mode",
						meta: {
							menuType: "page",
							text: "计费方式",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "contract-billing-method",
				children: [
					{
						path: "",
						name: "billing-configuration-contract-billing-method",
						meta: {
							menuType: "page",
							text: "合同计费方式",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "customer-billing-configuration",
				children: [
					{
						path: "",
						name: "billing-configuration-customer-billing-configuration",
						meta: {
							menuType: "page",
							text: "客户计费属性配置",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "expense-name",
				children: [
					{
						path: "",
						name: "billing-configuration-expense-name",
						meta: {
							menuType: "page",
							text: "费用名称",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "expense-template",
				children: [
					{
						path: "",
						name: "billing-configuration-expense-template",
						meta: {
							menuType: "page",
							text: "费用模板",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "expense-type",
				children: [
					{
						path: "",
						name: "billing-configuration-expense-type",
						meta: {
							menuType: "page",
							text: "费用类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "measurement-type",
				children: [
					{
						path: "",
						name: "billing-configuration-measurement-type",
						meta: {
							menuType: "page",
							text: "计费类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "price-type",
				children: [
					{
						path: "",
						name: "billing-configuration-price-type",
						meta: {
							menuType: "page",
							text: "价格类型",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "warehousing-rate",
				children: [
					{
						path: "",
						name: "billing-configuration-warehousing-rate",
						meta: {
							menuType: "page",
							text: "仓储费率",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/customer-report",
		children: [
			{
				path: "",
				name: "customer-report",
				meta: {
					menuType: "folder",
					text: "客户报表",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "repertory",
				children: [
					{
						path: "",
						name: "customer-report-repertory",
						meta: {
							menuType: "page",
							text: "客户库存",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "validity-warn",
				children: [
					{
						path: "",
						name: "customer-report-validity-warn",
						meta: {
							menuType: "page",
							text: "效期预警",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/daily-check",
		children: [
			{
				path: "",
				name: "daily-check",
				meta: {
					menuType: "folder",
					text: "每日检查",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "abnormal-shipment",
				children: [
					{
						path: "",
						name: "daily-check-abnormal-shipment",
						meta: {
							menuType: "page",
							text: "出货异常",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "received-unsold",
				children: [
					{
						path: "",
						name: "daily-check-received-unsold",
						meta: {
							menuType: "page",
							text: "收货未上架",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "shipment-delay-warn",
				children: [
					{
						path: "",
						name: "daily-check-shipment-delay-warn",
						meta: {
							menuType: "page",
							text: "出货延迟预警",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "temperature-maintain",
				children: [
					{
						path: "",
						name: "daily-check-temperature-maintain",
						meta: {
							menuType: "page",
							text: "温度维护",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/home",
		children: [
			{
				path: "",
				name: "home",
				meta: {
					menuType: "page",
					text: "首页",
					icon: "no-use-any-icon",
				},
				alias: [],
			},
		],
	},
	{
		path: "/inventory-management",
		children: [
			{
				path: "",
				name: "inventory-management",
				meta: {
					menuType: "folder",
					text: "盘点管理",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "comprehensive-inventory",
				children: [
					{
						path: "",
						name: "inventory-management-comprehensive-inventory",
						meta: {
							menuType: "page",
							text: "综合盘点",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "differentialposting",
				children: [
					{
						path: "",
						name: "inventory-management-differentialposting",
						meta: {
							menuType: "page",
							text: "盘点差异过账",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "double-quotation",
				children: [
					{
						path: "",
						name: "inventory-management-double-quotation",
						meta: {
							menuType: "page",
							text: "复盘",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "inventory",
				children: [
					{
						path: "",
						name: "inventory-management-inventory",
						meta: {
							menuType: "page",
							text: "盘点",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "inventory-difference",
				children: [
					{
						path: "",
						name: "inventory-management-inventory-difference",
						meta: {
							menuType: "page",
							text: "盘点差异",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "moveInventory",
				children: [
					{
						path: "",
						name: "inventory-management-moveInventory",
						meta: {
							menuType: "page",
							text: "动碰盘",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "moving-count",
				children: [
					{
						path: "",
						name: "inventory-management-moving-count",
						meta: {
							menuType: "page",
							text: "动仓盘点",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "shelf-adjustment",
				children: [
					{
						path: "",
						name: "inventory-management-shelf-adjustment",
						meta: {
							menuType: "page",
							text: "上架调整",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "takedown-adjustment",
				children: [
					{
						path: "",
						name: "inventory-management-takedown-adjustment",
						meta: {
							menuType: "page",
							text: "下架调整",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/message-middle",
		children: [
			{
				path: "",
				name: "message-middle",
				meta: {
					menuType: "folder",
					text: "消息中间件",
					icon: "IconMessage",
				},
				alias: [],
			},
			{
				path: "message-center",
				children: [
					{
						path: "",
						name: "message-middle-message-center",
						meta: {
							menuType: "page",
							text: "消息中心",
							icon: "IconMessage",
						},
						alias: [],
					},
				],
			},
			{
				path: "message-template",
				children: [
					{
						path: "",
						name: "message-middle-message-template",
						meta: {
							menuType: "page",
							text: "消息模块",
							icon: "IconMessage",
						},
						alias: [],
					},
				],
			},
			{
				path: "work-setting",
				children: [
					{
						path: "",
						name: "message-middle-work-setting",
						meta: {
							menuType: "page",
							text: "业务配置",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "work-sql",
				children: [
					{
						path: "",
						name: "message-middle-work-sql",
						meta: {
							menuType: "page",
							text: "业务SQL",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/outbound",
		children: [
			{
				path: "",
				name: "outbound",
				meta: {
					menuType: "folder",
					text: "出库管理",
					icon: {
						name: "Box",
						__name: "box",
					},
				},
				alias: [],
			},
			{
				path: "picking",
				children: [
					{
						path: "",
						name: "outbound-picking",
						meta: {
							menuType: "page",
							text: "按单拣货",
							icon: {
								name: "Tickets",
								__name: "tickets",
							},
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/personnel-config",
		children: [
			{
				path: "",
				name: "personnel-config",
				meta: {
					menuType: "folder",
					text: "人员配置",
					icon: {
						name: "User",
						__name: "user",
					},
				},
				alias: [],
			},
			{
				path: "academic-code",
				children: [
					{
						path: "",
						name: "personnel-config-academic-code",
						meta: {
							menuType: "page",
							text: "学历代码",
							icon: {
								name: "Clock",
								__name: "clock",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "employment-status",
				children: [
					{
						path: "",
						name: "personnel-config-employment-status",
						meta: {
							menuType: "page",
							text: "在职状态",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "gender-code",
				children: [
					{
						path: "",
						name: "personnel-config-gender-code",
						meta: {
							menuType: "page",
							text: "性别代码",
							icon: {
								name: "Clock",
								__name: "clock",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "work-status",
				children: [
					{
						path: "",
						name: "personnel-config-work-status",
						meta: {
							menuType: "page",
							text: "工作状态",
							icon: {
								name: "Clock",
								__name: "clock",
							},
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/purchase-management",
		children: [
			{
				path: "",
				name: "purchase-management",
				meta: {
					menuType: "folder",
					text: "进货管理",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "apointment-purchase",
				children: [
					{
						path: "",
						name: "purchase-management-apointment-purchase",
						meta: {
							menuType: "page",
							text: "预约进货",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "batch-receiving",
				children: [
					{
						path: "",
						name: "purchase-management-batch-receiving",
						meta: {
							menuType: "page",
							text: "批量收货",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "client-purchase",
				children: [
					{
						path: "",
						name: "purchase-management-client-purchase",
						meta: {
							menuType: "page",
							text: "客户进货",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "other-warehousing",
				children: [
					{
						path: "",
						name: "purchase-management-other-warehousing",
						meta: {
							menuType: "page",
							text: "其他入库",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "purchase-notification-details",
				children: [
					{
						path: "",
						name: "purchase-management-purchase-notification-details",
						meta: {
							menuType: "page",
							text: "进货通知明细",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "receied-unlisted-stock",
				children: [
					{
						path: "",
						name: "purchase-management-receied-unlisted-stock",
						meta: {
							menuType: "page",
							text: "收货未上架库存",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "receiving-register",
				children: [
					{
						path: "",
						name: "purchase-management-receiving-register",
						meta: {
							menuType: "page",
							text: "收货登记",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "stock-inquiry",
				children: [
					{
						path: "",
						name: "purchase-management-stock-inquiry",
						meta: {
							menuType: "page",
							text: "库存查询",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/regional-allocation",
		children: [
			{
				path: "",
				name: "regional-allocation",
				meta: {
					menuType: "folder",
					text: "地区配置",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "area-information",
				children: [
					{
						path: "",
						name: "regional-allocation-area-information",
						meta: {
							menuType: "page",
							text: "大区信息",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "city-type",
				children: [
					{
						path: "",
						name: "regional-allocation-city-type",
						meta: {
							menuType: "page",
							text: "城市分类",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "district-information",
				children: [
					{
						path: "",
						name: "regional-allocation-district-information",
						meta: {
							menuType: "page",
							text: "片区信息",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "regional-information",
				children: [
					{
						path: "",
						name: "regional-allocation-regional-information",
						meta: {
							menuType: "page",
							text: "地区信息",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/sample",
		children: [
			{
				path: "",
				name: "sample",
				meta: {
					menuType: "page",
					isSample: true,
					text: "自测组件-演示页面",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "dialog-promise",
				children: [
					{
						path: "",
						name: "sample-dialog-promise",
						meta: {
							menuType: "page",
							isSample: true,
							text: "命令式弹框",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "dinamic-form",
				children: [
					{
						path: "",
						name: "sample-dinamic-form",
						meta: {
							menuType: "page",
							isSample: true,
							text: "动态表单演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "dinamic-table-form",
				children: [
					{
						path: "",
						name: "sample-dinamic-table-form",
						meta: {
							menuType: "page",
							isSample: true,
							text: "动态表格样式表单",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "echarts",
				children: [
					{
						path: "",
						name: "sample-echarts",
						meta: {
							menuType: "page",
							isSample: true,
							text: "图表演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "editor",
				children: [
					{
						path: "",
						name: "sample-editor",
						meta: {
							menuType: "page",
							isSample: true,
							text: "富文本框演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "excel",
				children: [
					{
						path: "",
						name: "sample-excel",
						meta: {
							menuType: "page",
							isSample: true,
							text: "Excel演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "exporter",
				children: [
					{
						path: "",
						name: "sample-exporter",
						meta: {
							menuType: "page",
							isSample: true,
							text: "下载导出按钮演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "file-upload",
				children: [
					{
						path: "",
						name: "sample-file-upload",
						meta: {
							menuType: "page",
							isSample: true,
							text: "文件上传",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "flow",
				children: [
					{
						path: "",
						name: "sample-flow",
						meta: {
							menuType: "page",
							isSample: true,
							text: "流程图编辑器演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "form-create",
				children: [
					{
						path: "",
						name: "sample-form-create",
						meta: {
							menuType: "page",
							isSample: true,
							text: "可视化表单演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "pagination",
				children: [
					{
						path: "",
						name: "sample-pagination",
						meta: {
							menuType: "page",
							isSample: true,
							text: "分页栏组件",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "pdf-object",
				name: "sample-pdf-object",
				meta: {
					menuType: "page",
					isSample: true,
					text: "PDF预览演示",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "print",
				children: [
					{
						path: "",
						name: "sample-print",
						meta: {
							menuType: "page",
							isSample: true,
							text: "打印演示",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "table",
				children: [
					{
						path: "",
						name: "sample-table",
						meta: {
							menuType: "page",
							isSample: true,
							text: "表格组件",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "table-title-display",
				children: [
					{
						path: "",
						name: "sample-table-title-display",
						meta: {
							menuType: "page",
							isSample: true,
							text: "表格标题栏",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "test-popup",
				children: [
					{
						path: "",
						name: "sample-test-popup",
						meta: {
							menuType: "page",
							isSample: true,
							text: "弹窗组件",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/system-manage",
		children: [
			{
				path: "",
				name: "system-manage",
				meta: {
					menuType: "folder",
					text: "系统管理",
					icon: "IconSetting",
				},
				alias: [],
			},
			{
				path: "catagory",
				children: [
					{
						path: "",
						name: "system-manage-catagory",
						meta: {
							menuType: "page",
							text: "分类管理",
							icon: {
								name: "UserFilled",
								__name: "user-filled",
							},
						},
						alias: [],
					},
				],
			},
			{
				path: "dictionary",
				children: [
					{
						path: "",
						name: "system-manage-dictionary",
						meta: {
							menuType: "page",
							text: "数据字典",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "icon",
				children: [
					{
						path: "",
						name: "system-manage-icon",
						meta: {
							menuType: "page",
							text: "系统图标",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "language",
				children: [
					{
						path: "",
						name: "system-manage-language",
						meta: {
							menuType: "page",
							text: "国际化语言",
							icon: "IconSetting",
						},
						alias: [],
					},
				],
			},
			{
				path: "menu-management",
				children: [
					{
						path: "",
						name: "system-manage-menu-management",
						meta: {
							menuType: "page",
							text: "菜单管理",
							icon: "IconMenu",
						},
						alias: [],
					},
				],
			},
			{
				path: "organization-institution",
				children: [
					{
						path: "",
						name: "system-manage-organization-institution",
						meta: {
							menuType: "page",
							text: "组织机构",
							icon: "IconHouse",
						},
						alias: [],
					},
				],
			},
			{
				path: "role-management",
				children: [
					{
						path: "",
						name: "system-manage-role-management",
						meta: {
							menuType: "page",
							text: "角色管理",
							icon: "IconUser",
						},
						alias: [],
					},
				],
			},
			{
				path: "system-notice",
				children: [
					{
						path: "",
						name: "system-manage-system-notice",
						meta: {
							menuType: "page",
							text: "系统公告",
							icon: "IconMessage",
						},
						alias: [],
					},
				],
			},
			{
				path: "user-management",
				children: [
					{
						path: "",
						name: "system-manage-user-management",
						meta: {
							menuType: "page",
							text: "用户管理",
							icon: "IconUser",
						},
						alias: [],
					},
				],
			},
		],
	},
	{
		path: "/ware-config",
		children: [
			{
				path: "",
				name: "ware-config",
				meta: {
					menuType: "folder",
					text: "仓库管理",
					icon: {
						name: "Box",
						__name: "box",
					},
				},
				alias: [],
			},
			{
				path: "order-type",
				children: [
					{
						path: "",
						name: "ware-config-order-type",
						meta: {
							menuType: "page",
							text: "订单类型",
							icon: {
								name: "Tickets",
								__name: "tickets",
							},
						},
						alias: [],
					},
				],
			},
		],
	},
];
