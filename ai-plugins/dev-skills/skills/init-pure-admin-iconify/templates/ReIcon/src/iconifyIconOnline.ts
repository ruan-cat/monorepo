import { Icon as IconifyIcon } from "@iconify/vue";
import { defineComponent, h } from "vue";

export default defineComponent({
	name: "IconifyIconOnline",
	props: {
		icon: {
			type: String,
			default: "",
		},
	},
	render() {
		const attrs = this.$attrs;

		return h(IconifyIcon, {
			icon: this.icon,
			"aria-hidden": false,
			style: attrs.style ? { ...(attrs.style as object), outline: "none" } : { outline: "none" },
			...attrs,
		});
	},
});
