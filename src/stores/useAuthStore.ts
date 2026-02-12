import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		token: localStorage.getItem("token") as string | null,
		user: JSON.parse(localStorage.getItem("user") || "null") as any,
	}),
	getters: {
		isAuthenticated: (state) => !!state.token,
		isAdmin: (state) => state.user?.role === "admin",
	},
	actions: {
		logout() {
			this.user = null;
			this.token = null;
			localStorage.removeItem("token");
			localStorage.removeItem("user");
		},
	},
});
