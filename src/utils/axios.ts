import { useAuthStore } from "@/stores/useAuthStore";
import axios from "axios";

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	withCredentials: true,
});

api.interceptors.request.use(
	(config) => {
		const authStore = useAuthStore();
		const token = authStore.token;
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

export default api;
