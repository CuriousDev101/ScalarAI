import { useAuthStore } from "@/stores/useAuthStore";
import AdminView from "@/views/AdminView.vue";
import ChatView from "@/views/ChatView.vue";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import SignupView from "@/views/SignupView.vue";
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{
			path: "/",
			name: "Home",
			component: HomeView,
		},
		{
			path: "/login",
			name: "Login",
			component: LoginView,
		},
		{
			path: "/signup",
			name: "Signup",
			component: SignupView,
		},
		{
			path: "/admin",
			name: "Admin",
			component: AdminView,
			meta: {
				requiresAuth: true,
				// requiresAdmin: true,
				title: "knowledge Dashboard",
			},
		},
		{
			path: "/chat",
			name: "Chat",
			component: ChatView,
			meta: {
				requiresAuth: true,
				// requiresAdmin: true,
				title: "New Chat",
			},
		},
	],
});

router.beforeEach((to, _from, next) => {
	const authStore = useAuthStore();
	if (to.meta.requiresAuth && !authStore.isAuthenticated) {
		next("/login");
	} else if (to.meta.requiresAdmin) {
		next("/chat");
	} else {
		next();
	}
});

export default router;
