<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const auth = useAuthStore();
const router = useRouter();

const logout = () => {
  auth.logout();
  router.push("/login");
};
</script>

<template>
  <div id="app">
    <header class="header">
      <h2>UNO Assignment</h2>

      <nav class="top-nav">
        <RouterLink to="/">Setup</RouterLink>
        <RouterLink to="/play">Play</RouterLink>
        <RouterLink to="/game-over">Game Over</RouterLink>
        <RouterLink to="/summary">Summary</RouterLink>
      </nav>

      <div class="auth-area">
        <template v-if="auth.isAuthenticated">
          <span class="user">Hi, {{ auth.user?.username }}</span>
          <button type="button" @click="logout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login">Login</RouterLink>
          <RouterLink to="/register">Register</RouterLink>
        </template>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  border-bottom: 1px solid #ddd;
}

.top-nav {
  display: flex;
  gap: 1rem;
}

.top-nav a.router-link-exact-active {
  font-weight: bold;
  text-decoration: underline;
}

.main {
  padding: 2rem;
}

.auth-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-area button {
  padding: 0.25rem 0.5rem;
}

.user {
  font-size: 0.9rem;
  opacity: 0.8;
}
</style>
