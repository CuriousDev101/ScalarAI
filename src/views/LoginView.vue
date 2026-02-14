<script setup lang="ts">
import { useAuthStore } from '@/stores/useAuthStore';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const email = ref("")
const password = ref("")
const authStore = useAuthStore();
const router = useRouter()
const error = ref("")

const login = async () => {
  const success = await authStore.login(email.value, password.value)

  if (success) {
    router.push("/admin")
  } else {
    error.value = 'Login failed';
  }
}

const onBlur = () => {
  error.value = ""
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content flex-col justify-between">
      <form @submit.prevent="login"
        class="fieldset bg-base-100 border-base-300 rounded-box border gap-5 p-5 w-xs md:w-125 ">
        <div v-if="error" class="text-lg text-red-500">
          {{ error }}
        </div>

        <fieldset class="fieldset">
          <label class="label">Email</label>
          <input v-model="email" @blur="onBlur" type="email" class="input validator outline-0 w-full"
            placeholder="Email" required />
          <p class="validator-hint hidden">Required</p>
        </fieldset>

        <label class="fieldset">
          <span class="label">Password</span>
          <input v-model="password" @blur="onBlur" type="password" class="input validator outline-0 w-full"
            placeholder="Password" required />
          <span class="validator-hint hidden">Required</span>
        </label>

        <button class="btn mt-4" type="submit">Login</button>
      </form>
    </div>
  </div>
</template>
