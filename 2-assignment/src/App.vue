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
    </header>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

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
</style>
