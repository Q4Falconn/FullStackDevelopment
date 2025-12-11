<template>
  <section class="auth">
    <h1>Register</h1>

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
          autocomplete="new-password"
          required
        />
      </div>

      <div class="field">
        <label>Repeat password</label>
        <input
          v-model="repeatPassword"
          type="password"
          autocomplete="new-password"
          required
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit">Create account</button>
    </form>

    <p class="hint">
      Already registered?
      <RouterLink to="/login">Login</RouterLink>
    </p>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const auth = useAuthStore();
const router = useRouter();

const username = ref("");
const password = ref("");
const repeatPassword = ref("");
const error = ref("");

const onSubmit = () => {
  error.value = "";
  if (password.value !== repeatPassword.value) {
    error.value = "Passwords do not match";
    return;
  }

  try {
    auth.register(username.value, password.value);
    router.push("/");
  } catch (e: any) {
    error.value = e?.message || "Registration failed";
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
