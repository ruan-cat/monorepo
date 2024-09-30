import { createApp } from "vue";

import "./style.css";
import App from "./App.vue";

import "@giegie/components/es/style.css";
import GieComponents from "@giegie/components";

createApp(App)
	//
	.use(GieComponents)
	.mount("#app");
