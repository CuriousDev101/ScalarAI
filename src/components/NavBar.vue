<script setup lang="ts">
import router from '@/router';
import { useAuthStore } from '@/stores/useAuthStore';

const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
  router.push("/login");
}
</script>

<template>
  <div class="navbar bg-base-100 border-b border-gray-800">
    <div class="flex-1">
      <RouterLink to="/" class="btn btn-ghost text-xl">ScalarAI</RouterLink>
    </div>
    <div class="flex-none">
      <ul class="menu menu-horizontal px-1">
        <li v-if="!authStore.isAuthenticated">
          <RouterLink to="/login">Login</RouterLink>
        </li>
        <li v-if="!authStore.isAuthenticated">
          <RouterLink to="/signup">Signup</RouterLink>
        </li>
        <li v-if="authStore.isAuthenticated && authStore.isAdmin">
          <RouterLink to="/admin">Admin</RouterLink>
        </li>
        <li v-if="authStore.isAuthenticated">
          <details>
            <summary>
              User
            </summary>
            <ul class="p-2 bg-base-100 rounded-t-none">
              <li><a @click="logout">Logout</a></li>
            </ul>
          </details>
        </li>
      </ul>
    </div>
  </div>
</template>
