import { defineComponent, h } from "vue";
import type { Component, PropType } from "vue";
import { resolveOfflineIcon } from "./offlineIcon";

export default defineComponent({
	name: "IconifyIconOffline",
	props: {
		icon: {
			type: [String, Object, Function] as PropType<string | Component>,
			default: "",
		},
	},
	render() {
		const attrs = this.$attrs;
		const iconComponent = typeof this.icon === "string" ? resolveOfflineIcon(this.icon) : (this.icon as Component);

		if (!iconComponent) {
			return null;
		}

		return h(iconComponent, attrs);
	},
});
