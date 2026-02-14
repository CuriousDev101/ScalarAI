import type { User } from "@/types.ts";
import api from "@/utils/axios";
import {
	loadFromStorage,
	removeFromStorage,
	saveToStorage,
} from "@/utils/storage";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		token: loadFromStorage("token") as string | null,
		user: ref(JSON.parse(loadFromStorage("user")!)),
	}),
	getters: {
		isAuthenticated: (state) => !!state.token,
	},
	actions: {
		async signup(name: string, email: string, password: string) {
			try {
				const response = await api.post("/api/auth/signup", {
					name,
					email,
					password,
				});
				this.token = response.data.token;
				this.user = response.data.user as User;

				saveToStorage("token", this.token!);
				saveToStorage("user", JSON.stringify(this.user));
				return true;
			} catch (error) {
				console.error("Signup failed", error);
				return false;
			}
		},
		async login(email: string, password: string) {
			try {
				const response = await api.post("/api/auth/login", {
					email,
					password,
				});
				this.token = response.data.token;
				this.user = response.data.user;
				console.log(this.user);

				saveToStorage("token", this.token!);
				saveToStorage("user", JSON.stringify(this.user));
				return true;
			} catch (error) {
				console.error("Login failed", error);
				return false;
			}
		},
		logout() {
			this.user = null;
			this.token = null;
			removeFromStorage("token");
			removeFromStorage("user");
		},
	},
});
