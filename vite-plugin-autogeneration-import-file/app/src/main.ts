import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import Vue3Toasity, { type ToastContainerOptions } from "vue3-toastify";
import "vue3-toastify/dist/index.css";

const app = createApp(App);

app.use(Vue3Toasity, <ToastContainerOptions>{
	autoClose: 3000,
	multiple: true,
	limit: 9,
	position: "bottom-right",
	transition: "slide",
	// hideProgressBar: false,
	closeOnClick: true,
	closeButton: true,
});

app.mount("#app");
