import type { Component } from "vue";

export interface ReIconProps {
	icon: string | Component;
}

export interface ReIconOption {
	label: string;
	icon: string | Component;
	description?: string;
}
