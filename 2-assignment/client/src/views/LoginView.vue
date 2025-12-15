<template>
  <section class="auth">
    <h1>Login</h1>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label>Username</label>
        <input v-model="username" autocomplete="username" required />
      </div>

      <div class="field">
        <label>Password</label>
        <input
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit">Login</button>
    </form>

    <p class="hint">
      No account?
      <RouterLink to="/register">Register</RouterLink>
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref("");
const password = ref("");
const error = ref("");

const onSubmit = () => {
  error.value = "";
  try {
    auth.login(username.value, password.value);
    const redirect = (route.query.redirect as string) || "/";
    router.push(redirect);
  } catch (e: any) {
    error.value = e?.message || "Login failed";
  }
};
</script>

<style scoped>
.auth {
  max-width: 320px;
}
.field {
  margin-bottom: 0.75rem;
  display: flex;
  flex-direction: column;
}
.error {
  color: #c00;
  margin-bottom: 0.75rem;
}
.hint {
  margin-top: 1rem;
}
</style>
